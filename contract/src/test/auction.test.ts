import { AuctionSimulator } from "./auction-simulator.js";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { describe, it, expect } from "vitest";
import { State } from "../managed/auction/contract/index.js";
import { buildMerkleTree, getMerkleProof } from "../auction-merkle.js";

setNetworkId("undeployed");

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  return bytes;
}

describe("Sealed-Bid Auction Smart Contract", () => {
  it("initializes auction in Commit phase with item and Merkle root", () => {
    const adminKey = randomBytes(32);
    const root = randomBytes(32);
    const simulator = new AuctionSimulator("Rare Midnight NFT", root, adminKey);

    const ledger = simulator.getLedger();
    expect(ledger.state).toEqual(State.Commit);
    expect(ledger.itemDescription).toEqual("Rare Midnight NFT");
    expect(ledger.allowlistMerkleRoot).toEqual(root);
    expect(ledger.highestBidAmount).toEqual(0n);
    expect(ledger.winnerRevealed).toEqual(false);
  });

  it("allows admin to update allowlist Merkle root", () => {
    const adminKey = randomBytes(32);
    const user1 = randomBytes(32);
    const tree = buildMerkleTree([user1]);

    const simulator = new AuctionSimulator("Vintage Watch", new Uint8Array(32), adminKey);
    simulator.updateAllowlistRoot(tree.root);

    expect(simulator.getLedger().allowlistMerkleRoot).toEqual(tree.root);
  });

  it("allows an allowlisted identity to submit a bid commitment", () => {
    const user1 = randomBytes(32);
    const tree = buildMerkleTree([user1]);
    const proof1 = getMerkleProof(tree.layers, 0);

    const simulator = new AuctionSimulator("Rare Midnight NFT", tree.root, user1, proof1.merklePath, proof1.pathDirections);

    const salt = randomBytes(32);
    const commitment = simulator.computeCommitmentHash(salt, 500n);

    simulator.commitBid(commitment);
    expect(simulator.getLedger().commitments.size()).toEqual(1n);
  });

  it("rejects bid commitments from non-allowlisted identities", () => {
    const user1 = randomBytes(32);
    const intruder = randomBytes(32);
    const tree = buildMerkleTree([user1]);
    const fakeProof = getMerkleProof(tree.layers, 0);

    const simulator = new AuctionSimulator("Rare Midnight NFT", tree.root, intruder, fakeProof.merklePath, fakeProof.pathDirections);
    const commitment = simulator.computeCommitmentHash(randomBytes(32), 1000n);

    expect(() => simulator.commitBid(commitment)).toThrow("identity not in authorized allowlist");
  });

  it("prevents double-bidding by the same allowlisted identity (nullifier check)", () => {
    const user1 = randomBytes(32);
    const tree = buildMerkleTree([user1]);
    const proof1 = getMerkleProof(tree.layers, 0);

    const simulator = new AuctionSimulator("Rare Midnight NFT", tree.root, user1, proof1.merklePath, proof1.pathDirections);
    simulator.commitBid(simulator.computeCommitmentHash(randomBytes(32), 500n));

    expect(() => simulator.commitBid(simulator.computeCommitmentHash(randomBytes(32), 600n))).toThrow("Identity has already committed a bid");
  });

  it("rejects reveal when revealed salt or amount does not match committed hash", () => {
    const user1 = randomBytes(32);
    const tree = buildMerkleTree([user1]);
    const proof1 = getMerkleProof(tree.layers, 0);

    const salt = randomBytes(32);

    const simulator = new AuctionSimulator(
      "Rare Midnight NFT",
      tree.root,
      user1,
      proof1.merklePath,
      proof1.pathDirections,
      500n,
      salt
    );

    const commitment = simulator.computeCommitmentHash(salt, 500n);
    simulator.commitBid(commitment);
    simulator.advanceToReveal();

    simulator.switchUser(user1, proof1.merklePath, proof1.pathDirections, 999n, salt);

    expect(() => simulator.revealBid()).toThrow("Revealed amount and salt do not match commitment");
  });

  it("correctly updates highestBidAmount when a bid is revealed", () => {
    const user1 = randomBytes(32);
    const tree = buildMerkleTree([user1]);
    const proof1 = getMerkleProof(tree.layers, 0);

    const salt = randomBytes(32);
    const amount = 500n;

    const simulator = new AuctionSimulator(
      "Rare Midnight NFT",
      tree.root,
      user1,
      proof1.merklePath,
      proof1.pathDirections,
      amount,
      salt
    );

    const commitment = simulator.computeCommitmentHash(salt, amount);
    simulator.commitBid(commitment);
    simulator.advanceToReveal();
    simulator.revealBid();

    const ledger = simulator.getLedger();
    expect(ledger.highestBidAmount).toEqual(500n);
    expect(ledger.highestBidCommitment).toEqual(commitment);
  });

  it("ignores lower bids revealed after a higher bid — losing bid NEVER hits the ledger", () => {
    const user1 = randomBytes(32);
    const user2 = randomBytes(32);
    const tree = buildMerkleTree([user1, user2]);
    const proof1 = getMerkleProof(tree.layers, 0);
    const proof2 = getMerkleProof(tree.layers, 1);

    const salt1 = randomBytes(32);
    const amount1 = 1000n;

    const salt2 = randomBytes(32);
    const amount2 = 300n;

    const simulator = new AuctionSimulator(
      "Rare Midnight NFT",
      tree.root,
      user1,
      proof1.merklePath,
      proof1.pathDirections,
      amount1,
      salt1
    );
    const commitment1 = simulator.computeCommitmentHash(salt1, amount1);
    simulator.commitBid(commitment1);

    simulator.switchUser(user2, proof2.merklePath, proof2.pathDirections, amount2, salt2);
    const commitment2 = simulator.computeCommitmentHash(salt2, amount2);
    simulator.commitBid(commitment2);

    simulator.advanceToReveal();

    simulator.switchUser(user1, proof1.merklePath, proof1.pathDirections, amount1, salt1);
    simulator.revealBid();
    expect(simulator.getLedger().highestBidAmount).toEqual(1000n);
    expect(simulator.getLedger().highestBidCommitment).toEqual(commitment1);

    simulator.switchUser(user2, proof2.merklePath, proof2.pathDirections, amount2, salt2);
    simulator.revealBid();

    const finalLedger = simulator.getLedger();
    expect(finalLedger.highestBidAmount).toEqual(1000n);
    expect(finalLedger.highestBidCommitment).toEqual(commitment1);
  });

  it("finalizes winning bidder and amount upon closeAuction", () => {
    const user1 = randomBytes(32);
    const tree = buildMerkleTree([user1]);
    const proof1 = getMerkleProof(tree.layers, 0);

    const salt = randomBytes(32);
    const amount = 750n;

    const simulator = new AuctionSimulator(
      "Rare Midnight NFT",
      tree.root,
      user1,
      proof1.merklePath,
      proof1.pathDirections,
      amount,
      salt
    );

    const commitment = simulator.computeCommitmentHash(salt, amount);
    simulator.commitBid(commitment);
    simulator.advanceToReveal();
    simulator.revealBid();
    simulator.closeAuction();

    const ledger = simulator.getLedger();
    expect(ledger.state).toEqual(State.Ended);
    expect(ledger.winnerRevealed).toEqual(true);
    expect(ledger.winningAmount).toEqual(750n);
  });
});
