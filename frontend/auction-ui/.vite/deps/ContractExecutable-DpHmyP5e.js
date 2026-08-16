import { n as __exportAll } from "./rolldown-runtime-CoDluQUr.js";
import { F as MaintenanceUpdate, H as PreTranscript, K as ReplaceAuthority, N as LedgerParameters, W as QueryContext, Z as StateValue, Zi as partitionTranscripts, ct as VerifierKeyRemove, d as ContractOperationVersion, f as ContractOperationVersionedVerifierKey, l as ContractMaintenanceAuthority, ma as signData, r as ChargedState, st as VerifierKeyInsert } from "./midnight_ledger_wasm-Dv3N6P-x.js";
import { C as mapError, E as sync, O as try_, T as runSync, _ as andThen, _t as right, a as asHex, bt as identity, d as getProvableCircuitIds, dt as isNone, ft as match, g as all, gt as left, ht as isLeft, i as SigningKey, mt as getOrThrow, n as Keys, s as TypeIdError, t as ZKConfiguration, ut as getOrThrow$1, v as cached, vt as pipeArguments, w as provide$1, x as gen, y as flatMap, yt as dual } from "./ZKConfiguration-ODiHLmwj.js";
import { $ as createConstructorContext, V as sampleSigningKey, W as signatureVerifyingKey, X as createCircuitContext, it as emptyZswapLocalState, n as ContractMaintenanceAuthority$1, ot as encodeZswapLocalState, rn as CompactError, rt as decodeZswapLocalState } from "./dist-lrxkyrfs.js";
//#region ../node_modules/@midnight-ntwrk/compact-js/dist/esm/effect/internal/compactContext.js
/** @internal */
var TypeId$2 = Symbol();
/** @internal */
var getContractContext = (compiledContract) => compiledContract[TypeId$2];
/** @internal */
var createContract = (compiledContract) => sync(() => {
	const context = getContractContext(compiledContract);
	if (!context.ctor) throw new Error("Invalid CompactContext (missing constructor)");
	return new context.ctor(context.witnesses);
});
//#endregion
//#region ../node_modules/@midnight-ntwrk/compact-js/dist/esm/effect/ContractConfigurationError.js
var TypeId$1 = Symbol.for("compact-js/effect/ContractConfigurationError");
/**
* An error occurred while executing a constructor, or a circuit, of an executable contract with regards to
* its configuration.
*
* @category errors
*/
var ContractConfigurationError = class extends TypeIdError(TypeId$1, "ContractConfigurationError") {};
/**
* Creates a new {@link ContractConfigurationError}.
*
* @category constructors
*/
var make$2 = (message, contractState, cause) => new ContractConfigurationError({
	message,
	contractState,
	cause
});
//#endregion
//#region ../node_modules/@midnight-ntwrk/compact-js/dist/esm/effect/ContractRuntimeError.js
var TypeId = Symbol.for("compact-js/effect/ContractRuntimeError");
/**
* A runtime error occurred while executing a constructor, or a circuit, of an executable contract.
*
* @category errors
*/
var ContractRuntimeError = class extends TypeIdError(TypeId, "ContractRuntimeError") {};
/**
* Creates a new {@link ContractRuntimeError}.
*
* @category constructors
*/
var make$1 = (message, cause) => new ContractRuntimeError({
	message,
	cause
});
//#endregion
//#region ../node_modules/@midnight-ntwrk/compact-js/dist/esm/effect/ContractExecutable.js
var ContractExecutable_exports = /* @__PURE__ */ __exportAll({
	make: () => make,
	provide: () => provide
});
var DEFAULT_CMA_THRESHOLD = 1;
var DEFAULT_SIGNATURE_INDEX = 0n;
var asLedgerQueryContext = (queryContext) => {
	const stateValue = StateValue.decode(queryContext.state.state.encode());
	const ledgerQueryContext = new QueryContext(new ChargedState(stateValue), queryContext.address);
	ledgerQueryContext.block = queryContext.block;
	ledgerQueryContext.effects = queryContext.effects;
	return ledgerQueryContext;
};
var partitionTranscript = (txContext, finalTxContext, publicTranscript, ledgerParameters) => {
	const partitionedTranscripts = partitionTranscripts([new PreTranscript(Array.from(finalTxContext.comIndices).reduce((queryContext, entry) => queryContext.insertCommitment(...entry), asLedgerQueryContext(txContext)), publicTranscript)], ledgerParameters ?? LedgerParameters.initialParameters());
	return partitionedTranscripts.length === 1 ? right(partitionedTranscripts[0]) : left(/* @__PURE__ */ new Error(`Expected one transcript partition pair, received: ${partitionedTranscripts.length}`));
};
var ContractExecutableImpl = class {
	compiledContract;
	transform;
	constructor(compiledContract, transform = identity) {
		this.compiledContract = compiledContract;
		this.transform = transform;
	}
	pipe() {
		return pipeArguments(this, arguments);
	}
	initialize(initialPrivateState, ...args) {
		return all({
			zkConfigReader: ZKConfiguration.pipe(andThen((zkConfig) => zkConfig.createReader(this.compiledContract))),
			keyConfig: Keys,
			contract: this.createContract()
		}).pipe(flatMap(({ zkConfigReader, keyConfig, contract }) => try_({
			try: () => {
				const { currentContractState, currentPrivateState, currentZswapLocalState } = contract.initialState(createConstructorContext(initialPrivateState, asHex(keyConfig.coinPublicKey)), ...args);
				return {
					contractState: currentContractState,
					privateState: currentPrivateState,
					zswapLocalState: decodeZswapLocalState(currentZswapLocalState)
				};
			},
			catch: (err) => err instanceof CompactError ? make$1("Failed to initialize contract", err) : make$2("Failed to configure constructor context with coin public key", void 0, err)
		}).pipe(flatMap(({ contractState, privateState, zswapLocalState }) => gen(this, function* () {
			const verifierKeys = yield* zkConfigReader.getVerifierKeys(getProvableCircuitIds(contract));
			for (const [provableCircuitId, verifierKey] of verifierKeys) {
				if (isNone(verifierKey)) return yield* make$2(`Failed to find a verifier key for circuit '${provableCircuitId}'`, contractState);
				const operation = contractState.operation(provableCircuitId);
				if (!operation) return yield* make$2(`Circuit '${provableCircuitId}' is undefined for the given contract state`, contractState);
				try {
					operation.verifierKey = verifierKey.value;
					contractState.setOperation(provableCircuitId, operation);
				} catch (err) {
					return yield* make$2(`Failed to configure verifier key for circuit '${provableCircuitId}' for the given contract state`, contractState, err);
				}
			}
			const [cma, signingKey] = yield* this.createMaintenanceAuthority(keyConfig.getSigningKey());
			contractState.maintenanceAuthority = cma;
			return {
				public: { contractState },
				private: {
					signingKey,
					privateState,
					zswapLocalState
				}
			};
		})))), this.transform);
	}
	circuit(provableCircuitId, circuitContext, ...args) {
		return all({
			keyConfig: Keys,
			contract: this.createContract()
		}).pipe(flatMap(({ keyConfig, contract }) => try_({
			try: () => {
				const circuit = contract.provableCircuits[provableCircuitId];
				if (!circuit) throw new Error(`Circuit ${this.compiledContract.tag}#${provableCircuitId} could not be found.`);
				const zswapLocalState = circuitContext.zswapLocalState ? encodeZswapLocalState(circuitContext.zswapLocalState) : emptyZswapLocalState(asHex(keyConfig.coinPublicKey));
				const runtimeContext = createCircuitContext(circuitContext.address, zswapLocalState, circuitContext.contractState, circuitContext.privateState);
				const initialTxContext = runtimeContext.currentQueryContext;
				return {
					...circuit(runtimeContext, ...args),
					initialTxContext
				};
			},
			catch: identity
		}).pipe(flatMap(({ initialTxContext, result, context, proofData }) => gen(function* () {
			return {
				public: {
					contractState: context.currentQueryContext.state.state,
					publicTranscript: proofData.publicTranscript,
					partitionedTranscript: yield* partitionTranscript(initialTxContext, context.currentQueryContext, proofData.publicTranscript, circuitContext.ledgerParameters)
				},
				private: {
					result,
					input: proofData.input,
					output: proofData.output,
					privateTranscriptOutputs: proofData.privateTranscriptOutputs,
					privateState: context.currentPrivateState,
					zswapLocalState: decodeZswapLocalState(context.currentZswapLocalState)
				}
			};
		})), mapError((err) => make$1(`Error executing circuit '${provableCircuitId}'`, err)))), this.transform);
	}
	getProvableCircuitIds() {
		return getProvableCircuitIds(runSync(this.createContract()));
	}
	replaceContractMaintenanceAuthority(newSigningKey, contractContext) {
		return all({ keyConfig: Keys }).pipe(flatMap(({ keyConfig }) => gen(this, function* () {
			const { contractState } = contractContext;
			const [cma, signingKey] = yield* this.createMaintenanceAuthority(newSigningKey, contractState);
			const ledger_cma = ContractMaintenanceAuthority.deserialize(cma.serialize());
			const update = yield* this.createSignedMaintenanceUpdate(() => {
				return right([new ReplaceAuthority(ledger_cma)]);
			}, keyConfig, contractContext);
			return {
				...update,
				private: {
					...update.private,
					signingKey
				}
			};
		})), this.transform);
	}
	removeContractOperation(provableCircuitId, contractContext) {
		return all({ keyConfig: Keys }).pipe(flatMap(({ keyConfig }) => gen(this, function* () {
			return yield* this.createSignedMaintenanceUpdate(() => {
				return right([new VerifierKeyRemove(provableCircuitId, new ContractOperationVersion("v3"))]);
			}, keyConfig, contractContext);
		})), this.transform);
	}
	addOrReplaceContractOperation(provableCircuitId, verifierKey, contractContext) {
		return all({ keyConfig: Keys }).pipe(flatMap(({ keyConfig }) => gen(this, function* () {
			return yield* this.createSignedMaintenanceUpdate(() => {
				return right([new VerifierKeyInsert(provableCircuitId, new ContractOperationVersionedVerifierKey("v3", verifierKey))]);
			}, keyConfig, contractContext);
		})), this.transform);
	}
	createSignedMaintenanceUpdate(createUpdateFn, keyConfig, contractContext) {
		const { address, contractState } = contractContext;
		const currentSigningKey = keyConfig.getSigningKey();
		if (isNone(currentSigningKey)) return left(make$2("Signing key required to authorize contract maintenance update", contractState));
		const update = createUpdateFn();
		if (isLeft(update)) return left(update.left);
		const maintenanceUpdate = new MaintenanceUpdate(address, getOrThrow(update), contractState.maintenanceAuthority.counter);
		return right({
			public: { maintenanceUpdate: maintenanceUpdate.addSignature(DEFAULT_SIGNATURE_INDEX, signData(getOrThrow$1(currentSigningKey), maintenanceUpdate.dataToSign)) },
			private: { signingKey: getOrThrow$1(currentSigningKey) }
		});
	}
	createMaintenanceAuthority(key, contractState) {
		const signingKey = match(key, {
			onSome: identity,
			onNone: () => SigningKey(sampleSigningKey())
		});
		try {
			return right([new ContractMaintenanceAuthority$1([signatureVerifyingKey(signingKey)], DEFAULT_CMA_THRESHOLD, contractState ? contractState.maintenanceAuthority.counter + 1n : 0n), signingKey]);
		} catch (err) {
			return left(make$2(`Failed to create a signature verifying key for signing key '${signingKey}'`, contractState, err));
		}
	}
	createContract() {
		return this.contract ??= createContract(this.compiledContract).pipe(mapError((err) => make$1(String(err), err)), cached, runSync);
	}
	contract;
};
/**
* Takes a Compact compiled contract, and makes it executable.
*
* @param compiledContract A {@link CompiledContract}
* @returns A {@link ContractExecutable} for `compiledContract`.
*
* @category constructors
*/
var make = (compiledContract) => new ContractExecutableImpl(compiledContract);
/**
* Provides a layer to the executable contract.
*
* @category combinators
*/
var provide = dual(2, (self, layer) => new ContractExecutableImpl(self.compiledContract, (e) => provide$1(e, layer)));
//#endregion
export { getContractContext as i, make as n, TypeId$2 as r, ContractExecutable_exports as t };
