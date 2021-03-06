import isRetryAllowed from 'is-retry-allowed';

var namespace = 'axios-retry';
/**
 * @param  {Error}  error
 * @return {boolean}
 */

function isNetworkError(error) {
  return !error.response && Boolean(error.code) && // Prevents retrying cancelled requests
  error.code !== 'ECONNABORTED' && // Prevents retrying timed out requests
  isRetryAllowed(error); // Prevents retrying unsafe errors
}
var SAFE_HTTP_METHODS = ['get', 'head', 'options'];
var IDEMPOTENT_HTTP_METHODS = /*#__PURE__*/SAFE_HTTP_METHODS.concat(['put', 'delete']);
/**
 * @param  {Error}  error
 * @return {boolean}
 */

function isRetryableError(error) {
  return error.code !== 'ECONNABORTED' && (!error.response || error.response.status >= 500 && error.response.status <= 599);
}
/**
 * @param  {Error}  error
 * @return {boolean}
 */

function isSafeRequestError(error) {
  if (!error.config) {
    // Cannot determine if the request can be retried
    return false;
  }

  return isRetryableError(error) && SAFE_HTTP_METHODS.indexOf(error.config.method) !== -1;
}
/**
 * @param  {Error}  error
 * @return {boolean}
 */

function isIdempotentRequestError(error) {
  if (!error.config) {
    // Cannot determine if the request can be retried
    return false;
  }

  return isRetryableError(error) && IDEMPOTENT_HTTP_METHODS.indexOf(error.config.method) !== -1;
}
/**
 * @param  {Error}  error
 * @return {boolean}
 */

function isNetworkOrIdempotentRequestError(error) {
  return isNetworkError(error) || isIdempotentRequestError(error);
}
/**
 * @param  {Error}  error
 * @return {boolean}
 */

function isTokenExpired(error) {
  if (error.response.status === 401) {
    refreshToken().then(function () {
      return true;
    })["catch"](function (err) {
      return false;
    });
  } else {
    return false;
  }
}
var refreshToken = function refreshToken() {
  var refreshToken = sessionStorage.getItem("refreshToken");
  var refreshTokenAddress = process.ENV.refreshTokenAddress;
  return axios({
    method: "post",
    url: refreshTokenAddress,
    data: "",
    headers: {
      "Content-Type": "application/json",
      "refreshToken": refreshToken
    }
  });
};
/**
 * @return {number} - delay in milliseconds, always 0
 */

function noDelay() {
  return 0;
}
/**
 * @param  {number} [retryNumber=0]
 * @return {number} - delay in milliseconds
 */


function exponentialDelay(retryNumber) {
  if (retryNumber === void 0) {
    retryNumber = 0;
  }

  var delay = Math.pow(2, retryNumber) * 100;
  var randomSum = delay * 0.2 * Math.random(); // 0-20% of the delay

  return delay + randomSum;
}
/**
 * Initializes and returns the retry state for the given request/config
 * @param  {AxiosRequestConfig} config
 * @return {Object}
 */

function getCurrentState(config) {
  var currentState = config[namespace] || {};
  currentState.retryCount = currentState.retryCount || 0;
  config[namespace] = currentState;
  return currentState;
}
/**
 * Returns the axios-retry options for the current request
 * @param  {AxiosRequestConfig} config
 * @param  {AxiosRetryConfig} defaultOptions
 * @return {AxiosRetryConfig}
 */


function getRequestOptions(config, defaultOptions) {
  return Object.assign({}, defaultOptions, config[namespace]);
}
/**
 * @param  {Axios} axios
 * @param  {AxiosRequestConfig} config
 */


function fixConfig(axios, config) {
  if (axios.defaults.agent === config.agent) {
    delete config.agent;
  }

  if (axios.defaults.httpAgent === config.httpAgent) {
    delete config.httpAgent;
  }

  if (axios.defaults.httpsAgent === config.httpsAgent) {
    delete config.httpsAgent;
  }
}
/**
 * Adds response interceptors to an axios instance to retry requests failed due to network issues
 *
 * @example
 *
 * import axios from 'axios';
 *
 * axiosRetry(axios, { retries: 3 });
 *
 * axios.get('http://example.com/test') // The first request fails and the second returns 'ok'
 *   .then(result => {
 *     result.data; // 'ok'
 *   });
 *
 * // Exponential back-off retry delay between requests
 * axiosRetry(axios, { retryDelay : axiosRetry.exponentialDelay});
 *
 * // Custom retry delay
 * axiosRetry(axios, { retryDelay : (retryCount) => {
 *   return retryCount * 1000;
 * }});
 *
 * // Also works with custom axios instances
 * const client = axios.create({ baseURL: 'http://example.com' });
 * axiosRetry(client, { retries: 3 });
 *
 * client.get('/test') // The first request fails and the second returns 'ok'
 *   .then(result => {
 *     result.data; // 'ok'
 *   });
 *
 * // Allows request-specific configuration
 * client
 *   .get('/test', {
 *     'axios-retry': {
 *       retries: 0
 *     }
 *   })
 *   .catch(error => { // The first request fails
 *     error !== undefined
 *   });
 *
 * @param {Axios} axios An axios instance (the axios object or one created from axios.create)
 * @param {Object} [defaultOptions]
 * @param {number} [defaultOptions.retries=3] Number of retries
 * @param {boolean} [defaultOptions.shouldResetTimeout=false]
 *        Defines if the timeout should be reset between retries
 * @param {Function} [defaultOptions.retryCondition=isNetworkOrIdempotentRequestError]
 *        A function to determine if the error can be retried
 * @param {Function} [defaultOptions.retryDelay=noDelay]
 *        A function to determine the delay between retry requests
 */


function axiosRetry(axios, defaultOptions) {
  axios.interceptors.request.use(function (config) {
    var currentState = getCurrentState(config);
    currentState.lastRequestTime = Date.now();
    return config;
  }); //   axios.interceptors.response.use(
  //     data => {
  //       return data;
  //     },
  //     err => {
  //       if (err.response.status === 504 || err.response.status === 404) {
  //         console.log("服务器被吃了⊙﹏⊙∥");
  //       } else if (err.response.status === 401) {
  //         console.log("登录信息失效⊙﹏⊙∥");
  //       } else if (err.response.status === 500) {
  //         console.log("服务器开小差了⊙﹏⊙∥");
  //       }
  //       return Promise.reject(err);
  //     }
  //   );

  axios.interceptors.response.use(null, function (error) {
    var config = error.config; // If we have no information to retry the request

    if (!config) {
      return Promise.reject(error);
    }

    var _getRequestOptions = getRequestOptions(config, defaultOptions),
        _getRequestOptions$re = _getRequestOptions.retries,
        retries = _getRequestOptions$re === void 0 ? 3 : _getRequestOptions$re,
        _getRequestOptions$re2 = _getRequestOptions.retryCondition,
        retryCondition = _getRequestOptions$re2 === void 0 ? isNetworkOrIdempotentRequestError : _getRequestOptions$re2,
        _getRequestOptions$re3 = _getRequestOptions.retryDelay,
        retryDelay = _getRequestOptions$re3 === void 0 ? noDelay : _getRequestOptions$re3,
        _getRequestOptions$sh = _getRequestOptions.shouldResetTimeout,
        shouldResetTimeout = _getRequestOptions$sh === void 0 ? false : _getRequestOptions$sh;

    var currentState = getCurrentState(config);
    var shouldRetry = retryCondition(error) && currentState.retryCount < retries;

    if (shouldRetry) {
      currentState.retryCount += 1;
      var delay = retryDelay(currentState.retryCount, error); // Axios fails merging this configuration to the default configuration because it has an issue
      // with circular structures: https://github.com/mzabriskie/axios/issues/370

      fixConfig(axios, config);

      if (!shouldResetTimeout && config.timeout && currentState.lastRequestTime) {
        var lastRequestDuration = Date.now() - currentState.lastRequestTime; // Minimum 1ms timeout (passing 0 or less to XHR means no timeout)

        config.timeout = Math.max(config.timeout - lastRequestDuration - delay, 1);
      }

      config.transformRequest = [function (data) {
        return data;
      }];
      return new Promise(function (resolve) {
        return setTimeout(function () {
          return resolve(axios(config));
        }, delay);
      });
    }

    return Promise.reject(error);
  });
} // Compatibility with CommonJS

axiosRetry.isTokenExpired = isTokenExpired;
axiosRetry.isNetworkError = isNetworkError;
axiosRetry.isSafeRequestError = isSafeRequestError;
axiosRetry.isIdempotentRequestError = isIdempotentRequestError;
axiosRetry.isNetworkOrIdempotentRequestError = isNetworkOrIdempotentRequestError;
axiosRetry.exponentialDelay = exponentialDelay;
axiosRetry.isRetryableError = isRetryableError;

export default axiosRetry;
export { exponentialDelay, isIdempotentRequestError, isNetworkError, isNetworkOrIdempotentRequestError, isRetryableError, isSafeRequestError, isTokenExpired, refreshToken };
