import * as Auction from '../../contract/src/managed/auction/contract/index.js';

import { type ContractAddress } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import { type Logger } from 'pino';
import {
  type AuctionDerivedState,
  type AuctionContract,
  type AuctionProviders,
  type DeployedAuctionContract,
  auctionPrivateStateKey,
} from './auction-common-types.js';
import {
  CompiledAuctionContractContract,
  AuctionPrivateState,
  createAuctionPrivateState,
} from '../../contract/src/index.js';
import * as utils from './utils/index.js';
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { map, tap, type Observable } from 'rxjs';
import { toHex } from '@midnight-ntwrk/midnight-js-utils';

export const computeCommitment = Auction.pureCircuits.computeCommitment;

export interface DeployedAuctionAPI {
  readonly deployedContractAddress: ContractAddress;
  readonly state$: Observable<AuctionDerivedState>;

  updateAllowlistRoot: (newRoot: Uint8Array) => Promise<void>;
  commitBid: (commitmentHash: Uint8Array) => Promise<void>;
  advanceToReveal: () => Promise<void>;
  revealBid: () => Promise<void>;
  closeAuction: () => Promise<void>;
}

export class AuctionAPI implements DeployedAuctionAPI {
  private constructor(
    public readonly deployedContract: DeployedAuctionContract,
    providers: AuctionProviders,
    private readonly logger?: Logger,
  ) {
    this.deployedContractAddress = deployedContract.deployTxData.public.contractAddress;
    providers.privateStateProvider.setContractAddress(this.deployedContractAddress);
    /* eslint-disable @typescript-eslint/no-explicit-any */
    this.state$ = (providers.publicDataProvider as any)
      .contractStateObservable(this.deployedContractAddress, { type: 'latest' })
      .pipe(
        map((contractState: any) => Auction.ledger(contractState.data)),
        tap((ledgerState: any) =>
          logger?.trace({
            ledgerStateChanged: {
              state: ledgerState.state,
              highestBidAmount: ledgerState.highestBidAmount.toString(),
            },
          }),
        ),
        map((ledgerState: any) => ({
          state: ledgerState.state,
          itemDescription: ledgerState.itemDescription,
          highestBidAmount: ledgerState.highestBidAmount,
          highestBidCommitment: ledgerState.highestBidCommitment,
          winnerRevealed: ledgerState.winnerRevealed,
          winningAmount: ledgerState.winningAmount,
          allowlistMerkleRoot: ledgerState.allowlistMerkleRoot,
          commitmentCount: ledgerState.commitments.size(),
        })),
      );
    /* eslint-enable @typescript-eslint/no-explicit-any */
  }

  readonly deployedContractAddress: ContractAddress;
  readonly state$: Observable<AuctionDerivedState>;

  async updateAllowlistRoot(newRoot: Uint8Array): Promise<void> {
    this.logger?.info(`updatingAllowlistRoot: ${toHex(newRoot)}`);
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const txData = await (this.deployedContract.callTx as any).updateAllowlistRoot(newRoot);
    /* eslint-enable @typescript-eslint/no-explicit-any */
    this.logger?.trace({
      transactionAdded: {
        circuit: 'updateAllowlistRoot',
        txHash: txData.public.txHash,
        blockHeight: txData.public.blockHeight,
      },
    });
  }

  async commitBid(commitmentHash: Uint8Array): Promise<void> {
    this.logger?.info(`committingBid: ${toHex(commitmentHash)}`);
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const txData = await (this.deployedContract.callTx as any).commitBid(commitmentHash);
    /* eslint-enable @typescript-eslint/no-explicit-any */
    this.logger?.trace({
      transactionAdded: {
        circuit: 'commitBid',
        txHash: txData.public.txHash,
        blockHeight: txData.public.blockHeight,
      },
    });
  }

  async advanceToReveal(): Promise<void> {
    this.logger?.info('advancingToReveal');
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const txData = await (this.deployedContract.callTx as any).advanceToReveal();
    /* eslint-enable @typescript-eslint/no-explicit-any */
    this.logger?.trace({
      transactionAdded: {
        circuit: 'advanceToReveal',
        txHash: txData.public.txHash,
        blockHeight: txData.public.blockHeight,
      },
    });
  }

  async revealBid(): Promise<void> {
    this.logger?.info('revealingBid');
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const txData = await (this.deployedContract.callTx as any).revealBid();
    /* eslint-enable @typescript-eslint/no-explicit-any */
    this.logger?.trace({
      transactionAdded: {
        circuit: 'revealBid',
        txHash: txData.public.txHash,
        blockHeight: txData.public.blockHeight,
      },
    });
  }

  async closeAuction(): Promise<void> {
    this.logger?.info('closingAuction');
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const txData = await (this.deployedContract.callTx as any).closeAuction();
    /* eslint-enable @typescript-eslint/no-explicit-any */
    this.logger?.trace({
      transactionAdded: {
        circuit: 'closeAuction',
        txHash: txData.public.txHash,
        blockHeight: txData.public.blockHeight,
      },
    });
  }

  static async deploy(
    providers: AuctionProviders,
    itemDescription: string = 'Sealed-Bid Auction Item',
    merkleRoot: Uint8Array = new Uint8Array(32),
    logger?: Logger,
    initialPrivateState: AuctionPrivateState = createAuctionPrivateState(utils.randomBytes(32)),
  ): Promise<AuctionAPI> {
    logger?.info('deployContract');
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const deployedAuctionContract = (await deployContract(
      providers as any,
      {
        compiledContract: CompiledAuctionContractContract,
        privateStateId: auctionPrivateStateKey,
        initialPrivateState,
        args: [itemDescription, merkleRoot],
      } as any,
    )) as unknown as DeployedAuctionContract;
    /* eslint-enable @typescript-eslint/no-explicit-any */

    logger?.trace({
      contractDeployed: {
        finalizedDeployTxData: deployedAuctionContract.deployTxData.public,
      },
    });
    return new AuctionAPI(deployedAuctionContract, providers, logger);
  }

  static async join(
    providers: AuctionProviders,
    contractAddress: ContractAddress,
    logger?: Logger,
  ): Promise<AuctionAPI> {
    logger?.info({ joinContract: { contractAddress } });
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const deployedAuctionContract = (await findDeployedContract<AuctionContract>(providers, {
      contractAddress,
      compiledContract: CompiledAuctionContractContract,
      privateStateId: auctionPrivateStateKey,
      initialPrivateState: await AuctionAPI.getPrivateState(providers, contractAddress),
    } as any)) as unknown as DeployedAuctionContract;
    /* eslint-enable @typescript-eslint/no-explicit-any */

    logger?.trace({
      contractJoined: {
        finalizedDeployTxData: deployedAuctionContract.deployTxData.public,
      },
    });
    return new AuctionAPI(deployedAuctionContract, providers, logger);
  }

  private static async getPrivateState(
    providers: AuctionProviders,
    contractAddress: ContractAddress,
  ): Promise<AuctionPrivateState> {
    providers.privateStateProvider.setContractAddress(contractAddress);
    const existingPrivateState = await providers.privateStateProvider.get(auctionPrivateStateKey);
    return existingPrivateState ?? createAuctionPrivateState(utils.randomBytes(32));
  }
}

export * from './auction-common-types.js';
