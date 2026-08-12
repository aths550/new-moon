// Witness implementations for sealed-bid-auction smart contract

import { Ledger } from "./managed/auction/contract/index.js";
import { WitnessContext } from "@midnight-ntwrk/midnight-js-protocol/compact-runtime";

export type AuctionPrivateState = {
  readonly secretKey: Uint8Array;
  readonly merklePath: Uint8Array[];
  readonly pathDirections: boolean[];
  readonly bidAmount: bigint;
  readonly bidSalt: Uint8Array;
};

export const createAuctionPrivateState = (
  secretKey: Uint8Array,
  merklePath: Uint8Array[] = Array(8).fill(new Uint8Array(32)),
  pathDirections: boolean[] = Array(8).fill(false),
  bidAmount: bigint = 0n,
  bidSalt: Uint8Array = new Uint8Array(32),
): AuctionPrivateState => ({
  secretKey,
  merklePath,
  pathDirections,
  bidAmount,
  bidSalt,
});

export const witnesses = {
  localSecretKey: ({
    privateState,
  }: WitnessContext<Ledger, AuctionPrivateState>): [
    AuctionPrivateState,
    Uint8Array,
  ] => [privateState, privateState.secretKey],

  localMerklePath: ({
    privateState,
  }: WitnessContext<Ledger, AuctionPrivateState>): [
    AuctionPrivateState,
    Uint8Array[],
  ] => [privateState, privateState.merklePath],

  localPathDirections: ({
    privateState,
  }: WitnessContext<Ledger, AuctionPrivateState>): [
    AuctionPrivateState,
    boolean[],
  ] => [privateState, privateState.pathDirections],

  localBidAmount: ({
    privateState,
  }: WitnessContext<Ledger, AuctionPrivateState>): [
    AuctionPrivateState,
    bigint,
  ] => [privateState, privateState.bidAmount],

  localBidSalt: ({
    privateState,
  }: WitnessContext<Ledger, AuctionPrivateState>): [
    AuctionPrivateState,
    Uint8Array,
  ] => [privateState, privateState.bidSalt],
};
