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
import { WebSocket } from 'ws';
globalThis.WebSocket = WebSocket;

import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { AuctionAPI } from '../api/dist/api/src/index.js';
import { MidnightWalletProvider } from '../auction-cli/dist/auction-cli/src/midnight-wallet-provider.js';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { unshieldedToken } from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { waitForUnshieldedFunds, syncWallet } from '../auction-cli/dist/auction-cli/src/wallet-utils.js';
import { generateDust } from '../auction-cli/dist/auction-cli/src/generate-dust.js';

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
  const walletProvider = await MidnightWalletProvider.build(logger, envConfig, seed);
  await walletProvider.start();

  console.log('Syncing wallet & waiting for unshielded tNIGHT funds...');
  const unshieldedState = await waitForUnshieldedFunds(logger, walletProvider.wallet, envConfig, unshieldedToken());

  console.log('Generating DUST from unshielded tNIGHT UTXOs...');
  await generateDust(logger, seed, unshieldedState, walletProvider.wallet);

  console.log('Syncing updated wallet state after DUST generation...');
  await syncWallet(logger, walletProvider.wallet);

  const zkConfigPath = path.resolve(process.cwd(), 'contract', 'src', 'managed', 'auction');
  const zkConfigProvider = new NodeZkConfigProvider(zkConfigPath);

  const providers = {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: 'preprod-auction-store-final',
      signingKeyStoreName: 'preprod-auction-signing-keys-final',
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
  console.error('FAILED WITH ERROR:', err);
  process.exit(1);
});
