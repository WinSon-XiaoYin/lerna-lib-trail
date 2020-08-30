export function login<R>(): null

export function autoLogin<R>(): null 

export function logOut<R>(): null 

export function refreshToken<R>(grantType): null 

export function storeTokenIntoSessionStorage<R>(key, value): null 

export function getTokenFromSessionStorage<R>(key): null 

export function refreshTokenTimer<R>(mills): null 