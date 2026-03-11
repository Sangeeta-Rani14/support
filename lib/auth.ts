export const AUTH_TOKEN_KEY = "jan_setu_auth_token";
export const REFRESH_TOKEN_KEY = "jan_setu_refresh_token";

export function setTokens(token: string, refreshToken: string) {
    if (typeof window !== "undefined") {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);

        // Also set as cookie for potential server-side use
        document.cookie = `${AUTH_TOKEN_KEY}=${token}; `;
        document.cookie = `${REFRESH_TOKEN_KEY}=${refreshToken}; `;
    }
}

export function getToken() {
    if (typeof window !== "undefined") {
        return localStorage.getItem(AUTH_TOKEN_KEY);
    }
    return null;
}

export function getRefreshToken() {
    if (typeof window !== "undefined") {
        return localStorage.getItem(REFRESH_TOKEN_KEY);
    }
    return null;
}

export function clearTokens() {
    if (typeof window !== "undefined") {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        document.cookie = `${AUTH_TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        document.cookie = `${REFRESH_TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
}

export function isAuthenticated() {
    return !!getToken();
}
