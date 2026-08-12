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

export * from "./managed/bboard/contract/index.js";
export { BBoard, Auction };

export type BBoardContract = BBoard.Contract<
  BBoardPrivateState,
  BBoard.Witnesses<BBoardPrivateState>
>;

/* eslint-disable @typescript-eslint/no-explicit-any */
export const CompiledBBoardContractContract: any = {
  compiledContract: BBoard.Contract,
  witnesses: bboardWitnesses,
};

export type AuctionContract = Auction.Contract<
  AuctionPrivateState,
  Auction.Witnesses<AuctionPrivateState>
>;

export const CompiledAuctionContractContract: any = {
  compiledContract: Auction.Contract,
  witnesses: auctionWitnesses,
};
/* eslint-enable @typescript-eslint/no-explicit-any */

export * from "./witnesses.js";
export {
  createAuctionPrivateState,
  witnesses as auctionWitnesses,
  type AuctionPrivateState,
} from "./auction-witnesses.js";
export * from "./auction-merkle.js";
