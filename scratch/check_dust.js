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

  console.log('Waiting for synced wallet state...');
  const walletState = await rx.firstValueFrom(
    walletProvider.wallet.state().pipe(
      rx.filter((s) => s.unshielded.availableCoins.length > 0),
    ),
  );

  const now = new Date();
  const dustCoins = walletState.dust.capabilities.coinsAndBalances.getAvailableCoinsWithGeneratedDust(walletState.dust.state, now);
  
  console.log('====================================================');
  console.log('CURRENT TIME:', now.toISOString());
  console.log('DUST COINS COUNT:', dustCoins.length);
  console.log('DUST COINS DETAILS:', JSON.stringify(dustCoins, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));
  console.log('UNSHIELDED COINS:', JSON.stringify(walletState.unshielded.availableCoins, null, 2));
  console.log('====================================================');

  await walletProvider.stop();
  process.exit(0);
}

main().catch((err) => {
  console.error('ERROR CHECKING DUST:', err);
  process.exit(1);
});
