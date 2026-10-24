// Read at build time: set VITE_API_BASE_URL on the host and redeploy after changing it.
// Only VITE_* variables reach the browser bundle, so never put secrets in them.
const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) || "http://localhost:4010"

export const env = {
  apiBaseUrl: rawBaseUrl.trim().replace(/\/+$/, ""),
} as const
