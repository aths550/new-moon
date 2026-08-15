import { $ as match, A as unsafeMakeMemoMap, B as unsafeRunSyncEffect, D as tryPromise, F as unsafeRunPromise, G as extend, H as unsafeRunSyncExitEffect, I as unsafeRunPromiseEffect, J as scopeMake, K as isFailType, L as unsafeRunPromiseExit, M as unsafeFork, N as unsafeForkEffect, P as unsafeRunCallback, Q as fromMap$1, R as unsafeRunPromiseExitEffect, S as map, U as TypeId$1, V as unsafeRunSyncExit, W as close, X as CommitPrototype, Y as SyncScheduler, Z as constantCase$1, at as suspend, b as forEach, ct as all, et as die, f as mergeAll, h as succeed, it as provideContext, j as defaultRuntime, k as toRuntimeWithMemoMap, l as VerifierKey, lt as nominal, m as setConfigProvider, nt as flatMap, o as ConstrainedPlainHex, ot as tap, p as provide$1, pt as some, q as pretty, r as layer, rt as flatten, s as TypeIdError, st as withFiberRuntime, t as ZKConfiguration, tt as exitVoid, vt as pipeArguments, x as gen, z as unsafeRunSync } from "./ZKConfiguration-ODiHLmwj.js";
//#region ../node_modules/effect/dist/esm/ConfigProvider.js
/**
* Constructs a ConfigProvider using a map and the specified delimiter string,
* which determines how to split the keys in the map into path segments.
*
* @since 2.0.0
* @category constructors
*/
var fromMap = fromMap$1;
/**
* Returns a new config provider that will automatically convert all property
* names to constant case. This can be utilized to adapt the names of
* configuration properties from the default naming convention of camel case
* to the naming convention of a config provider.
*
* @since 2.0.0
* @category combinators
*/
var constantCase = constantCase$1;
//#endregion
//#region ../node_modules/effect/dist/esm/internal/managedRuntime.js
function provide(managed, effect) {
	return flatMap(managed.runtimeEffect, (rt) => withFiberRuntime((fiber) => {
		fiber.setFiberRefs(rt.fiberRefs);
		fiber.currentRuntimeFlags = rt.runtimeFlags;
		return provideContext(effect, rt.context);
	}));
}
var ManagedRuntimeProto = {
	...CommitPrototype,
	[TypeId$1]: TypeId$1,
	pipe() {
		return pipeArguments(this, arguments);
	},
	commit() {
		return this.runtimeEffect;
	}
};
/** @internal */
var make$3 = (layer, memoMap) => {
	memoMap = memoMap ?? unsafeMakeMemoMap();
	const scope = unsafeRunSyncEffect(scopeMake());
	let buildFiber;
	const runtimeEffect = suspend(() => {
		if (!buildFiber) {
			const scheduler = new SyncScheduler();
			buildFiber = unsafeForkEffect(tap(extend(toRuntimeWithMemoMap(layer, memoMap), scope), (rt) => {
				self.cachedRuntime = rt;
			}), {
				scope,
				scheduler
			});
			scheduler.flush();
		}
		return flatten(buildFiber.await);
	});
	const self = Object.assign(Object.create(ManagedRuntimeProto), {
		memoMap,
		scope,
		runtimeEffect,
		cachedRuntime: void 0,
		runtime() {
			return self.cachedRuntime === void 0 ? unsafeRunPromiseEffect(self.runtimeEffect) : Promise.resolve(self.cachedRuntime);
		},
		dispose() {
			return unsafeRunPromiseEffect(self.disposeEffect);
		},
		disposeEffect: suspend(() => {
			self.runtimeEffect = die("ManagedRuntime disposed");
			self.cachedRuntime = void 0;
			return close(self.scope, exitVoid);
		}),
		runFork(effect, options) {
			return self.cachedRuntime === void 0 ? unsafeForkEffect(provide(self, effect), options) : unsafeFork(self.cachedRuntime)(effect, options);
		},
		runSyncExit(effect) {
			return self.cachedRuntime === void 0 ? unsafeRunSyncExitEffect(provide(self, effect)) : unsafeRunSyncExit(self.cachedRuntime)(effect);
		},
		runSync(effect) {
			return self.cachedRuntime === void 0 ? unsafeRunSyncEffect(provide(self, effect)) : unsafeRunSync(self.cachedRuntime)(effect);
		},
		runPromiseExit(effect, options) {
			return self.cachedRuntime === void 0 ? unsafeRunPromiseExitEffect(provide(self, effect), options) : unsafeRunPromiseExit(self.cachedRuntime)(effect, options);
		},
		runCallback(effect, options) {
			return self.cachedRuntime === void 0 ? unsafeRunCallback(defaultRuntime)(provide(self, effect), options) : unsafeRunCallback(self.cachedRuntime)(effect, options);
		},
		runPromise(effect, options) {
			return self.cachedRuntime === void 0 ? unsafeRunPromiseEffect(provide(self, effect), options) : unsafeRunPromise(self.cachedRuntime)(effect, options);
		}
	});
	return self;
};
//#endregion
//#region ../node_modules/effect/dist/esm/ManagedRuntime.js
/**
* Convert a Layer into an ManagedRuntime, that can be used to run Effect's using
* your services.
*
* @since 2.0.0
* @category runtime class
* @example
* ```ts
* import { Console, Effect, Layer, ManagedRuntime } from "effect"
*
* class Notifications extends Effect.Tag("Notifications")<
*   Notifications,
*   { readonly notify: (message: string) => Effect.Effect<void> }
* >() {
*   static Live = Layer.succeed(this, { notify: (message) => Console.log(message) })
* }
*
* async function main() {
*   const runtime = ManagedRuntime.make(Notifications.Live)
*   await runtime.runPromise(Notifications.notify("Hello, world!"))
*   await runtime.dispose()
* }
*
* main()
* ```
*/
var make$2 = make$3;
//#endregion
//#region ../node_modules/@midnight-ntwrk/compact-js/dist/esm/effect/ContractExecutableRuntime.js
var make$1 = (layer) => make$2(layer);
//#endregion
//#region ../node_modules/@midnight-ntwrk/compact-js/dist/esm/effect/ZKConfigurationReadError.js
var TypeId = Symbol.for("compact-js/effect/ZKConfigurationReadError");
/**
* Error indicating a failure to read a ZK asset.
*
* @category errors
*/
var ZKConfigurationReadError = class extends TypeIdError(TypeId, "ZKConfigurationReadError") {};
/**
* Creates a new {@link ZKConfigurationReadError}.
*
* @category constructors
*/
var make = (contractTag, provableCircuitId, assetType, cause) => new ZKConfigurationReadError({
	contractTag,
	provableCircuitId,
	assetType,
	message: `Failed to read ${assetType.replaceAll("-", " ")} for ${contractTag}#${provableCircuitId}`,
	cause
});
//#endregion
//#region ../node_modules/@midnight-ntwrk/platform-js/dist/esm/effect/ContractAddress.js
var ContractAddress = all(nominal(), ConstrainedPlainHex({ byteLength: "32..=32" }));
//#endregion
//#region ../node_modules/@midnight-ntwrk/midnight-js-types/dist/index.mjs
/**
* Creates a ZK configuration reader by adapting a given {@link ZKConfigProvider}.
*
* @param zkConfigProvider The {@link ZKConfigProvider} that is to be adapted.
* @returns A {@link ZKConfiguration.ZKConfiguration.Reader | ZKConfiguration.Reader} that reads from
* `zkConfigProvider`.
*
* @internal
*/
var makeAdaptedReader = (zkConfigProvider) => (compiledContract) => gen(function* () {
	const getVerifierKey = (provableCircuitId) => tryPromise({
		try: () => zkConfigProvider.getVerifierKey(provableCircuitId).then((verifierKey) => some(VerifierKey(verifierKey))),
		catch: (err) => make(compiledContract.tag, provableCircuitId, "verifier-key", err)
	});
	return {
		getVerifierKey,
		getVerifierKeys: (provableCircuitIds) => forEach(provableCircuitIds, (provableCircuitId) => getVerifierKey(provableCircuitId).pipe(map((verifierKey) => [provableCircuitId, verifierKey])), {
			concurrency: "unbounded",
			discard: false
		})
	};
});
var makeAdaptedRuntimeLayer = (zkConfigProvider, configMap) => mergeAll(succeed(ZKConfiguration, ZKConfiguration.of({ createReader: makeAdaptedReader(zkConfigProvider) })), layer).pipe(provide$1(setConfigProvider(fromMap(configMap, { pathDelim: "_" }).pipe(constantCase))));
/**
* Constructs an Effect managed runtime configured to execute contract executables.
*
* @param zkConfigProvider The {@link ZKConfigProvider} that is to be adapted.
* @param options Values that will be mapped into and made available within the constructed runtime.
* @returns An Effect {@link ManagedRuntime} that can be used to execute {@link ContractExecutable} instances.
*/
var makeContractExecutableRuntime = (zkConfigProvider, options) => {
	let config = [["KEYS_COIN_PUBLIC", options.coinPublicKey]];
	if (options.signingKey) config = config.concat([["KEYS_SIGNING", options.signingKey]]);
	return make$1(makeAdaptedRuntimeLayer(zkConfigProvider, new Map(config)));
};
/**
* Unwraps an Effect `Exit` instance, returning its value if it is successful, or throwing the error contained
* within it.
*
* @param exit The source Effect `Exit` instance.
* @returns The value from `exit` if it is successful, otherwise throws the error contained within it.
*/
var exitResultOrError = (exit) => match(exit, {
	onSuccess: (a) => a,
	onFailure: (cause) => {
		if (isFailType(cause)) throw cause.error;
		throw new Error(`Unexpected error: ${pretty(cause)}`);
	}
});
/**
* Wraps an object into an `Option.some`.
*
* @param obj The value that should be wrapped into an `Option`.
* @returns An `Option.some` for `obj`.
*/
var asEffectOption = (obj) => {
	return some(obj);
};
/**
* Constructs a branded contract address from a given string value.
*
* @param address A string value representing a contract address.
* @returns A {@link ContractAddress.ContractAddress | ContractAddress} constructed from `address`.
*/
var asContractAddress = (address) => ContractAddress(address);
/**
* An error describing an invalid protocol scheme.
*/
var InvalidProtocolSchemeError = class extends Error {
	invalidScheme;
	allowableSchemes;
	/**
	* @param invalidScheme The invalid scheme.
	* @param allowableSchemes The valid schemes that are allowed.
	*/
	constructor(invalidScheme, allowableSchemes) {
		super(`Invalid protocol scheme: '${invalidScheme}'. Allowable schemes are one of: ${allowableSchemes.join(",")}`);
		this.invalidScheme = invalidScheme;
		this.allowableSchemes = allowableSchemes;
	}
};
/**
* A valid named log level.
*/
var LogLevel;
(function(LogLevel) {
	/**
	* Log levels typically used by DAapp developers.
	*/
	LogLevel["INFO"] = "info";
	LogLevel["WARN"] = "warn";
	LogLevel["ERROR"] = "error";
	LogLevel["FATAL"] = "fatal";
	/**
	* Log levels used by Midnight.JS to report internal state.
	*/
	LogLevel["DEBUG"] = "debug";
	LogLevel["TRACE"] = "trace";
})(LogLevel || (LogLevel = {}));
/**

* Creates a branded prover key representation from a prover key binary.
*
* @param uint8Array The prover key binary.
*/
var createProverKey = (uint8Array) => {
	return uint8Array;
};
/**
* Creates a branded verifier key representation from a verifier key binary.
*
* @param uint8Array The verifier key binary.
*/
var createVerifierKey = (uint8Array) => {
	return uint8Array;
};
/**
* Creates a branded ZKIR representation from a ZKIR binary.
*
* @param uint8Array The ZKIR binary.
*/
var createZKIR = (uint8Array) => {
	return uint8Array;
};
/**
* Converts a ZKConfig object to ProvingKeyMaterial format.
* @param zkConfig
*/
var zkConfigToProvingKeyMaterial = (zkConfig) => {
	return {
		proverKey: zkConfig.proverKey,
		verifierKey: zkConfig.verifierKey,
		ir: zkConfig.zkir
	};
};
/**
* Indicates that the segment update is invalid.
*/
var SegmentFail = "SegmentFail";
/**
* Indicates that the segment is valid.
*/
var SegmentSuccess = "SegmentSuccess";
/**
* Indicates that the transaction is invalid.
*/
var FailEntirely = "FailEntirely";
/**
* Indicates that the transaction is valid but the portion of the transcript
* that is allowed to fail (the portion after a checkpoint) did fail. All effects
* from the guaranteed part of the transaction are kept but the effects from the
* fallible part of the transaction are discarded.
*/
var FailFallible = "FailFallible";
/**
* Indicates that the guaranteed and fallible portions of the transaction were
* successful.
*/
var SucceedEntirely = "SucceedEntirely";
/**
* A provider for zero-knowledge intermediate representations, prover keys, and verifier keys. All
* three are used by the {@link ProofProvider} to create a proof for a call transaction. The implementation
* of this provider depends on the runtime environment, since each environment has different conventions
* for accessing static artifacts.
* @typeParam K - The type of the circuit ID used by the provider.
*/
var ZKConfigProvider = class {
	/**
	* Retrieves the verifier keys produced by `compactc` compiler for the given circuits.
	* @param circuitIds The circuit IDs of the verifier keys to retrieve.
	*/
	async getVerifierKeys(circuitIds) {
		return Promise.all(circuitIds.map(async (id) => {
			return [id, await this.getVerifierKey(id)];
		}));
	}
	/**
	* Retrieves all zero-knowledge artifacts produced by `compactc` compiler for the given circuit.
	* @param circuitId The circuit ID of the artifacts to retrieve.
	*/
	async get(circuitId) {
		return {
			circuitId,
			proverKey: await this.getProverKey(circuitId),
			verifierKey: await this.getVerifierKey(circuitId),
			zkir: await this.getZKIR(circuitId)
		};
	}
	asKeyMaterialProvider() {
		return this;
	}
};
//#endregion
export { SegmentSuccess as a, asContractAddress as c, createVerifierKey as d, createZKIR as f, ContractAddress as g, zkConfigToProvingKeyMaterial as h, SegmentFail as i, asEffectOption as l, makeContractExecutableRuntime as m, FailFallible as n, SucceedEntirely as o, exitResultOrError as p, InvalidProtocolSchemeError as r, ZKConfigProvider as s, FailEntirely as t, createProverKey as u };
