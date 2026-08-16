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
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { MidnightWalletProvider } from '../auction-cli/dist/auction-cli/src/midnight-wallet-provider.js';
import { getInitialUnshieldedState } from '../auction-cli/dist/auction-cli/src/wallet-utils.js';
import { UnshieldedAddress } from '@midnight-ntwrk/wallet-sdk-address-format';

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
  const unshieldedState = await getInitialUnshieldedState(logger, walletProvider.wallet.unshielded);
  const unshieldedAddress = UnshieldedAddress.codec.encode('preview', unshieldedState.address);

  console.log('====================================================');
  console.log(`EXACT UNSHIELDED ADDRESS FOR SEED '${seed}':`);
  console.log(unshieldedAddress.toString());
  console.log('====================================================');
  process.exit(0);
}

main().catch(console.error);
