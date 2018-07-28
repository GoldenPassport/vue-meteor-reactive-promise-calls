require("@babel/polyfill");
const PromiseCalls = require('./lib/modules/promiseCalls');

module.exports = {
	install(Vue) {
		Vue.mixin({
			methods: {
				$callPromise: PromiseCalls.callPromise,
				$reactivelyCallPromise: PromiseCalls.reactivelyCallPromise,
				$stopReactivePromiseCalls: PromiseCalls.stopReactivePromiseCalls,
				$stopReactivePromiseCall: PromiseCalls.stopReactivePromiseCall,
				$pauseReactivePromiseCalls: PromiseCalls.pauseReactivePromiseCalls,
				$pauseReactivePromiseCall: PromiseCalls.pauseReactivePromiseCall,
				$resumeReactivePromiseCalls: PromiseCalls.resumeReactivePromiseCalls,
				$resumeReactivePromiseCall: PromiseCalls.resumeReactivePromiseCall
			}
		});
	}
};
