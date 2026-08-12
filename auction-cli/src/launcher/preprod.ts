import dns from "node:dns";
import net from "node:net";
import tls from "node:tls";

dns.setDefaultResultOrder("ipv4first");

const origNetConnect = net.connect;
/* eslint-disable @typescript-eslint/no-explicit-any */
(net as any).connect = function (...args: any[]) {
  if (
    typeof args[0] === "object" &&
    args[0] !== null &&
    args[0].family === undefined
  ) {
    args[0].family = 4;
  }
  return origNetConnect.apply(this, args as any);
};

const origTlsConnect = tls.connect;
(tls as any).connect = function (...args: any[]) {
  if (
    typeof args[0] === "object" &&
    args[0] !== null &&
    args[0].family === undefined
  ) {
    args[0].family = 4;
  }
  return origTlsConnect.apply(this, args as any);
};
/* eslint-enable @typescript-eslint/no-explicit-any */

import { createLogger } from "../logger-utils.js";
import { run } from "../index.js";
import { PreprodRemoteConfig } from "../config.js";

const config = new PreprodRemoteConfig();
const logger = await createLogger(config.logDir);
const testEnvironment = config.getEnvironment(logger);
await run(config, testEnvironment, logger);
