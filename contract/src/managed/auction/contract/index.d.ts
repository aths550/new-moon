import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export enum State { Commit = 0, Reveal = 1, Ended = 2 }

export type Witnesses<PS> = {
  localSecretKey(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  localMerklePath(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array[]];
  localPathDirections(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, boolean[]];
  localBidAmount(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  localBidSalt(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
}

export type ImpureCircuits<PS> = {
  updateAllowlistRoot(context: __compactRuntime.CircuitContext<PS>,
                      newRoot_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  commitBid(context: __compactRuntime.CircuitContext<PS>,
            commitmentHash_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  advanceToReveal(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  revealBid(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  closeAuction(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  updateAllowlistRoot(context: __compactRuntime.CircuitContext<PS>,
                      newRoot_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  commitBid(context: __compactRuntime.CircuitContext<PS>,
            commitmentHash_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  advanceToReveal(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  revealBid(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  closeAuction(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
  computeCommitment(salt_0: Uint8Array, amount_0: bigint): Uint8Array;
}

export type Circuits<PS> = {
  updateAllowlistRoot(context: __compactRuntime.CircuitContext<PS>,
                      newRoot_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  commitBid(context: __compactRuntime.CircuitContext<PS>,
            commitmentHash_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  advanceToReveal(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  revealBid(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  closeAuction(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  computeCommitment(context: __compactRuntime.CircuitContext<PS>,
                    salt_0: Uint8Array,
                    amount_0: bigint): __compactRuntime.CircuitResults<PS, Uint8Array>;
}

export type Ledger = {
  readonly state: State;
  readonly itemDescription: string;
  readonly sellerPublicKey: Uint8Array;
  readonly allowlistMerkleRoot: Uint8Array;
  readonly highestBidCommitment: Uint8Array;
  readonly highestBidAmount: bigint;
  readonly winnerRevealed: boolean;
  readonly winningAmount: bigint;
  commitments: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): Uint8Array;
    [Symbol.iterator](): Iterator<[Uint8Array, Uint8Array]>
  };
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>,
               item_0: string,
               merkleRoot_0: Uint8Array): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
