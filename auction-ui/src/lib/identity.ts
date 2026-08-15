import {
  buildMerkleTree,
  getMerkleProof,
} from "../../../contract/src/auction-merkle.js";
import {
  AuctionPrivateState,
  createAuctionPrivateState,
} from "../../../contract/src/index.js";

export interface BidderIdentity {
  secretKey: Uint8Array;
  merkleRoot: Uint8Array;
  merklePath: Uint8Array[];
  pathDirections: boolean[];
}

/**
 * Gets or generates a stable single-bidder identity for a given contract address.
 * Persists the secret key in localStorage so the user retains their identity across reloads.
 */
export function getBidderIdentity(contractAddress: string): BidderIdentity {
  const storageKey = `auction-identity-${contractAddress}`;
  const storedHex = localStorage.getItem(storageKey);

  let secretKey: Uint8Array;
  if (storedHex) {
    secretKey = Buffer.from(storedHex, "hex");
  } else {
    secretKey = new Uint8Array(32);
    crypto.getRandomValues(secretKey);
    localStorage.setItem(storageKey, Buffer.from(secretKey).toString("hex"));
  }

  // Our identity is a tree with exactly one leaf (us), padded to the required depth.
  const { root, layers } = buildMerkleTree([secretKey]);
  const { merklePath, pathDirections } = getMerkleProof(layers, 0);

  return {
    secretKey,
    merkleRoot: root,
    merklePath,
    pathDirections,
  };
}

/**
 * Builds the Midnight AuctionPrivateState matching this identity.
 * Bid amount and salt are initialized to 0.
 */
export function buildIdentityPrivateState(
  identity: BidderIdentity,
): AuctionPrivateState {
  return createAuctionPrivateState(
    identity.secretKey,
    identity.merklePath,
    identity.pathDirections,
    0n,
    new Uint8Array(32), // Zero salt initially
  );
}

export function saveBidderIdentity(
  contractAddress: string,
  secretKey: Uint8Array,
): void {
  const storageKey = `auction-identity-${contractAddress}`;
  localStorage.setItem(storageKey, Buffer.from(secretKey).toString("hex"));
}
