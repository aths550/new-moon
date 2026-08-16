import dns from 'node:dns';
import net from 'node:net';
import tls from 'node:tls';
dns.setDefaultResultOrder('ipv4first');

const origNetConnect = net.connect;
net.connect = function (...args) {
  if (typeof args[0] === 'object' && args[0] !== null && args[0].family === undefined) {
    args[0].family = 4;
  }
  return origNetConnect.apply(this, args);
};

const origTlsConnect = tls.connect;
tls.connect = function (...args) {
  if (typeof args[0] === 'object' && args[0] !== null && args[0].family === undefined) {
    args[0].family = 4;
  }
  return origTlsConnect.apply(this, args);
};

import pino from 'pino';
import path from 'node:path';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { AuctionAPI } from '../api/dist/api/src/index.js';
import { MidnightWalletProvider } from '../auction-cli/dist/auction-cli/src/midnight-wallet-provider.js';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';

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

  console.log('Building Preview wallet provider...');
  const walletProvider = await MidnightWalletProvider.build(logger, envConfig, seed);
  await walletProvider.start();

  const zkConfigPath = path.resolve(process.cwd(), 'contract', 'src', 'managed', 'auction');
  const zkConfigProvider = new NodeZkConfigProvider(zkConfigPath);

  const providers = {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: 'preview-auction-store',
      signingKeyStoreName: 'preview-auction-signing-keys',
      privateStoragePasswordProvider: () => 'Preview-Test-2026!',
      accountId: seed,
    }),
    publicDataProvider: indexerPublicDataProvider(envConfig.indexer, envConfig.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(envConfig.proofServer, zkConfigProvider),
    walletProvider,
    midnightProvider: walletProvider,
  };

  console.log('Deploying Sealed-Bid Auction Contract on Preview Network...');
  const api = await AuctionAPI.deploy(providers, 'Rare NFT - Midnight Genesis #001', new Uint8Array(32), logger);
  console.log('====================================================');
  console.log(`SUCCESS! PREPROD DEPLOYED AUCTION CONTRACT ADDRESS: ${api.deployedContractAddress}`);
  console.log('====================================================');

  await walletProvider.stop();
  process.exit(0);
}

main().catch((err) => {
  console.error('FAILED WITH ERROR:', err);
  process.exit(1);
});
