const { check, Match } = Package.check;
import { denodeify } from './utils';

/**
 * Gets a ES2015compatible promise for the result of a Meteor method call
 * @param { String } Name Name of method to invoke
 * @param { EJSONable } [arg1,arg2...] Optional method arguments
 * @returns { Promise }
 */
export const callPromise = denodeify(Meteor.call);
Meteor.callPromise = callPromise;

/**
 * Wraps a reoccurring timeout around a callPromise
 * @param { Object } vueComponent This instance of the vue component
 * @param { String } dataField Name of the data field to set
 * @param { Number } RefreshRate How often to call the method
 * @param { String } methodName Name of the Meteor method
 * @param { EJSONable } [arg1, arg2...] Optional method arguments
 * @returns { Promise }
 */
export const reactivelyCallPromise = async function(...pArgs) {
  const args = pArgs;
  if (args && args[0] && !args[0]._isVue) {
    if (this._isVue) {
      args.unshift(this);
    } else {
      throw new Meteor.Error(
        'vue-meteor-reactive-promise-calls/reactivelyCallPromise',
        'Cannot find Vue Component'
      );
    }
  }

  const vueComponent = args[0];
  const dataField = args[1];
  const refreshRate = args[2];
  const methodName = args[3];

  check(dataField, String);
  check(refreshRate, Number);
  check(methodName, String);

  if (!vueComponent.reactivePromises) {
    vueComponent.reactivePromises = {};
  }
  if (!vueComponent.reactivePromises[methodName]) {
    vueComponent.reactivePromises[methodName] = {};
  }
  if (!vueComponent.reactivePromises[methodName][dataField]) {
    vueComponent.reactivePromises[methodName][dataField] = {};
  }
  const callHistory = vueComponent.reactivePromises[methodName][dataField];
  const repeat = args.includes('pRepeat');
  let methodCallId;
  // First time method called
  if (!callHistory || !repeat) {
    methodCallId = `pMethodCallId${Math.random().toString(19)}`;
    callHistory.methodCallId = methodCallId;
    callHistory.savedCallArgs = args;
  } else {
    methodCallId = args[args.length - 1];
  }
  // Clear call history of duplicate requests
  if (callHistory && !repeat) {
    Meteor.clearTimeout(callHistory.timeout);
  }
  if (methodCallId == callHistory.methodCallId) {
    // Call method and update data value
    vueComponent[dataField] = await callPromise(
      ...args.filter(
        (pValue, pIndex) =>
          pIndex > 2 &&
          pValue &&
          pValue !== 'pRepeat' &&
          (typeof pValue === 'object'
            ? !pValue.hasOwnProperty('pMethodCallId')
            : Array.isArray(pValue)
              ? !pValue.includes('pMethodCallId')
              : pValue !== 'pMethodCallId')
      )
    );

    // Set timeout
    if (
      vueComponent.reactivePromises &&
      vueComponent.reactivePromises[methodName] &&
      vueComponent.reactivePromises[methodName][dataField]
    ) {
      vueComponent.reactivePromises[methodName][dataField].timeout = Meteor.setTimeout(() => {
        reactivelyCallPromise(...(repeat ? args : args.concat(['pRepeat', methodCallId])));
      }, refreshRate);
    }
  }
};
Meteor.reactivelyCallPromise = reactivelyCallPromise;

/**
 * Clears all timeouts started by reactivelyCallPromise
 * @param { Object } vueComponent This instance of the vue component
 * @returns { undefined }
 */
export const stopReactivePromiseCalls = function(...args) {
  const vueComponent = args && args[0] ? args[0] : this;
  if (!vueComponent._isVue) {
    throw new Meteor.Error(
      'vue-meteor-reactive-promise-calls/stopReactivePromiseCalls',
      'Cannot find Vue Component'
    );
  }

  delete vueComponent.reactivePromises;
};
Meteor.stopReactivePromiseCalls = stopReactivePromiseCalls;

/**
 * Clears a specific timeout started by reactivelyCallPromise
 * @param { Object } vueComponent This instance of the vue component
 * @param { String } methodName Name of the Meteor method
 * @returns { undefined }
 */
export const stopReactivePromiseCall = function(...pArgs) {
  const args = pArgs;
  if (args && args[0] && !args[0]._isVue) {
    if (this._isVue) {
      args.unshift(this);
    } else {
      throw new Meteor.Error(
        'vue-meteor-reactive-promise-calls/stopReactivePromiseCall',
        'Cannot find Vue Component'
      );
    }
  }

  const vueComponent = args[0];
  const methodName = args[1];

  check(methodName, String);

  if (vueComponent.reactivePromises[methodName]) {
    delete vueComponent.reactivePromises[methodName];
  }
};
Meteor.stopReactivePromiseCall = stopReactivePromiseCall;

/**
 * Pauses all reactivelyCallPromise calls
 * @param { Object } vueComponent This instance of the vue component
 * @returns { undefined }
 */
export const pauseReactivePromiseCalls = function(...args) {
  const vueComponent = args && args[0] ? args[0] : this;
  if (!vueComponent._isVue) {
    throw new Meteor.Error(
      'vue-meteor-reactive-promise-calls/pauseReactivePromiseCalls',
      'Cannot find Vue Component'
    );
  }

  if (vueComponent.reactivePromises) {
    Object.values(vueComponent.reactivePromises).forEach((pMethod) => {
      Object.values(pMethod).forEach((pDataField) => {
        delete pDataField.methodCallId;
        delete pDataField.timeout;
      });
    });
  }
};
Meteor.pauseReactivePromiseCalls = pauseReactivePromiseCalls;

/**
 * Pauses a specific reactivelyCallPromise call
 * @param { Object } vueComponent This instance of the vue component
 * @param { String } methodName Name of the Meteor method
 * @param { String } dataField Name of the data field to set
 * @returns { undefined }
 */
export const pauseReactivePromiseCall = function(...pArgs) {
  const args = pArgs;
  if (args && args[0] && !args[0]._isVue) {
    if (this._isVue) {
      args.unshift(this);
    } else {
      throw new Meteor.Error(
        'vue-meteor-reactive-promise-calls/pauseReactivePromiseCall',
        'Cannot find Vue Component'
      );
    }
  }

  const vueComponent = args[0];
  const methodName = args[1];
  const dataField = args[2];

  check(methodName, String);
  check(dataField, String);

  if (
    vueComponent.reactivePromises[methodName] &&
    vueComponent.reactivePromises[methodName][dataField]
  ) {
    delete vueComponent.reactivePromises[methodName][dataField].methodCallId;
    delete vueComponent.reactivePromises[methodName][dataField].timeout;
  }
};
Meteor.pauseReactivePromiseCall = pauseReactivePromiseCall;

/**
 * Resume all reactivelyCallPromise calls
 * @param { Object } vueComponent This instance of the vue component
 * @returns { undefined }
 */
export const resumeReactivePromiseCalls = function(...args) {
  const vueComponent = args && args[0] ? args[0] : this;
  if (!vueComponent._isVue) {
    throw new Meteor.Error(
      'vue-meteor-reactive-promise-calls/resumeReactivePromiseCalls',
      'Cannot find Vue Component'
    );
  }

  if (vueComponent.reactivePromises) {
    Object.values(vueComponent.reactivePromises).forEach((pMethod) => {
      Object.values(pMethod).forEach((pDataField) => {
        if (pDataField.savedCallArgs) {
          reactivelyCallPromise(...pDataField.savedCallArgs);
        }
      });
    });
  }
};
Meteor.resumeReactivePromiseCalls = resumeReactivePromiseCalls;

/**
 * Resume a previously called reactivelyCallPromise call
 * @param { Object } vueComponent This instance of the vue component
 * @param { String } methodName Name of the Meteor method
 * @param { String } dataField Name of the data field to set
 * @returns { undefined }
 */
export const resumeReactivePromiseCall = function(...pArgs) {
  const args = pArgs;
  if (args && args[0] && !args[0]._isVue) {
    if (this._isVue) {
      args.unshift(this);
    } else {
      throw new Meteor.Error(
        'vue-meteor-reactive-promise-calls/resumeReactivePromiseCall',
        'Cannot find Vue Component'
      );
    }
  }

  const vueComponent = args[0];
  const methodName = args[1];
  const dataField = args[2];

  check(methodName, String);
  check(dataField, String);

  if (
    vueComponent.reactivePromises[methodName] &&
    vueComponent.reactivePromises[methodName][dataField] &&
    vueComponent.reactivePromises[methodName][dataField].savedCallArgs
  ) {
    reactivelyCallPromise(...vueComponent.reactivePromises[methodName][dataField].savedCallArgs);
  }
};
Meteor.resumeReactivePromiseCall = resumeReactivePromiseCall;
