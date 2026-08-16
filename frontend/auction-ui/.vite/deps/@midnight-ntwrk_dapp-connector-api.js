//#region ../node_modules/@midnight-ntwrk/dapp-connector-api/dist/index.mjs
/**
* All possible error codes gathered in a single object.
*/
var ErrorCodes = {
	/** The dapp connector wasn't able to process the request */
	InternalError: "InternalError",
	/** The user rejected the request */
	Rejected: "Rejected",
	/** Can be thrown in various circumstances, e.g. one being a malformed transaction */
	InvalidRequest: "InvalidRequest",
	/** Permission to perform action was rejected. */
	PermissionRejected: "PermissionRejected",
	/** The connection to the wallet was lost */
	Disconnected: "Disconnected"
};
//#endregion
export { ErrorCodes };
