# Privacy-Preserving Sealed-Bid Auction DApp 🌔

A production-grade, zero-knowledge Decentralized Application (DApp) built on the **[Midnight Network](https://midnight.network/)** using the **Compact** smart contract language.

[![Level 3 Submission](https://img.shields.io/badge/Level--3-First%20Quarter-6366f1.svg)](https://midnight.network/)
[![CI Status](https://github.com/aths550/new-moon/actions/workflows/ci.yaml/badge.svg)](https://github.com/aths550/new-moon/actions/workflows/ci.yaml)
[![Compact Compiler](https://img.shields.io/badge/Compact%20Compiler-0.31.1-1abc9c.svg)](https://midnight.network/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue.svg)](https://www.typescriptlang.org/)

---

## 1. Executive Summary & Problem Statement

In conventional blockchain auction systems, all submitted bids are written directly to the public ledger. This publicly exposes bidder identities, financial holdings, and bidding strategies to chain analysis.

### The Solution: Zero-Knowledge Sealed-Bid Commit-Reveal
This application implements a **privacy-preserving sealed-bid auction** on Midnight Network:
1. **Merkle Allowlist Access Control**: Bidders must privately prove inclusion in an 8-level Merkle tree allowlist using a ZK witness (`secretKey`, `merklePath`, `pathDirections`).
2. **Off-Chain Sealed Bids**: During the `Commit` phase, bidders submit only a cryptographic commitment hash `persistentHash([salt, bidAmount])`. The bid amount and salt remain strictly local to the bidder's device.
3. **Zero Ledger Disclosure for Losing Bids**: During the `Reveal` phase, the ZK circuit evaluates `if (disclose(amount > highestBidAmount))` inside zero-knowledge bounds. **Only if the revealed bid exceeds the current highest bid does it update `highestBidAmount` on the public ledger.** If the revealed bid is lower or equal, nothing about the losing bid amount is written on-chain — not even transiently.

---

## 2. Technical Architecture & Privacy Model

| Phase | Public Ledger Data | Private Local Data (Witness) | ZK Circuit Execution |
| :--- | :--- | :--- | :--- |
| **Init** | Item Description, Allowlist Merkle Root | Admin Secret Key | `initAuction(item, merkleRoot)` initializes contract in `Commit` phase. |
| **Commit** | Commitment Hash, Per-Auction Identity Nullifier | Secret Key, Bid Amount, Random Salt, Merkle Proof | `commitBid(commitmentHash)` verifies Merkle proof and nullifier to prevent double-bidding. |
| **Reveal** | Running Max Bid (`highestBidAmount`), Leading Commitment Hash | Secret Key, Bid Amount, Random Salt, Merkle Proof | `revealBid()` privately verifies commitment match and checks `amount > highestBidAmount`. Updates max iff higher. |
| **Ended** | Final Winning Amount, Winner Revealed Flag | None | `closeAuction()` locks auction in `Ended` phase and finalizes winning amount. |

---

## 3. Formally Verified Test Suite (16/16 Passing Tests)

The smart contract test suite in [`contract/src/test/`](contract/src/test/) formally verifies all ledger state transitions and zero-knowledge privacy guarantees:

```text
 RUN  v4.1.10 /Users/atharvasandipnarute/new-moon/contract

 ✓ src/test/bboard.test.ts (7 tests) 118ms
 ✓ src/test/auction.test.ts (9 tests) 188ms

 Test Files  2 passed (2)
      Tests  16 passed (16)
   Start at  01:04:29
   Duration  322ms
```

### Verified Test Cases:
1. `initializes auction in Commit phase with item and Merkle root`
2. `allows admin to update allowlist Merkle root`
3. `allows an allowlisted identity to submit a bid commitment`
4. `rejects bid commitments from non-allowlisted identities`
5. `prevents double-bidding by the same allowlisted identity (nullifier check)`
6. `rejects reveal when revealed salt or amount does not match committed hash`
7. `correctly updates highestBidAmount when a higher bid is revealed`
8. `ignores lower bids revealed after a higher bid — losing bid NEVER hits the ledger`
9. `finalizes winning bidder and amount upon closeAuction`

---

## 4. Workspace Architecture

```text
new-moon/
├── contract/       # Compact smart contracts (auction.compact, bboard.compact), ZK keys & 16 Vitest tests
├── auction-ui/     # React + Material UI DApp with dark glassmorphism design & Lace Wallet integration
├── auction-cli/    # Menu-driven CLI launcher (preprod-remote) with local bid/salt persistence
├── bboard-ui/      # Bulletin Board DApp UI
├── bboard-cli/     # Bulletin Board CLI launcher
├── api/            # TypeScript RxJS API wrappers for contract deployment & interaction
├── patches/        # Reused patch-package setup (@midnight-ntwrk/testkit-js health-check fix)
├── .github/        # GitHub Actions CI workflow (ci.yaml)
└── package.json    # Root workspace package configuration
```

---

## 5. Preprod Network & Wallet Details

- **Preprod Network Wallet Address**: `mn_addr_preprod1ym662fy9l5pdengdlr9mde7gnyxh5ep8ng7hqm3d4dtux3stgpgqrdst0q`
- **On-Chain Balance**: **Confirmed on-chain** (`8,000,000,000` base units / **`8000.0` tNIGHT**).

---

## 6. Developer Commands

- **Run Unit Tests**: `npm test`
- **Compile ZK Circuits & Build All**: `npm run build`
- **Run Full Workspace CI**: `npm run ci`
- **Run Local UI**: `npm run dev --workspace=@midnight-ntwrk/auction-ui`
- **Run Preprod CLI Launcher**: `npm run preprod-remote --workspace=@midnight-ntwrk/auction-cli`
