# Brevo Email Setup — Runbook

Brevo (ex-Sendinblue) is the configured email provider for Fain si Punct.
EU-based (France), GDPR-native, 300 emails/day free, scales to marketing +
SMS on the same account.

The codebase uses generic SMTP via `nodemailer` (`lib/email.js`), so Brevo
requires **no code changes** — only credentials and DNS records.

---

## 1. Create the Brevo account

1. Sign up: https://www.brevo.com/
2. Company info: **Reoria** / Fain si Punct, Romania.
3. Complete identity verification (Brevo may require a phone call or a
   short questionnaire before enabling sending — this is normal for anti-
   spam compliance).
4. Plan: start on **Free** (300 emails/day). Upgrade to **Starter** (€9/mo,
   5k/mo, no daily cap, removes Brevo footer) once volume grows.

---

## 2. Verify the sender domain (required)

Sending from `@gmail.com`, `@yahoo.com` etc. will be blocked by DMARC.
Send from your own domain.

### Steps

1. In Brevo: **Senders, Domains & Dedicated IPs → Domains → Add a domain**.
2. Enter your domain (e.g. `fainsipunct.ro`).
3. Brevo shows 3–4 DNS records (DKIM, Brevo-code, DMARC, optional tracking).
4. Add them at your DNS provider (likely the registrar — Namecheap, Hostinger,
   GoDaddy, Cloudflare — whoever holds the domain's nameservers).

### Records you'll add

| Type  | Host                  | Value                                             |
|-------|-----------------------|---------------------------------------------------|
| TXT   | `brevo-code._domainkey` | (DKIM public key provided by Brevo)              |
| TXT   | `@` (SPF, merge if existing) | `v=spf1 include:spf.brevo.com ~all`       |
| TXT   | `brevo-code`          | (authentication code provided by Brevo)           |
| TXT   | `_dmarc`              | `v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.ro` |

If you already have an SPF record, **merge** — don't add a second one.
Only one SPF TXT record per domain is valid. Example merge:
```
v=spf1 include:_spf.google.com include:spf.brevo.com ~all
```

5. Back in Brevo, click **Authenticate** on each record. DNS propagation
   takes 5 min – 48 h. Usually under 1 hour.
6. Add at least one **verified sender**: `noreply@yourdomain.ro`. Confirm
   via the link Brevo emails to that address (so create the mailbox first
   at your hosting provider or set up a catch-all forward).

---

## 3. Get SMTP credentials

1. In Brevo: **SMTP & API → SMTP** tab.
2. Copy the **SMTP server**, **Port**, **Login** (looks like
   `xxxxxx@smtp-brevo.com`), and click **Generate a new SMTP key**.
3. Name the key `fain-si-punct-prod` (or similar) and save the key value —
   Brevo shows it once.

### Map to env vars

```env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=xxxxxx@smtp-brevo.com          # Brevo SMTP login
SMTP_PASS=xsmtpsib-xxxxxxxxxxxxxxxx      # The key, not the account password
SENDER_EMAIL=noreply@yourdomain.ro       # Must match a verified sender
SENDER_NAME=Fain si Punct
```

Port 465 with `SMTP_SECURE=true` also works if your host blocks 587.

---

## 4. Local verification

With `.env.local` populated:

```bash
npm run dev
# in a second terminal, open a Node REPL:
node -e "import('./lib/email.js').then(m => m.verifyConnection())"
```

Expect: `SMTP connection verified` logged to stdout. If you see
`535 Authentication failed`, the SMTP key is wrong or the login doesn't
match the key.

Send a test:
```bash
curl -X POST http://localhost:3000/api/emails/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-real-inbox@example.com",
    "subject": "Brevo test",
    "htmlContent": "<p>Hello from Fain si Punct via Brevo.</p>",
    "type": "promotional"
  }'
```

Check:
- Inbox delivery (not spam).
- Gmail: click the 3-dot menu → **Show original** → confirm `SPF=PASS`,
  `DKIM=PASS`, `DMARC=PASS`.
- Brevo dashboard: **Transactional → Statistics** should show the send.

---

## 5. Vercel production setup

In Vercel project → **Settings → Environment Variables**, add the same
6 vars to **Production** AND **Preview** scopes (this repo enforces
preview/prod env parity in `lib/env.js` — preview will fail boot without
them once they're listed in `PROD_REQUIRED`; they currently aren't,
but add to both scopes anyway to avoid silent fallback).

Redeploy after saving. Test via Vercel preview URL before promoting.

---

## 6. Migration from Gmail SMTP

If the project was running on Gmail SMTP previously:

1. Keep Gmail env vars in `.env.local.bak` for rollback.
2. Swap to Brevo vars in `.env.local`.
3. Verify a test send works.
4. Deploy to preview → verify → promote to prod.
5. After 48h of stable sends on Brevo, revoke the Gmail app password at
   https://myaccount.google.com/apppasswords.

No code changes, no template changes, no queue changes. The job queue
(`lib/job-queue.js`) is provider-agnostic.

---

## 7. Webhooks (optional, phase 2)

Brevo sends webhooks for bounces, complaints, opens, clicks. Useful for:
- Auto-suppressing hard-bouncing addresses.
- Tracking delivery/open rates per order.
- GDPR complaint handling.

Not yet implemented. When needed:
1. Brevo → **Transactional → Settings → Webhooks**.
2. Add URL: `https://yourdomain.ro/api/emails/brevo-webhook`.
3. Sign requests with a shared secret (`BREVO_WEBHOOK_SECRET` env var).
4. Implement `app/api/emails/brevo-webhook/route.js` — parse payload,
   update `EmailLog` status, suppress in `User.emailPreferences` on
   hard bounce or complaint.

Payload reference: https://developers.brevo.com/docs/transactional-webhooks

---

## 8. Marketing / newsletter (optional)

Brevo includes **marketing campaigns** on the same account. When ready:

1. Import customer list from Supabase (export `users` with consent flag).
2. Upload only users with `marketingConsent=true` (GDPR — Law 506/2004 RO
   transposition of ePrivacy requires opt-in for unsolicited commercial
   email).
3. Use Brevo's segment builder (e.g. "purchased in last 90 days").
4. Brevo tracks opens/clicks/unsubscribes natively.

Keep marketing sends on a separate **sender** (e.g. `hello@yourdomain.ro`)
from transactional (`noreply@yourdomain.ro`). Reputation is tracked per
sender — bad marketing deliverability should not poison order confirmations.

---

## 9. Limits and monitoring

- Free plan: 300/day. Transactional + marketing share the quota.
- Starter plan: 5k/mo, no daily cap, €9/mo.
- Business plan: +landing pages, A/B testing, €16/mo.

Monitor:
- **Brevo → Statistics → Transactional** — delivery, bounce, spam rates.
- Bounce rate > 5% → investigate list quality, may trigger Brevo review.
- Spam complaint rate > 0.1% → stop marketing sends immediately, review
  opt-in flow.

Sentry captures SMTP errors via existing `lib/email.js` try/catch —
failures log to console + return `{success: false}` which the caller
(`lib/job-queue.js`) retries with exponential backoff up to
`EMAIL_MAX_RETRIES` (default 4).

---

## Troubleshooting

**`535 Authentication failed`** — SMTP key wrong, or login doesn't match
the key's account. Regenerate key in Brevo.

**Emails going to spam** — DNS records not fully propagated, or SPF has
multiple records. Check with `dig TXT yourdomain.ro +short` — should see
exactly one `v=spf1 ...` line.

**`550 Sender not allowed`** — `SENDER_EMAIL` doesn't match a verified
sender. Add it in Brevo → **Senders**.

**`421 Too many concurrent connections`** — rate limit. Free tier caps
concurrent SMTP sessions. Job queue serializes sends, so this only
happens under burst load — reduce worker concurrency.

**Domain says "Not authenticated" in Brevo after 24h** — DNS record at
wrong host (e.g. `brevo-code._domainkey.yourdomain.ro.yourdomain.ro` —
some registrars auto-append the domain). Remove the trailing domain from
the Host field.

---

## References

- Brevo SMTP docs: https://developers.brevo.com/docs/send-a-transactional-email
- Brevo DNS authentication: https://help.brevo.com/hc/en-us/articles/12163873383186
- Romanian GDPR / ePrivacy (Law 506/2004): https://www.dataprotection.ro/
- Codebase email module: `lib/email.js`
- Templates: `lib/templates/*.js`
- Job queue: `lib/job-queue.js`
