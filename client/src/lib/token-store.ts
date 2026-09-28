// The access token lives only in memory (never localStorage) — it's short-lived and
// re-derived from the httpOnly refresh cookie via /auth/refresh on page load or 401.
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}
