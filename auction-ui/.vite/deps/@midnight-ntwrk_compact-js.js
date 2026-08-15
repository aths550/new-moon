import { n as __exportAll } from "./rolldown-runtime-CoDluQUr.js";
import { c as ProvableCircuitId, d as getProvableCircuitIds, l as VerifierKey, u as ZKIR, vt as pipeArguments, yt as dual } from "./ZKConfiguration-ODiHLmwj.js";
import { i as getContractContext, r as TypeId$1, t as ContractExecutable_exports } from "./ContractExecutable-DpHmyP5e.js";
//#region ../node_modules/@midnight-ntwrk/compact-js/dist/esm/effect/CompiledContract.js
var CompiledContract_exports = /* @__PURE__ */ __exportAll({
	TypeId: () => TypeId,
	getCompiledAssetsPath: () => getCompiledAssetsPath,
	make: () => make,
	withCompiledFileAssets: () => withCompiledFileAssets,
	withVacantWitnesses: () => withVacantWitnesses,
	withWitnesses: () => withWitnesses
});
var TypeId = Symbol.for("compact-js/CompiledContract");
var CompiledContractProto = {
	[TypeId]: {
		_C: (_) => _,
		_PS: (_) => _,
		_R: (_) => _
	},
	pipe() {
		return pipeArguments(this, arguments);
	}
};
/**
* Initializes an object that represents a binding to a Compact compiled contract.
*
* @param tag A unique identifier that represents this type of contract.
* @param ctor The contract constructor, as imported from the compiled Compact output.
* @returns A {@link CompiledContract}.
*
* @category constructors
*/
var make = (tag, ctor) => {
	const self = Object.create(CompiledContractProto);
	self.tag = tag;
	self[TypeId$1] = { ctor };
	return self;
};
/**
* Associates an object that implements the contract witnesses for the Compact compiled contract.
*
* @category combinators
*/
var withWitnesses = dual(2, (self, witnesses) => {
	return {
		...self,
		[TypeId$1]: {
			...self[TypeId$1],
			witnesses
		}
	};
});
/**
* Associates _vacant_ witnesses with a Compact compiled contract that specifies no witnesses.
*
* @param self The {@link CompiledContract} for which no witnesses are required.
*
* @category combinators
*/
var withVacantWitnesses = (self) => {
	return {
		...self,
		[TypeId$1]: {
			...self[TypeId$1],
			witnesses: {}
		}
	};
};
/**
* Associates a file path of where to find the compiled assets for the Compact compiled contract.
*
* @remarks
* Relative file paths will be resolved relative to the base paths provided to each service that accesses
* the compiled file assets.
*
* @category combinators
*/
var withCompiledFileAssets = dual(2, (self, compiledAssetsPath) => {
	return {
		...self,
		[TypeId$1]: {
			...self[TypeId$1],
			compiledAssetsPath
		}
	};
});
/**
* Retrieves a path to file based assets associated with a compiled contract.
*
* @param self The {@link CompiledContract} from which the assets path should be retrieved.
* @returns A string representing a path to the file assets configured for `self`.
*/
var getCompiledAssetsPath = (self) => {
	return getContractContext(self).compiledAssetsPath;
};
//#endregion
export { CompiledContract_exports as CompiledContract, ContractExecutable_exports as ContractExecutable, ProvableCircuitId, VerifierKey, ZKIR, getProvableCircuitIds };
