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
import { firstValueFrom } from 'rxjs';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { MidnightWalletProvider } from '../auction-cli/dist/auction-cli/src/midnight-wallet-provider.js';

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

  const walletProvider = await MidnightWalletProvider.build(logger, envConfig, seed);
  await walletProvider.start();

  const state = await firstValueFrom(walletProvider.wallet.state());
  console.log('====================================================');
  console.log('UNSHIELDED BALANCES:', JSON.stringify(state.unshielded.balances, (k, v) => typeof v === 'bigint' ? v.toString() : v));
  console.log('AVAILABLE COINS COUNT:', state.unshielded.availableCoins.length);
  console.log('DUST BALANCE:', state.dust.balance(new Date()).toString());
  console.log('====================================================');

  await walletProvider.stop();
  process.exit(0);
}

main().catch(console.error);
