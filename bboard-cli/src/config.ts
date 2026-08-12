// This file is part of midnightntwrk/example-bboard.
// Copyright (C) Midnight Foundation
// SPDX-License-Identifier: Apache-2.0
// Licensed under the Apache License, Version 2.0 (the "License");
// You may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import path from 'node:path';
import {
  EnvironmentConfiguration,
  getTestEnvironment,
  RemoteTestEnvironment,
  TestEnvironment,
} from '@midnight-ntwrk/testkit-js';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { Logger } from 'pino';

export interface Config {
  readonly privateStateStoreName: string;
  readonly logDir: string;
  readonly zkConfigPath: string;
  getEnvironment(logger: Logger): TestEnvironment;
  readonly generateDust: boolean;
}

export const currentDir = path.resolve(new URL(import.meta.url).pathname, '..');

export class StandaloneConfig implements Config {
  getEnvironment(logger: Logger): TestEnvironment {
    return getTestEnvironment(logger) as TestEnvironment;
  }
  privateStateStoreName = 'bboard-private-state';
  logDir = path.resolve(currentDir, '..', 'logs', 'standalone', `${new Date().toISOString()}.log`);
  zkConfigPath = path.resolve(currentDir, '..', '..', 'contract', 'src', 'managed', 'bboard');
  generateDust = false;
}

export class PreviewRemoteConfig implements Config {
  getEnvironment(logger: Logger): TestEnvironment {
    setNetworkId('preview');
    return new PreviewTestEnvironment(logger);
  }
  privateStateStoreName = 'bboard-private-state';
  logDir = path.resolve(currentDir, '..', 'logs', 'preview-remote', `${new Date().toISOString()}.log`);
  zkConfigPath = path.resolve(currentDir, '..', '..', 'contract', 'src', 'managed', 'bboard');
  generateDust = true;
}

export class PreprodRemoteConfig implements Config {
  getEnvironment(logger: Logger): TestEnvironment {
    setNetworkId('preprod');
    return new PreprodTestEnvironment(logger);
  }
  privateStateStoreName = 'bboard-private-state';
  logDir = path.resolve(currentDir, '..', 'logs', 'preprod-remote', `${new Date().toISOString()}.log`);
  zkConfigPath = path.resolve(currentDir, '..', '..', 'contract', 'src', 'managed', 'bboard');
  generateDust = true;
}

export class PreviewTestEnvironment extends RemoteTestEnvironment {
  constructor(logger: Logger) {
    super(logger);
  }

  override healthCheck = async (): Promise<void> => {
    this.logger.info('Performing env health check...');
    const proofServerUrl = this.getProofServerUrl();
    const res = await fetch(`${proofServerUrl}/health`);
    this.logger.info(`Connected to proof server ${proofServerUrl}: ${res.statusText}`);
  };

  override start = async (): Promise<EnvironmentConfiguration> => {
    this.logger.info(`Starting test environment...`);
    const envConfig = this.getEnvironmentConfiguration();
    (this as unknown as { environmentConfiguration: EnvironmentConfiguration }).environmentConfiguration = envConfig;
    this.logger.info(`Test environment configuration: ${JSON.stringify(envConfig)}`);
    await this.healthCheck();
    return envConfig;
  };

  private getProofServerUrl(): string {
    return process.env.PROOF_SERVER_URL ?? 'http://localhost:6300';
  }

  getEnvironmentConfiguration(): EnvironmentConfiguration {
    return {
      walletNetworkId: 'preview',
      networkId: 'preview',
      indexer: 'https://indexer.preview.midnight.network/api/v4/graphql',
      indexerWS: 'wss://indexer.preview.midnight.network/api/v4/graphql/ws',
      node: 'https://rpc.preview.midnight.network',
      nodeWS: 'wss://rpc.preview.midnight.network',
      faucet: undefined,
      proofServer: this.getProofServerUrl(),
    };
  }
}

export class PreprodTestEnvironment extends RemoteTestEnvironment {
  constructor(logger: Logger) {
    super(logger);
  }

  override healthCheck = async (): Promise<void> => {
    this.logger.info('Performing env health check...');
    const proofServerUrl = this.getProofServerUrl();
    const res = await fetch(`${proofServerUrl}/health`);
    this.logger.info(`Connected to proof server ${proofServerUrl}: ${res.statusText}`);
  };

  override start = async (): Promise<EnvironmentConfiguration> => {
    this.logger.info(`Starting test environment...`);
    const envConfig = this.getEnvironmentConfiguration();
    (this as unknown as { environmentConfiguration: EnvironmentConfiguration }).environmentConfiguration = envConfig;
    this.logger.info(`Test environment configuration: ${JSON.stringify(envConfig)}`);
    await this.healthCheck();
    return envConfig;
  };

  private getProofServerUrl(): string {
    return process.env.PROOF_SERVER_URL ?? 'http://localhost:6300';
  }

  getEnvironmentConfiguration(): EnvironmentConfiguration {
    return {
      walletNetworkId: 'preprod',
      networkId: 'preprod',
      indexer: 'https://indexer.preprod.midnight.network/api/v4/graphql',
      indexerWS: 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws',
      node: 'https://rpc.preprod.midnight.network',
      nodeWS: 'wss://rpc.preprod.midnight.network',
      faucet: undefined,
      proofServer: this.getProofServerUrl(),
    };
  }
}
