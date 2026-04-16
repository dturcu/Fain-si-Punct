import * as Sentry from '@sentry/nextjs'

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    // PII opt-out at source — audit-log is the canonical place for user data.
    sendDefaultPii: false,
    beforeSend(event) {
      // Redact cookies and auth headers just in case something slips in.
      if (event.request?.headers) {
        delete event.request.headers.cookie
        delete event.request.headers.authorization
      }
      return event
    },
  })
}
