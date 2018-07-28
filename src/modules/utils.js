/**
 * Convert an NPMstyle function returning a callback to one that returns a Promise
 * @param { String } Name Name of method to invoke
 * @param { EJSONable } [arg1, arg2...] Optional method arguments
 * @returns { Promise }
 */
export const denodeify = (pF) => (...pArgs) =>
	new Promise((pResolve, pReject) => {
		pF(...pArgs, (pErr, pVal) => {
			if (pErr) {
				pReject(pErr);
			} else {
				pResolve(pVal);
			}
		});
	});
