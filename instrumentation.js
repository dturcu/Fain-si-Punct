/**
 * Next.js instrumentation hook.
 * Bootstraps Sentry iff SENTRY_DSN is configured — otherwise noop, so
 * local dev and preview builds without a DSN behave normally.
 *
 * User needs to:
 *   1. Create a Sentry project.
 *   2. Set SENTRY_DSN (server) and NEXT_PUBLIC_SENTRY_DSN (client) in
 *      Vercel env vars.
 *   3. (optional) Set SENTRY_ENVIRONMENT = 'production' | 'preview' etc.
 */

export async function register() {
  if (!process.env.SENTRY_DSN) return
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

export async function onRequestError(err, request, context) {
  if (!process.env.SENTRY_DSN) return
  const Sentry = await import('@sentry/nextjs')
  Sentry.captureRequestError(err, request, context)
}
