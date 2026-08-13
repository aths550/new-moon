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
import path from 'node:path';
import * as rx from 'rxjs';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { AuctionAPI, type AuctionProviders } from '../api/dist/api/src/index.js';
import { MidnightWalletProvider } from '../auction-cli/dist/auction-cli/src/midnight-wallet-provider.js';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';

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
  };

  console.log('Building Preprod wallet provider...');
  const walletProvider = await MidnightWalletProvider.build(logger, envConfig as any, seed);
  await walletProvider.start();

  console.log('Waiting for synced wallet state (tNIGHT & DUST)...');
  const walletState = await rx.firstValueFrom(
    walletProvider.wallet.state().pipe(
      rx.filter((s) => s.unshielded.availableCoins.length > 0),
    ),
  );
  console.log(`Wallet synced! Available UTXOs: ${walletState.unshielded.availableCoins.length}`);

  const zkConfigPath = path.resolve(process.cwd(), 'contract', 'src', 'managed', 'auction');
  const zkConfigProvider = new NodeZkConfigProvider<any>(zkConfigPath);

  const providers: AuctionProviders = {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: 'preprod-auction-store',
      signingKeyStoreName: 'preprod-auction-signing-keys',
      privateStoragePasswordProvider: () => 'Preprod-Test-2026!',
      accountId: seed,
    }),
    publicDataProvider: indexerPublicDataProvider(envConfig.indexer, envConfig.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(envConfig.proofServer, zkConfigProvider),
    walletProvider,
    midnightProvider: walletProvider,
  };

  console.log('Deploying Sealed-Bid Auction Contract on Preprod Network...');
  const api = await AuctionAPI.deploy(providers, 'Rare NFT - Midnight Genesis #001', new Uint8Array(32), logger);
  console.log('====================================================');
  console.log(`SUCCESS! PREPROD DEPLOYED AUCTION CONTRACT ADDRESS: ${api.deployedContractAddress}`);
  console.log('====================================================');

  await walletProvider.stop();
  process.exit(0);
}

main().catch((err) => {
  console.error('PREPROD DEPLOYMENT ERROR:', err);
  process.exit(1);
});
