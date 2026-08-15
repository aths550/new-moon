import type {
  ContractAddress,
  SigningKey,
} from "@midnight-ntwrk/midnight-js-protocol/compact-runtime";
import {
  type ExportPrivateStatesOptions,
  type ExportSigningKeysOptions,
  type ImportPrivateStatesOptions,
  type ImportPrivateStatesResult,
  type ImportSigningKeysOptions,
  type ImportSigningKeysResult,
  type PrivateStateExport,
  type PrivateStateId,
  type PrivateStateProvider,
  type SigningKeyExport,
} from "@midnight-ntwrk/midnight-js-types";

/**
 * A localStorage-backed implementation of private state provider.
 */
export const createLocalStoragePrivateStateProvider = <
  PSI extends PrivateStateId,
  PS = unknown,
>(
  serializePS: (ps: PS) => string,
  deserializePS: (str: string) => PS,
): PrivateStateProvider<PSI, PS> => {
  const signingKeys = new Map<ContractAddress, SigningKey>();
  let contractAddress: ContractAddress | null = null;

  const requireContractAddress = (): ContractAddress => {
    if (contractAddress === null) {
      throw new Error(
        "Contract address not set. Call setContractAddress() before accessing private state.",
      );
    }
    return contractAddress;
  };

  const getScopedStates = (address: ContractAddress): Map<PSI, PS> => {
    const raw = localStorage.getItem(`auction-ps-${address}`);
    if (!raw) return new Map<PSI, PS>();
    try {
      const parsed = JSON.parse(raw);
      const map = new Map<PSI, PS>();
      for (const key of Object.keys(parsed)) {
        map.set(key as PSI, deserializePS(parsed[key]));
      }
      return map;
    } catch {
      return new Map<PSI, PS>();
    }
  };

  const saveScopedStates = (address: ContractAddress, map: Map<PSI, PS>) => {
    const obj: Record<string, string> = {};
    for (const [k, v] of map.entries()) {
      obj[k as string] = serializePS(v);
    }
    localStorage.setItem(`auction-ps-${address}`, JSON.stringify(obj));
  };

  const encode = <T>(value: T): string => JSON.stringify(value);
  const decode = <T>(value: string): T => JSON.parse(value) as T;

  const exportPrivateStatePayload = (
    address: ContractAddress,
  ): Record<string, string> =>
    Object.fromEntries(
      Array.from(getScopedStates(address).entries()).map(([stateId, value]) => [
        stateId,
        encode(value),
      ]),
    );

  const exportSigningKeyPayload = (): Record<ContractAddress, SigningKey> =>
    Object.fromEntries(signingKeys.entries());

  return {
    setContractAddress(address: ContractAddress): void {
      contractAddress = address;
    },
    set(key: PSI, state: PS): Promise<void> {
      const addr = requireContractAddress();
      const map = getScopedStates(addr);
      map.set(key, state);
      saveScopedStates(addr, map);
      return Promise.resolve();
    },
    get(key: PSI): Promise<PS | null> {
      const value = getScopedStates(requireContractAddress()).get(key) ?? null;
      return Promise.resolve(value);
    },
    remove(key: PSI): Promise<void> {
      const addr = requireContractAddress();
      const map = getScopedStates(addr);
      map.delete(key);
      saveScopedStates(addr, map);
      return Promise.resolve();
    },
    clear(): Promise<void> {
      localStorage.removeItem(`auction-ps-${requireContractAddress()}`);
      return Promise.resolve();
    },
    setSigningKey(
      contractAddress: ContractAddress,
      signingKey: SigningKey,
    ): Promise<void> {
      signingKeys.set(contractAddress, signingKey);
      return Promise.resolve();
    },
    getSigningKey(
      contractAddress: ContractAddress,
    ): Promise<SigningKey | null> {
      const value = signingKeys.get(contractAddress) ?? null;
      return Promise.resolve(value);
    },
    removeSigningKey(contractAddress: ContractAddress): Promise<void> {
      signingKeys.delete(contractAddress);
      return Promise.resolve();
    },
    clearSigningKeys(): Promise<void> {
      signingKeys.clear();
      return Promise.resolve();
    },
    exportPrivateStates(
      options?: ExportPrivateStatesOptions,
    ): Promise<PrivateStateExport> {
      void options;
      const address = requireContractAddress();
      return Promise.resolve({
        format: "midnight-private-state-export",
        encryptedPayload: encode({
          contractAddress: address,
          states: exportPrivateStatePayload(address),
        }),
        salt: "in-memory-private-state-provider",
      });
    },
    importPrivateStates(
      _exportData: PrivateStateExport,
      _options?: ImportPrivateStatesOptions,
    ): Promise<ImportPrivateStatesResult> {
      return Promise.reject(new Error("importPrivateStates not implemented"));
    },
    exportSigningKeys(
      options?: ExportSigningKeysOptions,
    ): Promise<SigningKeyExport> {
      void options;
      return Promise.resolve({
        format: "midnight-signing-key-export",
        encryptedPayload: encode({
          keys: exportSigningKeyPayload(),
        }),
        salt: "in-memory-signing-key-provider",
      });
    },
    importSigningKeys(
      exportData: SigningKeyExport,
      options?: ImportSigningKeysOptions,
    ): Promise<ImportSigningKeysResult> {
      return Promise.reject(new Error("importSigningKeys not implemented"));
    },
  };
};
