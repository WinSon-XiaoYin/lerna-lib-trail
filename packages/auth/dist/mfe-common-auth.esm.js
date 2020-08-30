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

export { autoLogin, getTokenFromSessionStorage, logOut, login, refreshToken, refreshTokenTimer, storeTokenIntoSessionStorage };
