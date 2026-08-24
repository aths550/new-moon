import "./globals.js";

import React from "react";
import ReactDOM from "react-dom/client";
import {
  setNetworkId,
  NetworkId,
} from "@midnight-ntwrk/midnight-js-network-id";
import App from "./App.js";
import CssBaseline from "@mui/material/CssBaseline";
import "@midnight-ntwrk/dapp-connector-api";
import * as pino from "pino";
import { DeployedAuctionProvider } from "./contexts/DeployedAuctionContext.js";

const networkId = import.meta.env.VITE_NETWORK_ID as NetworkId;
if (!networkId) {
  throw new Error("VITE_NETWORK_ID is not defined in environment variables");
}

// Ensure that the network IDs are set within the Midnight libraries.
setNetworkId(networkId);

// Create a default `pino` logger and configure it with the configured logging level.
export const logger = pino.pino({
  level: (import.meta.env.VITE_LOGGING_LEVEL as string) || "info",
});

logger.trace(`networkId = ${networkId}`);

// Retry transient proof-server failures (502/503) with backoff, since shared
// preview infra can be briefly overloaded. Real errors (400, 413, etc.) pass through untouched.
const originalFetch = window.fetch.bind(window);
window.fetch = async (...args: Parameters<typeof fetch>) => {
  const input = args[0];
  const url = typeof input === "string" ? input : (input as Request).url;
  if (!url.includes("/api/prove/")) {
    return originalFetch(...args);
  }

  let lastResponse: Response | undefined;
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await originalFetch(...args);
    if (res.status !== 502 && res.status !== 503) {
      return res;
    }
    lastResponse = res;
    await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
  }
  return lastResponse as Response;
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <CssBaseline />
    <DeployedAuctionProvider logger={logger}>
      <App />
    </DeployedAuctionProvider>
  </React.StrictMode>,
);
