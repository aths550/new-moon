import { useContext } from "react";
import { DeployedAuctionContext } from "../contexts/DeployedAuctionContext.js";
import { type DeployedAuctionAPIProvider } from "../contexts/BrowserDeployedAuctionManager.js";

/**
 * Gets the current {@link DeployedAuctionAPIProvider} from the nearest {@link DeployedAuctionContext}.
 *
 * @throws If there is no current {@link DeployedAuctionContext}.
 */
export const useDeployedAuctionContext = (): DeployedAuctionAPIProvider => {
  const context = useContext(DeployedAuctionContext);
  if (context === undefined) {
    throw new Error(
      "useDeployedAuctionContext must be used within a DeployedAuctionProvider",
    );
  }
  return context;
};
