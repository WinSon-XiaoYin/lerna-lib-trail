'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function login() {}
function autoLogin() {}
function logOut() {}
function refreshToken(grantType) {
  console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
  console.log(grantType);
}
function storeTokenIntoSessionStorage(key, value) {}
function getTokenFromSessionStorage(key) {}
function refreshTokenTimer(mills) {
  setInterval(function () {}, mills);
}

exports.autoLogin = autoLogin;
exports.getTokenFromSessionStorage = getTokenFromSessionStorage;
exports.logOut = logOut;
exports.login = login;
exports.refreshToken = refreshToken;
exports.refreshTokenTimer = refreshTokenTimer;
exports.storeTokenIntoSessionStorage = storeTokenIntoSessionStorage;
