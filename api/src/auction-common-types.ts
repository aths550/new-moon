import { type MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import { type FoundContract } from '@midnight-ntwrk/midnight-js-contracts';
import { State } from '../../contract/src/managed/auction/contract/index.js';
import type { AuctionPrivateState, Contract, Witnesses } from '../../contract/src/index';

export const auctionPrivateStateKey = 'auctionPrivateState';
export type AuctionPrivateStateId = typeof auctionPrivateStateKey;

export type AuctionPrivateStates = {
  readonly auctionPrivateState: AuctionPrivateState;
};

export type AuctionContract = Contract<AuctionPrivateState, Witnesses<AuctionPrivateState>>;

export type AuctionCircuitKeys = Exclude<keyof AuctionContract['impureCircuits'], number | symbol>;

export type AuctionProviders = MidnightProviders<AuctionCircuitKeys, AuctionPrivateStateId, AuctionPrivateState>;

export type DeployedAuctionContract = FoundContract<AuctionContract>;

export type AuctionDerivedState = {
  readonly state: State;
  readonly itemDescription: string;
  readonly highestBidAmount: bigint;
  readonly highestBidCommitment: Uint8Array;
  readonly winnerRevealed: boolean;
  readonly winningAmount: bigint;
  readonly allowlistMerkleRoot: Uint8Array;
  readonly commitmentCount: bigint;
};
