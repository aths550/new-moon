import * as BBoard from "./managed/bboard/contract/index.js";
import * as Auction from "./managed/auction/contract/index.js";
import {
  type BBoardPrivateState,
  witnesses as bboardWitnesses,
} from "./witnesses.js";
import {
  type AuctionPrivateState,
  witnesses as auctionWitnesses,
} from "./auction-witnesses.js";
import { CompiledContract } from "@midnight-ntwrk/compact-js";

export * from "./managed/bboard/contract/index.js";
export { BBoard, Auction };

export type BBoardContract = BBoard.Contract<
  BBoardPrivateState,
  BBoard.Witnesses<BBoardPrivateState>
>;

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */
export const CompiledBBoardContractContract: any = (
  CompiledContract.withWitnesses as any
)(bboardWitnesses)(CompiledContract.make("bboard", BBoard.Contract));

export type AuctionContract = Auction.Contract<
  AuctionPrivateState,
  Auction.Witnesses<AuctionPrivateState>
>;

export const CompiledAuctionContractContract: any = (
  CompiledContract.withWitnesses as any
)(auctionWitnesses)(CompiledContract.make("auction", Auction.Contract));
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */

export * from "./witnesses.js";
export {
  createAuctionPrivateState,
  witnesses as auctionWitnesses,
  type AuctionPrivateState,
} from "./auction-witnesses.js";
export * from "./auction-merkle.js";
