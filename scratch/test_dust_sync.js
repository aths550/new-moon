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

  console.log('Waiting for dust wallet sync...');
  const dustSyncState = await Promise.race([
    walletProvider.wallet.dust.waitForSyncedState(),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Dust sync timeout after 15s')), 15000)),
  ]);

  console.log('Dust synced state address:', dustSyncState.address);

  await walletProvider.stop();
  process.exit(0);
}

main().catch((err) => {
  console.error('Dust sync check result:', err.message);
  process.exit(1);
});
