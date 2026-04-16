/**
 * HTTP helper with a bounded timeout.
 *
 * Every outbound call to a payment provider, courier API, or invoicing
 * provider must use this. Without a timeout, a stalled upstream hangs the
 * serverless function until Vercel kills it (10s+) and blocks the user.
 *
 * Usage:
 *   const res = await fetchWithTimeout(url, { method: 'POST', ... }, 10_000)
 */
export async function fetchWithTimeout(input, init = {}, timeoutMs = 10_000) {
  const signal = init.signal
    ? AbortSignal.any([init.signal, AbortSignal.timeout(timeoutMs)])
    : AbortSignal.timeout(timeoutMs)
  return fetch(input, { ...init, signal })
}

/**
 * Default timeout budgets per provider (ms). Tune per upstream SLA.
 */
export const TIMEOUTS = {
  stripe: 10_000, // Stripe configures its own timeout on the SDK client
  paypal: 15_000, // PayPal IPN verify roundtrip is slower
  revolut: 10_000,
  oblio: 15_000, // Oblio is occasionally slow
  sameday: 10_000,
  generic: 8_000,
}
