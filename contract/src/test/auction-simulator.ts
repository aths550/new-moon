// Testbed simulator for sealed-bid auction smart contract

import {
  type CircuitContext,
  sampleContractAddress,
  createConstructorContext,
  createCircuitContext,
} from "@midnight-ntwrk/compact-runtime";
import {
  Contract,
  type Ledger,
  ledger,
} from "../managed/auction/contract/index.js";
import {
  type AuctionPrivateState,
  createAuctionPrivateState,
  witnesses,
} from "../auction-witnesses.js";

export class AuctionSimulator {
  readonly contract: Contract<AuctionPrivateState>;
  circuitContext: CircuitContext<AuctionPrivateState>;

  constructor(
    item: string,
    merkleRoot: Uint8Array,
    secretKey: Uint8Array,
    merklePath: Uint8Array[] = Array.from(
      { length: 8 },
      () => new Uint8Array(32),
    ),
    pathDirections: boolean[] = Array.from({ length: 8 }, () => false),
    bidAmount: bigint = 0n,
    bidSalt: Uint8Array = new Uint8Array(32),
  ) {
    this.contract = new Contract<AuctionPrivateState>(witnesses);
    const {
      currentPrivateState,
      currentContractState,
      currentZswapLocalState,
    } = this.contract.initialState(
      createConstructorContext(
        createAuctionPrivateState(
          secretKey,
          merklePath,
          pathDirections,
          bidAmount,
          bidSalt,
        ),
        "0".repeat(64),
      ),
      item,
      merkleRoot,
    );
    this.circuitContext = createCircuitContext(
      sampleContractAddress(),
      currentZswapLocalState,
      currentContractState.data,
      currentPrivateState,
    );
  }

  public switchUser(
    secretKey: Uint8Array,
    merklePath: Uint8Array[] = Array.from(
      { length: 8 },
      () => new Uint8Array(32),
    ),
    pathDirections: boolean[] = Array.from({ length: 8 }, () => false),
    bidAmount: bigint = 0n,
    bidSalt: Uint8Array = new Uint8Array(32),
  ) {
    this.circuitContext.currentPrivateState = createAuctionPrivateState(
      secretKey,
      merklePath,
      pathDirections,
      bidAmount,
      bidSalt,
    );
  }

  public computeCommitmentHash(salt: Uint8Array, amount: bigint): Uint8Array {
    return this.contract.circuits.computeCommitment(
      this.circuitContext,
      salt,
      amount,
    ).result;
  }

  public updateAllowlistRoot(newRoot: Uint8Array): Ledger {
    this.circuitContext = this.contract.impureCircuits.updateAllowlistRoot(
      this.circuitContext,
      newRoot,
    ).context;
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  public commitBid(commitmentHash: Uint8Array): Ledger {
    this.circuitContext = this.contract.impureCircuits.commitBid(
      this.circuitContext,
      commitmentHash,
    ).context;
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  public advanceToReveal(): Ledger {
    this.circuitContext = this.contract.impureCircuits.advanceToReveal(
      this.circuitContext,
    ).context;
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  public revealBid(): Ledger {
    this.circuitContext = this.contract.impureCircuits.revealBid(
      this.circuitContext,
    ).context;
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  public closeAuction(): Ledger {
    this.circuitContext = this.contract.impureCircuits.closeAuction(
      this.circuitContext,
    ).context;
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  public getLedger(): Ledger {
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  public getPrivateState(): AuctionPrivateState {
    return this.circuitContext.currentPrivateState;
  }
}
