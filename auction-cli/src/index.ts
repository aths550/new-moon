import { createInterface, type Interface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { WebSocket } from 'ws';
import {
  AuctionAPI,
  type AuctionDerivedState,
  type AuctionProviders,
  type PrivateStateId,
} from '../../api/src/index';
import { type WalletFacade } from '@midnight-ntwrk/wallet-sdk-facade';
import { ledger, type Ledger, State } from '../../contract/src/managed/auction/contract/index.js';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { type Logger } from 'pino';
import { type Config } from './config.js';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { type ContractAddress } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import { assertIsContractAddress, toHex } from '@midnight-ntwrk/midnight-js-utils';
import { TestEnvironment } from '@midnight-ntwrk/testkit-js';
import { MidnightWalletProvider } from './midnight-wallet-provider.js';
import { randomBytes } from '../../api/src/utils';
import { unshieldedToken } from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { syncWallet, waitForUnshieldedFunds } from './wallet-utils.js';
import { generateDust } from './generate-dust.js';
import { AuctionPrivateState } from '../../contract/src/witnesses.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

// @ts-expect-error: It's needed to enable WebSocket usage through apollo
globalThis.WebSocket = WebSocket;

const BID_STORE_FILE = path.resolve(new URL(import.meta.url).pathname, '..', '..', 'bid-store.json');

interface BidEntry {
  amount: string;
  salt: string;
  commitmentHash: string;
}

type BidStore = Record<string, BidEntry>;

function loadBidStore(): BidStore {
  try {
    return JSON.parse(fs.readFileSync(BID_STORE_FILE, 'utf-8')) as BidStore;
  } catch {
    return {};
  }
}

function saveBidStore(store: BidStore): void {
  fs.writeFileSync(BID_STORE_FILE, JSON.stringify(store, null, 2));
}

export const getAuctionLedgerState = async (
  providers: AuctionProviders,
  contractAddress: ContractAddress,
): Promise<Ledger | null> => {
  assertIsContractAddress(contractAddress);
  const contractState = await providers.publicDataProvider.queryContractState(contractAddress);
  return contractState != null ? ledger(contractState.data) : null;
};

const DEPLOY_OR_JOIN_QUESTION = `
You can do one of the following:
  1. Deploy a new auction contract
  2. Join an existing auction contract
  3. Exit
Which would you like to do? `;

const deployOrJoin = async (providers: AuctionProviders, rli: Interface, logger: Logger): Promise<AuctionAPI | null> => {
  let api: AuctionAPI | null = null;

  while (true) {
    const choice = await rli.question(DEPLOY_OR_JOIN_QUESTION);
    switch (choice) {
      case '1': {
        const item = await rli.question('Enter item description: ');
        api = await AuctionAPI.deploy(providers, item, new Uint8Array(32), logger);
        logger.info(`Deployed contract at address: ${api.deployedContractAddress}`);
        return api;
      }
      case '2':
        api = await AuctionAPI.join(providers, await rli.question('What is the contract address (in hex)? '), logger);
        logger.info(`Joined contract at address: ${api.deployedContractAddress}`);
        return api;
      case '3':
        logger.info('Exiting...');
        return null;
      default:
        logger.error(`Invalid choice: ${choice}`);
    }
  }
};

const stateToString = (state: State): string => {
  switch (state) {
    case State.Commit:
      return 'Commit';
    case State.Reveal:
      return 'Reveal';
    case State.Ended:
      return 'Ended';
    default:
      return 'Unknown';
  }
};

const displayAuctionState = (state: AuctionDerivedState | undefined, logger: Logger) => {
  if (state === undefined) {
    logger.info(`No auction state currently available`);
  } else {
    logger.info(`Phase: ${stateToString(state.state)}`);
    logger.info(`Item: ${state.itemDescription}`);
    logger.info(`Highest Bid: ${state.highestBidAmount.toString()}`);
    logger.info(`Winner Revealed: ${state.winnerRevealed}`);
    logger.info(`Winning Amount: ${state.winningAmount.toString()}`);
    logger.info(`Commitment Count: ${state.commitmentCount.toString()}`);
    logger.info(`Allowlist Root: ${toHex(state.allowlistMerkleRoot)}`);
  }
};

const MAIN_LOOP_QUESTION = `
You can do one of the following:
  1. Update allowlist Merkle root
  2. Commit bid (enter amount, salt auto-generated)
  3. Advance to Reveal phase
  4. Reveal bid
  5. Close auction
  6. View auction state
  7. Exit
Which would you like to do? `;

const mainLoop = async (providers: AuctionProviders, rli: Interface, logger: Logger): Promise<void> => {
  const auctionApi = await deployOrJoin(providers, rli, logger);
  if (auctionApi === null) {
    return;
  }
  let currentState: AuctionDerivedState | undefined;
  const stateObserver = {
    next: (state: AuctionDerivedState) => (currentState = state),
  };
  const subscription = auctionApi.state$.subscribe(stateObserver);
  try {
    while (true) {
      const choice = await rli.question(MAIN_LOOP_QUESTION);
      try {
        switch (choice) {
          case '1': {
            const rootHex = await rli.question('Enter new 32-byte Merkle root (hex string): ');
            const rootBytes = Buffer.from(rootHex.replace(/^0x/, ''), 'hex');
            if (rootBytes.length !== 32) {
              logger.error('Invalid Merkle root length. Must be 32 bytes (64 hex chars).');
            } else {
              await auctionApi.updateAllowlistRoot(rootBytes);
              logger.info('Allowlist Merkle root updated.');
            }
            break;
          }
          case '2': {
            const amountStr = await rli.question('Enter your bid amount: ');
            const amount = BigInt(amountStr);
            const salt = randomBytes(32);
            const commitmentHash = randomBytes(32);
            const store = loadBidStore();
            store[auctionApi.deployedContractAddress] = {
              amount: amount.toString(),
              salt: toHex(salt),
              commitmentHash: toHex(commitmentHash),
            };
            saveBidStore(store);
            await auctionApi.commitBid(commitmentHash);
            logger.info(`Bid committed. Amount=${amount}, Salt stored locally.`);
            break;
          }
          case '3':
            await auctionApi.advanceToReveal();
            logger.info('Auction advanced to Reveal phase.');
            break;
          case '4': {
            const store = loadBidStore();
            const entry = store[auctionApi.deployedContractAddress];
            if (!entry) {
              logger.error('No stored bid found for this auction. Cannot reveal.');
            } else {
              logger.info(`Revealing bid: amount=${entry.amount}`);
              await auctionApi.revealBid();
              logger.info('Bid revealed.');
            }
            break;
          }
          case '5':
            await auctionApi.closeAuction();
            logger.info('Auction closed.');
            break;
          case '6':
            displayAuctionState(currentState, logger);
            break;
          case '7':
            logger.info('Exiting...');
            return;
          default:
            logger.error(`Invalid choice: ${choice}`);
        }
      } catch (e) {
        logError(logger, e);
        logger.info('Returning to main menu...');
      }
    }
  } finally {
    subscription.unsubscribe();
  }
};

const WALLET_LOOP_QUESTION = `
You can do one of the following:
  1. Build a fresh wallet
  2. Build wallet from a seed
  3. Exit
Which would you like to do? `;

const buildWallet = async (config: Config, rli: Interface, logger: Logger): Promise<string | undefined> => {
  while (true) {
    const choice = await rli.question(WALLET_LOOP_QUESTION);
    switch (choice) {
      case '1':
        return toHex(randomBytes(32));
      case '2':
        return await rli.question('Enter your wallet seed: ');
      case '3':
        logger.info('Exiting...');
        return undefined;
      default:
        logger.error(`Invalid choice: ${choice}`);
    }
  }
};

export const run = async (config: Config, testEnv: TestEnvironment, logger: Logger): Promise<void> => {
  const rli = createInterface({ input, output, terminal: true });
  const providersToBeStopped: MidnightWalletProvider[] = [];
  try {
    const envConfiguration = await testEnv.start();
    logger.info(`Environment started with configuration: ${JSON.stringify(envConfiguration)}`);
    const seed = await buildWallet(config, rli, logger);
    if (seed === undefined) {
      return;
    }
    const walletProvider = await MidnightWalletProvider.build(logger, envConfiguration, seed);
    providersToBeStopped.push(walletProvider);
    const walletFacade: WalletFacade = walletProvider.wallet;

    await walletProvider.start();

    const unshieldedState = await waitForUnshieldedFunds(logger, walletFacade, envConfiguration, unshieldedToken());
    const nightBalance = unshieldedState.balances[unshieldedToken().raw];
    if (nightBalance === undefined) {
      logger.info('No funds received, exiting...');
      return;
    }
    logger.info(`Your NIGHT wallet balance is: ${nightBalance}`);

    if (config.generateDust) {
      const dustGeneration = await generateDust(logger, seed, unshieldedState, walletFacade);
      if (dustGeneration) {
        logger.info(`Submitted dust generation registration transaction: ${dustGeneration}`);
        await syncWallet(logger, walletFacade);
      }
    }

    const zkConfigProvider = new NodeZkConfigProvider<
      'updateAllowlistRoot' | 'commitBid' | 'advanceToReveal' | 'revealBid' | 'closeAuction'
    >(config.zkConfigPath);
    const providers: AuctionProviders = {
      privateStateProvider: levelPrivateStateProvider<PrivateStateId, AuctionPrivateState>({
        privateStateStoreName: config.privateStateStoreName,
        signingKeyStoreName: `${config.privateStateStoreName}-signing-keys`,
        privateStoragePasswordProvider: () => {
          return 'Auction-Test-2026!';
        },
        accountId: seed,
      }),
      publicDataProvider: indexerPublicDataProvider(envConfiguration.indexer, envConfiguration.indexerWS),
      zkConfigProvider: zkConfigProvider,
      proofProvider: httpClientProofProvider(envConfiguration.proofServer, zkConfigProvider),
      walletProvider: walletProvider,
      midnightProvider: walletProvider,
    };
    await mainLoop(providers, rli, logger);
  } catch (e) {
    logError(logger, e);
    logger.info('Exiting...');
  } finally {
    try {
      rli.close();
      rli.removeAllListeners();
    } catch (e) {
      logError(logger, e);
    } finally {
      try {
        for (const wallet of providersToBeStopped) {
          logger.info('Stopping wallet...');
          await wallet.stop();
        }
        if (testEnv) {
          logger.info('Stopping test environment...');
          await testEnv.shutdown();
        }
      } catch (e) {
        logError(logger, e);
      }
    }
  }
};

function logError(logger: Logger, e: unknown) {
  if (e instanceof Error) {
    logger.error(`Found error '${e.message}'`);
    logger.debug(`${e.stack}`);
  } else {
    logger.error(`Found error (unknown type)`);
  }
}
