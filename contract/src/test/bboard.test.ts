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

import { BBoardSimulator } from "./bboard-simulator.js";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { describe, it, expect } from "vitest";
import { randomBytes } from "./utils.js";
import { State } from "../managed/bboard/contract/index.js";
import { buildMerkleTree, getMerkleProof } from "../merkle.js";

setNetworkId("undeployed");

describe("BBoard smart contract with Private Allowlist Access Control", () => {
  it("generates initial ledger state deterministically", () => {
    const key = randomBytes(32);
    const simulator0 = new BBoardSimulator(key);
    const simulator1 = new BBoardSimulator(key);
    expect(simulator0.getLedger()).toEqual(simulator1.getLedger());
  });

  it("properly initializes ledger state", () => {
    const key = randomBytes(32);
    const simulator = new BBoardSimulator(key);
    const initialLedgerState = simulator.getLedger();
    expect(initialLedgerState.sequence).toEqual(1n);
    expect(initialLedgerState.message.is_some).toEqual(false);
    expect(initialLedgerState.message.value).toEqual("");
    expect(initialLedgerState.owner).toEqual(new Uint8Array(32));
    expect(initialLedgerState.state).toEqual(State.VACANT);
    expect(initialLedgerState.merkleRoot).toEqual(new Uint8Array(32));
  });

  it("allows setting and updating the allowlist Merkle root", () => {
    const adminKey = randomBytes(32);
    const user1Key = randomBytes(32);
    const user2Key = randomBytes(32);
    const tree = buildMerkleTree([user1Key, user2Key]);

    const simulator = new BBoardSimulator(adminKey);
    simulator.updateAllowlistRoot(tree.root);
    expect(simulator.getLedger().merkleRoot).toEqual(tree.root);
  });

  it("allows an allowlisted member to post a message using ZK Merkle proof", () => {
    const user1Key = randomBytes(32);
    const user2Key = randomBytes(32);
    const tree = buildMerkleTree([user1Key, user2Key]);
    const proof1 = getMerkleProof(tree.layers, 0);

    const simulator = new BBoardSimulator(
      user1Key,
      proof1.merklePath,
      proof1.pathDirections,
    );
    simulator.updateAllowlistRoot(tree.root);

    const message = "Life before Death, Strength before Weakness.";
    simulator.post(message);

    const ledgerState = simulator.getLedger();
    expect(ledgerState.sequence).toEqual(1n);
    expect(ledgerState.message.is_some).toEqual(true);
    expect(ledgerState.message.value).toEqual(message);
    expect(ledgerState.owner).toEqual(simulator.publicKey());
    expect(ledgerState.state).toEqual(State.OCCUPIED);
  });

  it("rejects a non-allowlisted identity attempting to post", () => {
    const user1Key = randomBytes(32);
    const user2Key = randomBytes(32);
    const intruderKey = randomBytes(32);

    const tree = buildMerkleTree([user1Key, user2Key]);
    const fakeProof = getMerkleProof(tree.layers, 0);

    const simulator = new BBoardSimulator(
      intruderKey,
      fakeProof.merklePath,
      fakeProof.pathDirections,
    );
    simulator.updateAllowlistRoot(tree.root);

    expect(() => simulator.post("I am an un-allowlisted intruder!")).toThrow(
      "failed assert: identity not in authorized allowlist",
    );
  });

  it("lets the owner take down their posted message", () => {
    const user1Key = randomBytes(32);
    const tree = buildMerkleTree([user1Key]);
    const proof1 = getMerkleProof(tree.layers, 0);

    const simulator = new BBoardSimulator(
      user1Key,
      proof1.merklePath,
      proof1.pathDirections,
    );
    simulator.updateAllowlistRoot(tree.root);

    const message = "Confidential post";
    simulator.post(message);
    simulator.takeDown();

    const ledgerState = simulator.getLedger();
    expect(ledgerState.sequence).toEqual(2n);
    expect(ledgerState.message.is_some).toEqual(false);
    expect(ledgerState.state).toEqual(State.VACANT);
  });

  it("prevents non-owners from taking down someone else's post", () => {
    const user1Key = randomBytes(32);
    const user2Key = randomBytes(32);
    const tree = buildMerkleTree([user1Key, user2Key]);
    const proof1 = getMerkleProof(tree.layers, 0);
    const proof2 = getMerkleProof(tree.layers, 1);

    const simulator = new BBoardSimulator(
      user1Key,
      proof1.merklePath,
      proof1.pathDirections,
    );
    simulator.updateAllowlistRoot(tree.root);
    simulator.post("User 1 post");

    simulator.switchUser(user2Key, proof2.merklePath, proof2.pathDirections);
    expect(() => simulator.takeDown()).toThrow(
      "failed assert: Attempted to take down post, but not the current owner",
    );
  });
});
