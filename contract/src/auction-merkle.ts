// Off-chain Merkle tree builder matching on-chain persistentHash logic in auction.compact.

import {
  persistentHash,
  CompactTypeBytes,
} from "@midnight-ntwrk/compact-runtime";

const DEPTH = 8;
const Bytes32 = new CompactTypeBytes(32);

const PADDING_SENTINEL_SEED = new TextEncoder().encode(
  "auction:allowlist:padding:v1",
);
const PADDING_SECRET_BYTES = new Uint8Array(32);
PADDING_SECRET_BYTES.set(PADDING_SENTINEL_SEED.subarray(0, 32));

export const PADDING_LEAF = persistentHash(Bytes32, PADDING_SECRET_BYTES);

class BytesPairType {
  alignment() {
    return Bytes32.alignment().concat(Bytes32.alignment());
  }

  /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
  fromValue(value: any): [Uint8Array, Uint8Array] {
    return [Bytes32.fromValue(value[0]), Bytes32.fromValue(value[1])];
  }
  /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */

  toValue(value: [Uint8Array, Uint8Array]) {
    return Bytes32.toValue(value[0]).concat(Bytes32.toValue(value[1]));
  }
}
const BytesPair = new BytesPairType();

export function hashLeaf(secretKey: Uint8Array): Uint8Array {
  return persistentHash(Bytes32, secretKey);
}

export function hashPair(a: Uint8Array, b: Uint8Array): Uint8Array {
  return persistentHash(BytesPair, [a, b]);
}

export function buildMerkleTree(secretKeys: Uint8Array[]): {
  root: Uint8Array;
  layers: Uint8Array[][];
} {
  const leaves = secretKeys.map(hashLeaf);
  while (leaves.length < 2 ** DEPTH) leaves.push(PADDING_LEAF);

  const layers: Uint8Array[][] = [leaves];
  for (let d = 0; d < DEPTH; d++) {
    const prev = layers[layers.length - 1];
    const next: Uint8Array[] = [];
    for (let i = 0; i < prev.length; i += 2) {
      next.push(hashPair(prev[i], prev[i + 1]));
    }
    layers.push(next);
  }
  return { root: layers[DEPTH][0], layers };
}

export function getMerkleProof(
  layers: Uint8Array[][],
  leafIndex: number,
): { merklePath: Uint8Array[]; pathDirections: boolean[] } {
  const merklePath: Uint8Array[] = [];
  const pathDirections: boolean[] = [];
  let idx = leafIndex;
  for (let d = 0; d < DEPTH; d++) {
    const isRightNode = idx % 2 === 1;
    const siblingIdx = isRightNode ? idx - 1 : idx + 1;
    merklePath.push(layers[d][siblingIdx]);
    pathDirections.push(isRightNode);
    idx = Math.floor(idx / 2);
  }
  return { merklePath, pathDirections };
}
