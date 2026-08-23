import {
  AuctionAPI,
  type AuctionCircuitKeys,
  type AuctionProviders,
  type DeployedAuctionAPI,
} from "../../../../api/src/index.js";
import {
  type ContractAddress,
  fromHex,
  toHex,
} from "@midnight-ntwrk/midnight-js-protocol/compact-runtime";
import {
  BehaviorSubject,
  catchError,
  concatMap,
  filter,
  firstValueFrom,
  interval,
  map,
  type Observable,
  take,
  tap,
  throwError,
  timeout,
} from "rxjs";
import { pipe as fnPipe } from "fp-ts/function";
import { type Logger } from "pino";
import {
  ConnectedAPI,
  type InitialAPI,
} from "@midnight-ntwrk/dapp-connector-api";
import { FetchZkConfigProvider } from "@midnight-ntwrk/midnight-js-fetch-zk-config-provider";
import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import semver from "semver";
import {
  Binding,
  FinalizedTransaction,
  Proof,
  SignatureEnabled,
  Transaction,
  TransactionId,
} from "@midnight-ntwrk/midnight-js-protocol/ledger";
import { NetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import type {
  UnboundTransaction,
  PrivateStateProvider,
} from "@midnight-ntwrk/midnight-js-types";
import { createLocalStoragePrivateStateProvider } from "../lib/local-storage-private-state-provider.js";
import {
  getBidderIdentity,
  buildIdentityPrivateState,
  saveBidderIdentity,
} from "../lib/identity.js";
import { buildMerkleTree } from "../../../../contract/src/auction-merkle.js";
import {
  createAuctionPrivateState,
  AuctionPrivateState,
} from "../../../../contract/src/index.js";

export interface InProgressAuctionDeployment {
  readonly status: "in-progress";
}

export interface DeployedAuctionDeployment {
  readonly status: "deployed";
  readonly api: DeployedAuctionAPI;
}

export interface FailedAuctionDeployment {
  readonly status: "failed";
  readonly error: Error;
}

export type AuctionDeployment =
  | InProgressAuctionDeployment
  | DeployedAuctionDeployment
  | FailedAuctionDeployment;

export interface DeployedAuctionAPIProvider {
  readonly auctionDeployments$: Observable<
    Array<Observable<AuctionDeployment>>
  >;
  readonly resolve: (
    contractAddress?: ContractAddress,
  ) => Observable<AuctionDeployment>;
  readonly getPrivateStateProvider: () => Promise<
    PrivateStateProvider<string, AuctionPrivateState>
  >;
  readonly walletAddress$: Observable<string | undefined>;
}

export class BrowserDeployedAuctionManager implements DeployedAuctionAPIProvider {
  readonly #auctionDeploymentsSubject: BehaviorSubject<
    Array<BehaviorSubject<AuctionDeployment>>
  >;
  readonly #walletAddressSubject: BehaviorSubject<string | undefined>;
  #initializedProviders: Promise<AuctionProviders> | undefined;

  constructor(private readonly logger: Logger) {
    this.#auctionDeploymentsSubject = new BehaviorSubject<
      Array<BehaviorSubject<AuctionDeployment>>
    >([]);
    this.#walletAddressSubject = new BehaviorSubject<string | undefined>(
      undefined,
    );
    this.auctionDeployments$ = this.#auctionDeploymentsSubject;
    this.walletAddress$ = this.#walletAddressSubject;
  }

  readonly auctionDeployments$: Observable<
    Array<Observable<AuctionDeployment>>
  >;
  readonly walletAddress$: Observable<string | undefined>;

  async getPrivateStateProvider(): Promise<
    PrivateStateProvider<string, AuctionPrivateState>
  > {
    const providers = await this.getProviders();
    return providers.privateStateProvider;
  }

  resolve(contractAddress?: ContractAddress): Observable<AuctionDeployment> {
    const deployments = this.#auctionDeploymentsSubject.value;
    let deployment = deployments.find(
      (deployment) =>
        deployment.value.status === "deployed" &&
        deployment.value.api.deployedContractAddress === contractAddress,
    );

    if (deployment) {
      return deployment;
    }

    deployment = new BehaviorSubject<AuctionDeployment>({
      status: "in-progress",
    });

    if (contractAddress) {
      void this.joinDeployment(deployment, contractAddress);
    } else {
      void this.deployDeployment(deployment);
    }

    this.#auctionDeploymentsSubject.next([...deployments, deployment]);

    return deployment;
  }

  private getProviders(): Promise<AuctionProviders> {
    return (
      this.#initializedProviders ??
      (this.#initializedProviders = initializeProviders(
        this.logger,
        this.#walletAddressSubject,
      ))
    );
  }

  private async deployDeployment(
    deployment: BehaviorSubject<AuctionDeployment>,
  ): Promise<void> {
    try {
      const providers = await this.getProviders();

      // Generate a one-off identity for deploy
      const secretKey = new Uint8Array(32);
      crypto.getRandomValues(secretKey);
      const { root, layers } = buildMerkleTree([secretKey]);
      const initialPrivateState = createAuctionPrivateState(
        secretKey,
        [layers[0][1]], // Merkle path (just dummy for root calculation since deploy doesn't bid)
        [true], // Path directions
        0n,
        new Uint8Array(32),
      );

      const api = await AuctionAPI.deploy(
        providers,
        "Sealed-Bid Auction Item",
        root,
        this.logger,
        initialPrivateState,
      );

      // Save it under the new contract address
      saveBidderIdentity(api.deployedContractAddress, secretKey);

      deployment.next({
        status: "deployed",
        api,
      });
    } catch (error: unknown) {
      deployment.next({
        status: "failed",
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }

  private async joinDeployment(
    deployment: BehaviorSubject<AuctionDeployment>,
    contractAddress: ContractAddress,
  ): Promise<void> {
    try {
      const providers = await this.getProviders();

      // Ensure identity exists and is pre-seeded before joining
      const identity = getBidderIdentity(contractAddress);
      providers.privateStateProvider.setContractAddress(contractAddress);
      await providers.privateStateProvider.set(
        "auctionPrivateState",
        buildIdentityPrivateState(identity),
      );

      const api = await AuctionAPI.join(
        providers,
        contractAddress,
        this.logger,
      );

      deployment.next({
        status: "deployed",
        api,
      });
    } catch (error: unknown) {
      deployment.next({
        status: "failed",
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }
}

const initializeProviders = async (
  logger: Logger,
  walletAddressSubject: BehaviorSubject<string | undefined>,
): Promise<AuctionProviders> => {
  const networkId = import.meta.env.VITE_NETWORK_ID as NetworkId;
  const connectedAPI = await connectToWallet(logger, networkId);
  const zkConfigPath = window.location.origin;
  const keyMaterialProvider = new FetchZkConfigProvider<AuctionCircuitKeys>(
    zkConfigPath,
    fetch.bind(window),
  );
  const config = await connectedAPI.getConfiguration();

  const localStoragePrivateStateProvider =
    createLocalStoragePrivateStateProvider<string, AuctionPrivateState>(
      (ps: AuctionPrivateState) =>
        JSON.stringify({
          secretKey: Buffer.from(ps.secretKey).toString("hex"),
          merklePath: ps.merklePath.map((p) => Buffer.from(p).toString("hex")),
          pathDirections: ps.pathDirections,
          bidAmount: ps.bidAmount.toString(),
          bidSalt: Buffer.from(ps.bidSalt).toString("hex"),
        }),
      (str: string) => {
        const parsed = JSON.parse(str);
        return {
          secretKey: Buffer.from(parsed.secretKey, "hex"),
          merklePath: parsed.merklePath.map((p: string) =>
            Buffer.from(p, "hex"),
          ),
          pathDirections: parsed.pathDirections,
          bidAmount: BigInt(parsed.bidAmount),
          bidSalt: Buffer.from(parsed.bidSalt, "hex"),
        };
      },
    );

  const shieldedAddresses = await connectedAPI.getShieldedAddresses();
  walletAddressSubject.next(shieldedAddresses.shieldedCoinPublicKey);
  return {
    privateStateProvider: localStoragePrivateStateProvider,
    zkConfigProvider: keyMaterialProvider,
    proofProvider: httpClientProofProvider(
      config.proverServerUri!,
      keyMaterialProvider,
    ),
    publicDataProvider: indexerPublicDataProvider(
      config.indexerUri,
      config.indexerWsUri,
    ),
    walletProvider: {
      getCoinPublicKey(): string {
        return shieldedAddresses.shieldedCoinPublicKey;
      },
      getEncryptionPublicKey(): string {
        return shieldedAddresses.shieldedEncryptionPublicKey;
      },
      balanceTx: async (
        tx: UnboundTransaction,
        ttl?: Date,
      ): Promise<FinalizedTransaction> => {
        try {
          logger.info({ tx, ttl }, "Balancing transaction via wallet");
          const serializedTx = toHex(tx.serialize());
          const received =
            await connectedAPI.balanceUnsealedTransaction(serializedTx);
          return Transaction.deserialize<SignatureEnabled, Proof, Binding>(
            "signature",
            "proof",
            "binding",
            fromHex(received.tx),
          );
        } catch (e) {
          logger.error({ error: e }, "Error balancing transaction via wallet");
          throw e;
        }
      },
    },
    midnightProvider: {
      submitTx: async (tx: FinalizedTransaction): Promise<TransactionId> => {
        await connectedAPI.submitTransaction(toHex(tx.serialize()));
        const txIdentifiers = tx.identifiers();
        const txId = txIdentifiers[0];
        logger.info({ txIdentifiers }, "Submitted transaction via wallet");
        return txId;
      },
    },
  };
};

const isCompatibleWallet = (wallet: unknown): wallet is InitialAPI =>
  !!wallet &&
  typeof wallet === "object" &&
  "apiVersion" in wallet &&
  semver.satisfies(
    (wallet as InitialAPI).apiVersion,
    COMPATIBLE_CONNECTOR_API_VERSION,
  );

const getFirstCompatibleWallet = (): InitialAPI | undefined => {
  if (!window.midnight) return undefined;
  const wallets = Object.entries(window.midnight);

  // 1. Prefer Lace by key name (mnLace is the standard key Lace uses)
  for (const [key, wallet] of wallets) {
    if (key.toLowerCase().includes("lace") && isCompatibleWallet(wallet)) {
      return wallet;
    }
  }

  // 2. Prefer Lace by name or rdns
  for (const [, wallet] of wallets) {
    if (
      isCompatibleWallet(wallet) &&
      (wallet.name?.toLowerCase().includes("lace") ||
        wallet.rdns?.toLowerCase().includes("lace"))
    ) {
      return wallet;
    }
  }

  // 3. Fall back to any compatible wallet
  for (const [, wallet] of wallets) {
    if (isCompatibleWallet(wallet)) {
      return wallet;
    }
  }

  return undefined;
};

const COMPATIBLE_CONNECTOR_API_VERSION = "4.x";

const connectToWallet = (
  logger: Logger,
  networkId: string,
): Promise<ConnectedAPI> => {
  return firstValueFrom(
    fnPipe(
      interval(100),
      map(() => getFirstCompatibleWallet()),
      tap((connectorAPI) => {
        logger.info(connectorAPI, "Check for wallet connector API");
      }),
      filter((connectorAPI): connectorAPI is InitialAPI => !!connectorAPI),
      tap((connectorAPI) => {
        logger.info(
          {
            name: connectorAPI.name,
            rdns: connectorAPI.rdns,
            apiVersion: connectorAPI.apiVersion,
          },
          "Compatible wallet connector API found. Connecting.",
        );
      }),
      take(1),
      timeout({
        first: 1_000,
        with: () =>
          throwError(() => {
            logger.error("Could not find wallet connector API");
            return new Error(
              "Could not find Midnight Lace wallet. Extension installed?",
            );
          }),
      }),
      concatMap(async (initialAPI) => {
        logger.info({ networkId }, "Calling initialAPI.connect(networkId)...");
        console.log("[auction-ui] initialAPI keys:", Object.keys(initialAPI));
        console.log(
          "[auction-ui] initialAPI.name:",
          initialAPI.name,
          "rdns:",
          initialAPI.rdns,
          "apiVersion:",
          initialAPI.apiVersion,
        );
        console.log("[auction-ui] networkId being passed:", networkId);
        try {
          const connectedAPI = await initialAPI.connect(networkId);
          const connectionStatus = await connectedAPI.getConnectionStatus();
          logger.info(connectionStatus, "Wallet connector API enabled status");
          console.log("[auction-ui] connectionStatus:", connectionStatus);
          return connectedAPI;
        } catch (connectError) {
          console.error(
            "[auction-ui] REAL ERROR from initialAPI.connect():",
            connectError,
          );
          logger.error({ error: connectError }, "initialAPI.connect() threw");
          throw connectError;
        }
      }),
      timeout({
        first: 30_000,
        with: () =>
          throwError(() => {
            logger.error("Wallet connector API has failed to respond");
            return new Error(
              "Midnight Lace wallet has failed to respond. Extension enabled?",
            );
          }),
      }),
      catchError((error) => {
        console.error(
          "[auction-ui] FULL catchError - real error object:",
          error,
        );
        logger.error(
          { error: String(error), stack: error?.stack },
          "connectToWallet pipeline error",
        );
        return throwError(() =>
          error instanceof Error ? error : new Error(String(error)),
        );
      }),
    ),
  );
};
