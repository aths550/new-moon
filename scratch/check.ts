import { NodeZkConfigProvider } from "@midnight-ntwrk/midnight-js-node-zk-config-provider";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { levelPrivateStateProvider } from "@midnight-ntwrk/midnight-js-level-private-state-provider";
import { TestEnvironment } from "@midnight-ntwrk/testkit-js";
import { AuctionAPI } from "../api/src/index.js";
import { Config } from "../auction-cli/src/config.js";
import pino from "pino";
import * as crypto from "node:crypto";
import { browserPonyfill } from "./test_import.js";

const logger = pino({ level: "trace" });
const address = "804b922277534496ea88552b352282a702614d1adaba3f4845037043f7013a51";

async function runCheck(networkId: 'preview' | 'preview') {
  const envConfiguration = networkId === 'preview'
    ? {
        walletNetworkId: 'preview',
        networkId: 'preview',
        indexer: 'https://indexer.preview.midnight.network/api/v4/graphql',
        indexerWS: 'wss://indexer.preview.midnight.network/api/v4/graphql/ws',
        node: 'https://rpc.preview.midnight.network',
        nodeWS: 'wss://rpc.preview.midnight.network',
        proofServer: 'http://127.0.0.1:6300',
      }
    : {
        walletNetworkId: 'preview',
        networkId: 'preview',
        indexer: 'https://indexer.preview.midnight.network/api/v4/graphql',
        indexerWS: 'wss://indexer.preview.midnight.network/api/v4/graphql/ws',
        node: 'https://rpc.preview.midnight.network',
        nodeWS: 'wss://rpc.preview.midnight.network',
        proofServer: 'http://127.0.0.1:6300',
      };

  const zkConfigProvider = new NodeZkConfigProvider(
    "./contract/src/managed/auction",
  );
  
  const seed = crypto.randomBytes(32).toString('hex');
  
  const providers: any = {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: `test-store-${networkId}`,
      signingKeyStoreName: `test-store-${networkId}-signing-keys`,
      privateStoragePasswordProvider: () => "Auction-Test-2026!",
      accountId: seed,
    }),
    publicDataProvider: indexerPublicDataProvider(
      envConfiguration.indexer,
      envConfiguration.indexerWS,
    ),
    zkConfigProvider: zkConfigProvider,
    proofProvider: httpClientProofProvider(
      envConfiguration.proofServer,
      zkConfigProvider,
    ),
  };

  try {
    const api = await AuctionAPI.join(providers, address, logger);
    const state = await new Promise((resolve) => {
      const sub = api.state$.subscribe((s) => {
        sub.unsubscribe();
        resolve(s);
      });
    });
    console.log(`[${networkId.toUpperCase()}] SUCCESS: Contract found! Item: ${(state as any).itemDescription}`);
  } catch (e: any) {
    console.log(`[${networkId.toUpperCase()}] ERROR: ${e.message}`);
  }
}

async function main() {
  await runCheck('preview');
  await runCheck('preview');
  process.exit(0);
}
main();
