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
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { MidnightWalletProvider } from '../auction-cli/dist/auction-cli/src/midnight-wallet-provider.js';
import { createLogger } from '../auction-cli/dist/auction-cli/src/logger-utils.js';
import { AuctionAPI } from '../api/dist/api/src/index.js';

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

  console.log('Connecting to Preview network...');
  const walletProvider = await MidnightWalletProvider.build(logger, envConfig, seed);
  await walletProvider.start();

  console.log('Waiting for wallet state sync...');
  const walletState = await rx.firstValueFrom(
    walletProvider.wallet.state().pipe(
      rx.filter((s) => s.unshielded.availableCoins.length > 0),
    ),
  );

  console.log('Unshielded balance:', walletState.unshielded.availableCoins.length, 'UTXOs');

  let dustBalance = 0n;
  for (let attempt = 1; attempt <= 20; attempt++) {
    const currentState = await rx.firstValueFrom(walletProvider.wallet.state());
    const now = new Date();
    const coins = currentState.dust.capabilities.coinsAndBalances.getAvailableCoinsWithGeneratedDust(currentState.dust.state, now);
    dustBalance = coins.reduce((acc, coin) => acc + (coin.dustValue || 0n), 0n);

    console.log(`[Attempt ${attempt}/20] Current Dust Coins: ${coins.length}, Dust Balance: ${dustBalance.toString()}`);

    if (dustBalance > 0n || coins.length > 0) {
      console.log('Dust generated! Proceeding with contract deployment...');
      break;
    }

    if (attempt < 20) {
      console.log('Waiting 15 seconds for DUST generation block height progression...');
      await new Promise((resolve) => setTimeout(resolve, 15000));
    }
  }

  console.log('Building contract deployment providers...');
  const customLogger = createLogger('info');
  const proofProvider = httpClientProofProvider(envConfig.proofServer);
  const providers = {
    privateStateProvider: walletProvider.privateStateProvider,
    publicDataProvider: walletProvider.publicDataProvider,
    zkConfigProvider: walletProvider.zkConfigProvider,
    proofProvider,
    walletProvider,
    midnightProvider: walletProvider.midnightProvider,
  };

  console.log('Deploying Sealed-Bid Auction contract on Preview network...');
  const itemDescription = 'Rare Digital Art Piece #001';
  const deployedContract = await AuctionAPI.deploy(providers, itemDescription, customLogger);

  const contractAddress = deployedContract.deployTxData.public.contractAddress;
  console.log('====================================================');
  console.log('SEALED-BID AUCTION CONTRACT SUCCESSFULLY DEPLOYED!');
  console.log('PREPROD CONTRACT ADDRESS:', contractAddress);
  console.log('====================================================');

  await walletProvider.stop();
  process.exit(0);
}

main().catch((err) => {
  console.error('DEPLOYMENT ERROR:', err);
  process.exit(1);
});
