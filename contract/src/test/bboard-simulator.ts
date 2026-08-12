// This file is part of midnightntwrk/example-bboard.
// Copyright (C) Midnight Foundation
// SPDX-License-Identifier: Apache-2.0
// Licensed under the Apache License, Version 2.0 (the "License");
// You may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {
  type CircuitContext,
  QueryContext,
  sampleContractAddress,
  convertFieldToBytes,
  createConstructorContext,
  CostModel,
} from "@midnight-ntwrk/compact-runtime";
import {
  Contract,
  type Ledger,
  ledger,
} from "../managed/bboard/contract/index.js";
import {
  type BBoardPrivateState,
  createBBoardPrivateState,
  witnesses,
} from "../witnesses.js";

/**
 * Serves as a testbed to exercise the contract in tests
 */
export class BBoardSimulator {
  readonly contract: Contract<BBoardPrivateState>;
  circuitContext: CircuitContext<BBoardPrivateState>;

  constructor(
    secretKey: Uint8Array,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    merklePath: Uint8Array[] = Array(8).fill(new Uint8Array(32)),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    pathDirections: boolean[] = Array(8).fill(false),
  ) {
    this.contract = new Contract<BBoardPrivateState>(witnesses);
    const {
      currentPrivateState,
      currentContractState,
      currentZswapLocalState,
    } = this.contract.initialState(
      createConstructorContext(
        createBBoardPrivateState(secretKey, merklePath, pathDirections),
        "0".repeat(64),
      ),
    );
    this.circuitContext = {
      currentPrivateState,
      currentZswapLocalState,
      costModel: CostModel.initialCostModel(),
      currentQueryContext: new QueryContext(
        currentContractState.data,
        sampleContractAddress(),
      ),
    };
  }

  public switchUser(
    secretKey: Uint8Array,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    merklePath: Uint8Array[] = Array(8).fill(new Uint8Array(32)),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    pathDirections: boolean[] = Array(8).fill(false),
  ) {
    this.circuitContext.currentPrivateState = createBBoardPrivateState(
      secretKey,
      merklePath,
      pathDirections,
    );
  }

  public updateAllowlistRoot(newRoot: Uint8Array): Ledger {
    this.circuitContext = this.contract.impureCircuits.updateAllowlistRoot(
      this.circuitContext,
      newRoot,
    ).context;
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  public getLedger(): Ledger {
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  public getPrivateState(): BBoardPrivateState {
    return this.circuitContext.currentPrivateState;
  }

  public post(message: string): Ledger {
    this.circuitContext = this.contract.impureCircuits.post(
      this.circuitContext,
      message,
    ).context;
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  public takeDown(): Ledger {
    this.circuitContext = this.contract.impureCircuits.takeDown(
      this.circuitContext,
    ).context;
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  public publicKey(): Uint8Array {
    const sequence = convertFieldToBytes(
      32,
      this.getLedger().sequence,
      "bboard-simulator.ts",
    );
    return this.contract.circuits.publicKey(
      this.circuitContext,
      this.getPrivateState().secretKey,
      sequence,
    ).result;
  }
}
