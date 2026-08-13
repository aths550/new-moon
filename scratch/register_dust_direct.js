import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

const origLookup = dns.lookup;
dns.lookup = function (hostname, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  } else if (options === null || options === undefined) {
    options = {};
  }
  options.family = 4;
  options.verbatim = false;
  return origLookup.call(dns, hostname, options, callback);
};

import { WebSocket as WsWebSocket } from 'ws';

class IPv4WebSocket extends WsWebSocket {
  constructor(address, protocols, options) {
    if (typeof protocols === 'object' && !Array.isArray(protocols) && protocols !== null) {
      options = protocols;
      protocols = undefined;
    }
    const extraOpts = {
      family: 4,
      maxPayload: 100 * 1024 * 1024,
      handshakeTimeout: 30000,
    };
    const opts = typeof options === 'object' && options !== null 
      ? { ...extraOpts, ...options } 
      : extraOpts;
    super(address, protocols, opts);
  }
}

globalThis.WebSocket = IPv4WebSocket;

import pino from 'pino';
import * as rx from 'rxjs';
import { setNetworkId, getNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { MidnightWalletProvider } from '../auction-cli/dist/auction-cli/src/midnight-wallet-provider.js';
import { createKeystore } from '@midnight-ntwrk/wallet-sdk-unshielded-wallet';
import { getUnshieldedSeed } from '../auction-cli/dist/auction-cli/src/generate-dust.js';

async function main() {
  setNetworkId('preprod');
  const logger = pino({ level: 'info' });
  const seed = 'f780f810991ad89f4b92f2b021d2b2c87d2c2e18594e4a5551ef66fc57f80aaa';

  const envConfig = {
    walletNetworkId: 'preprod',
    networkId: 'preprod',
    indexer: 'https://indexer.preprod.midnight.network/api/v4/graphql',
    indexerWS: 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws',
    node: 'https://rpc.preprod.midnight.network',
    nodeWS: 'wss://rpc.preprod.midnight.network',
    proofServer: 'http://localhost:6300',
    costParameters: {
      additionalFeeOverhead: '500000',
      feeBlocksMargin: 10,
    },
  };

  const walletProvider = await MidnightWalletProvider.build(logger, envConfig, seed);
  await walletProvider.start();

  console.log('Waiting for wallet state emission...');
  const walletState = await rx.firstValueFrom(
    walletProvider.wallet.state().pipe(
      rx.filter((s) => s.unshielded.availableCoins.length > 0),
    ),
  );

  const utxos = walletState.unshielded.availableCoins;
  console.log(`Found ${utxos.length} UTXOs for DUST registration`);

  const networkId = getNetworkId();
  const unshieldedKeystore = createKeystore(getUnshieldedSeed(seed), networkId);

  const dustAddress = walletState.dust.capabilities.keys.getAddress(walletState.dust.state);
  console.log('Dust recipient address:', dustAddress);

  console.log('Building DUST registration recipe...');
  const recipe = await walletProvider.wallet.registerNightUtxosForDustGeneration(
    utxos,
    unshieldedKeystore.getPublicKey(),
    (payload) => unshieldedKeystore.signData(payload),
    dustAddress,
  );

  console.log('Finalizing recipe...');
  const transaction = await walletProvider.wallet.finalizeRecipe(recipe);

  console.log('Submitting DUST registration transaction with 500k fee overhead...');
  const txId = await walletProvider.wallet.submitTransaction(transaction);
  console.log('====================================================');
  console.log('SUCCESS! DUST REGISTRATION TX ID:', txId);
  console.log('====================================================');

  await walletProvider.stop();
  process.exit(0);
}

main().catch((err) => {
  console.error('ERROR IN DUST REGISTRATION:', err);
  process.exit(1);
});
