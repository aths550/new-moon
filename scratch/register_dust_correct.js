import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

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
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { MidnightWalletProvider } from '../auction-cli/dist/auction-cli/src/midnight-wallet-provider.js';

async function main() {
  setNetworkId('preview');
  const logger = pino({ level: 'info' });
  const seed = 'f780f810991ad89f4b92f2b021d2b2c87d2c2e18594e4a5551ef66fc57f80aaa';

  const envConfig = {
    walletNetworkId: 'preview',
    networkId: 'preview',
    indexer: 'https://indexer.preview.midnight.network/api/v4/graphql',
    indexerWS: 'wss://indexer.preview.midnight.network/api/v4/graphql/ws',
    node: 'https://rpc.preview.midnight.network',
    nodeWS: 'wss://rpc.preview.midnight.network',
    proofServer: 'http://localhost:6300',
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

  const dustAddress = walletState.dust.capabilities.keys.getAddress(walletState.dust.state);
  console.log('Dust recipient address:', dustAddress);

  console.log('Building DUST registration recipe using provider keystore...');
  const recipe = await walletProvider.wallet.registerNightUtxosForDustGeneration(
    utxos,
    walletProvider.unshieldedKeystore.getPublicKey(),
    (payload) => walletProvider.unshieldedKeystore.signData(payload),
    dustAddress,
  );

  console.log('Finalizing recipe...');
  const transaction = await walletProvider.wallet.finalizeRecipe(recipe);

  console.log('Submitting DUST registration transaction to Preview network...');
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
