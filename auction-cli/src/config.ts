import path from "node:path";
import {
  EnvironmentConfiguration,
  RemoteTestEnvironment,
  TestEnvironment,
} from "@midnight-ntwrk/testkit-js";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { Logger } from "pino";

export interface Config {
  readonly privateStateStoreName: string;
  readonly logDir: string;
  readonly zkConfigPath: string;
  getEnvironment(logger: Logger): TestEnvironment;
  readonly generateDust: boolean;
}

export const currentDir = path.resolve(new URL(import.meta.url).pathname, "..");

export class PreviewRemoteConfig implements Config {
  getEnvironment(logger: Logger): TestEnvironment {
    setNetworkId("preview");
    return new PreviewTestEnvironment(logger);
  }
  privateStateStoreName = "auction-private-state";
  logDir = path.resolve(
    currentDir,
    "..",
    "logs",
    "preview-remote",
    `${new Date().toISOString()}.log`,
  );
  zkConfigPath = path.resolve(
    currentDir,
    "..",
    "..",
    "contract",
    "src",
    "managed",
    "auction",
  );
  generateDust = true;
}

export class PreviewTestEnvironment extends RemoteTestEnvironment {
  constructor(logger: Logger) {
    super(logger);
  }

  override healthCheck = async (): Promise<void> => {
    this.logger.info("Performing env health check...");
    const proofServerUrl = this.getProofServerUrl();
    const res = await fetch(`${proofServerUrl}/health`);
    this.logger.info(
      `Connected to proof server ${proofServerUrl}: ${res.statusText}`,
    );
  };

  override start = async (): Promise<EnvironmentConfiguration> => {
    this.logger.info(`Starting test environment...`);
    const envConfig = this.getEnvironmentConfiguration();
    /* eslint-disable @typescript-eslint/no-explicit-any */
    (this as any).environmentConfiguration = envConfig;
    /* eslint-enable @typescript-eslint/no-explicit-any */
    this.logger.info(
      `Test environment configuration: ${JSON.stringify(envConfig)}`,
    );
    await this.healthCheck();
    return envConfig;
  };

  private getProofServerUrl(): string {
    return process.env.PROOF_SERVER_URL ?? "http://localhost:6300";
  }

  getEnvironmentConfiguration(): EnvironmentConfiguration {
    return {
      walletNetworkId: "preview",
      networkId: "preview",
      indexer: "https://indexer.preview.midnight.network/api/v4/graphql",
      indexerWS: "wss://indexer.preview.midnight.network/api/v4/graphql/ws",
      node: "https://rpc.preview.midnight.network",
      nodeWS: "wss://rpc.preview.midnight.network",
      faucet: undefined,
      proofServer: this.getProofServerUrl(),
    };
  }
}

export class PreviewRemoteConfig implements Config {
  getEnvironment(logger: Logger): TestEnvironment {
    setNetworkId("preview");
    return new PreviewTestEnvironment(logger);
  }
  privateStateStoreName = "auction-private-state";
  logDir = path.resolve(
    currentDir,
    "..",
    "logs",
    "preview-remote",
    `${new Date().toISOString()}.log`,
  );
  zkConfigPath = path.resolve(
    currentDir,
    "..",
    "..",
    "contract",
    "src",
    "managed",
    "auction",
  );
  generateDust = true;
}

export class PreviewTestEnvironment extends RemoteTestEnvironment {
  constructor(logger: Logger) {
    super(logger);
  }

  override healthCheck = async (): Promise<void> => {
    this.logger.info("Performing env health check...");
    const proofServerUrl = this.getProofServerUrl();
    const res = await fetch(`${proofServerUrl}/health`);
    this.logger.info(
      `Connected to proof server ${proofServerUrl}: ${res.statusText}`,
    );
  };

  override start = async (): Promise<EnvironmentConfiguration> => {
    this.logger.info(`Starting test environment...`);
    const envConfig = this.getEnvironmentConfiguration();
    /* eslint-disable @typescript-eslint/no-explicit-any */
    (this as any).environmentConfiguration = envConfig;
    /* eslint-enable @typescript-eslint/no-explicit-any */
    this.logger.info(
      `Test environment configuration: ${JSON.stringify(envConfig)}`,
    );
    await this.healthCheck();
    return envConfig;
  };

  private getProofServerUrl(): string {
    return process.env.PROOF_SERVER_URL ?? "http://localhost:6300";
  }

  getEnvironmentConfiguration(): EnvironmentConfiguration {
    return {
      walletNetworkId: "preview",
      networkId: "preview",
      indexer: "https://indexer.preview.midnight.network/api/v4/graphql",
      indexerWS: "wss://indexer.preview.midnight.network/api/v4/graphql/ws",
      node: "https://rpc.preview.midnight.network",
      nodeWS: "wss://rpc.preview.midnight.network",
      faucet: undefined,
      proofServer: this.getProofServerUrl(),
    };
  }
}
