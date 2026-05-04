# Signup guide — domains, services, keys

Every account you need to register for both sites (`raineylaguna.com` +
`raineylagunastudios.com`) and the Vigía backend, in the order I'd do it.
Estimated total cost first 12 months ≈ **US$ 240** if you choose the cheap
options below.

> Time to complete: ~3 hours of clicking, plus DNS propagation waits.

---

## Tier 0 · Identity (do first, takes 5 min)

You'll reuse this email everywhere; pick now.

- **Owner email:** `stuart@raineylagunastudios.com` (or `hola@`)
  → set up via the email host once the domain is registered (Tier 2).
- **Bitwarden / 1Password:** create a vault before registering anything.
  Every credential below goes in there, not in a Notes app.
  Free: <https://bitwarden.com>

---

## Tier 1 · Domains  (~US$ 30/yr, ~10 min)

Two domains. Cloudflare Registrar is the cheapest legit option (no markup,
free WHOIS privacy, free DNS).

1. Create Cloudflare account → <https://dash.cloudflare.com/sign-up>
2. **Registrar → Register domain**
   - `raineylaguna.com` (~US$ 10/yr)
   - `raineylagunastudios.com` (~US$ 10/yr)
3. Both go into the same Cloudflare account so DNS lives in one place.
4. **Don't add records yet** — we wire them when hosting is set up (Tier 4).

If `.com` is taken: fallback to `raineylaguna.studio` for Studios (US$ 35/yr).

---

## Tier 2 · Email (US$ 0–6/mo, ~15 min)

You need real email at both domains for receipts, Stripe, etc.

**Cheapest path: Zoho Mail (free for 1 domain, 5 users)**

1. <https://www.zoho.com/mail/zohomail-pricing.html> → **Forever Free Plan**
2. Verify domain by adding the TXT record Zoho gives you to Cloudflare DNS.
3. Add MX records Zoho gives you to Cloudflare.
4. Create:
   - `stuart@raineylagunastudios.com`
   - `hola@raineylagunastudios.com`
   - `stuart@raineylaguna.com`  (alias to above is fine)
   - `hola@raineylaguna.com`
5. Set up SPF + DKIM + DMARC records (Zoho's wizard tells you what to paste).

**If you want better deliverability later:** migrate to Fastmail (US$ 5/mo)
or Google Workspace (US$ 6/user/mo). Don't pay for it on day one.

---

## Tier 3 · Hosting + database (~US$ 0–25/mo, ~30 min)

The two static sites cost nothing to host. Vigía (the Next.js backend at
`c:\Users\Stu\vigia`) is the only thing that needs a server.

### 3a · Static sites — Cloudflare Pages (free)

1. Cloudflare → **Workers & Pages → Create → Pages**.
2. Connect to GitHub. (If repos aren't on GitHub yet: see Tier 6.)
3. Project 1: `raineylaguna-com`  → build command empty, output dir `/`.
4. Project 2: `raineylagunastudios-com` → same.
5. Custom domains: attach each to its matching domain. Pages auto-issues SSL.

### 3b · Vigía backend — Vercel Hobby (free until traffic is real)

1. <https://vercel.com/signup> with the same GitHub.
2. **Import project → vigia repo**.
3. Framework auto-detected as Next.js. Deploy.
4. Custom domain: `vigia.raineylaguna.com`. Vercel will tell Cloudflare what
   CNAME to add.
5. Upgrade to Pro (US$ 20/mo) only when you cross the free limit.

### 3c · Database — Neon Postgres (free tier)

Vigía needs a database for audits, brief history, brand provenance, etc.

1. <https://neon.tech/> → sign up.
2. Create project `vigia`. Region: **us-east-2** (closest to Lima users).
3. Copy the connection string → paste into Vercel env var
   `DATABASE_URL` for the Vigía project.
4. Free tier is enough until ~100 audits/month. Upgrade to **Launch**
   (US$ 19/mo) once you have paying customers.

### 3d · File storage — Cloudflare R2 (free 10 GB)

For audit PDFs, NFC chip data, signed brand assets.

1. Cloudflare → **R2 → Create bucket** `vigia-public`.
2. Generate API token (R2 → Manage tokens → "Object Read & Write").
3. Paste into Vercel env vars: `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`,
   `R2_BUCKET=vigia-public`, `R2_ACCOUNT_ID=...`.

---

## Tier 4 · Wire DNS (~10 min, then 1–24 h propagation)

In Cloudflare DNS for **each** domain:

| Type   | Name              | Target                              | Proxy |
|--------|-------------------|-------------------------------------|-------|
| CNAME  | `@`               | (whatever Pages says)               | ✅    |
| CNAME  | `www`             | (whatever Pages says)               | ✅    |
| CNAME  | `vigia` (.com only) | `cname.vercel-dns.com`            | ❌    |
| MX     | `@`               | (Zoho's MX, priorities 10/20/50)    | ❌    |
| TXT    | `@`               | `v=spf1 include:zoho.com ~all`      | ❌    |
| TXT    | `_dmarc`          | `v=DMARC1; p=quarantine; rua=mailto:hola@…` | ❌ |
| TXT    | (Zoho domain key) | (Zoho gives you this)               | ❌    |

Verify with <https://mxtoolbox.com> and <https://www.dnschecker.org>.

---

## Tier 5 · API keys (~45 min)

These power the live audit (`scripts/live-audit.js` v1) and Vigía's brief
generator. **Set every one as an env var on Vercel.**

| Service | What for | Env var | Cost |
|---|---|---|---|
| **Anthropic Claude** | Brief synthesis, audit narrative | `ANTHROPIC_API_KEY` | pay-per-token, ~US$ 3 / 1 M input tokens |
| **OpenAI** (optional fallback) | If Claude fails | `OPENAI_API_KEY` | same model |
| **Google PageSpeed Insights** | Audit step 1 (Lighthouse) | `PAGESPEED_API_KEY` | free, 25k/day |
| **Google Places API** | Reviews / cadence on audits | `GOOGLE_PLACES_API_KEY` | US$ 200/mo free credit |
| **SerpAPI** | Competitor discovery | `SERPAPI_KEY` | US$ 50/mo for 5k searches |
| **Open-Meteo** | Lima weather (manifesto + Garúa) | none, no key | free |
| **Resend** | Audit email + post-audit drip | `RESEND_API_KEY` | free up to 3k/mo, then US$ 20 |
| **Twilio** (optional) | WhatsApp Business outbound | `TWILIO_*` | pay-per-msg |

Sign up:

1. **Anthropic:** <https://console.anthropic.com/> · add US$ 5 credit.
2. **OpenAI:** <https://platform.openai.com/signup> · same.
3. **Google Cloud:** <https://console.cloud.google.com> → enable
   PageSpeed Insights API + Places API → create API key, restrict by
   referrer to `*.raineylaguna.com/*`.
4. **SerpAPI:** <https://serpapi.com/> · Developer plan.
5. **Resend:** <https://resend.com/signup> → verify domain
   `raineylaguna.com` (it'll give you DNS records, paste in Cloudflare).

---

## Tier 6 · Source control + CI (~15 min)

If repos aren't on GitHub yet:

```powershell
cd c:\Users\Stu\raineylaguna
git init; git add .; git commit -m "initial"
gh repo create raineylaguna-com --private --source=. --push
# repeat for raineylagunastudios and vigia
```

Pages + Vercel pick up new commits automatically.

---

## Tier 7 · Calendar (~10 min)

For the Cal.com booking link the audit summary now reads from
`<meta name="rl-cal-booking">`.

1. <https://cal.com/signup> with the studio email.
2. Create event type `audit-30` — 30 min, free, name "Auditoría — 30 min".
3. Connect Google Calendar (or whichever).
4. Copy the URL (`https://cal.com/<handle>/audit-30`).
5. Paste it into the meta tag in `index.html`:
   ```html
   <meta name="rl-cal-booking" content="https://cal.com/stuart-rainey/audit-30">
   ```

The Vigía-side env var `RL_CAL_API_KEY` (from Cal → Developer → API keys)
is only needed if you later want server-side booking from inside the audit.

---

## Tier 8 · Analytics (~5 min)

1. <https://plausible.io/register> (US$ 9/mo, both domains share it).
2. Add sites: `raineylaguna.com` + `raineylagunastudios.com`.
3. The `<script>` tag is already in both `index.html` files; just
   confirm the domain matches what Plausible expects.

Free alternative: **Cloudflare Web Analytics** (already in your CF dash;
zero config, fewer goals, but enough for now).

---

## Tier 9 · Payments (only when first client signs)

- **Stripe Atlas** is overkill for Peru. Use **Stripe Peru** directly
  once you have RUC: <https://stripe.com/pe>.
- **Mercado Pago** for local card-only clients.
- **Yape / Plin** for transfers — no signup, just publish your number.

Skip until you have a signed quote.

---

## Tier 10 · Legal stub (do this month)

- **RUC** (SUNAT) — required to invoice. Stuart already has one (`<span data-rl-ruc>`).
- **DPD / Privacy** — already published at `/privacy/`. When you collect
  emails (audit form, conversemos), **Ley 29733** requires a registered
  database with the Autoridad Nacional de Protección de Datos Personales:
  <https://www.gob.pe/8757>. Free, ~30 min.

---

## Tier 11 · Pre-flight checklist before you flip DNS

Run from each project root:

```powershell
# raineylaguna.com
cd c:\Users\Stu\raineylaguna
node scripts/check-html.mjs
node scripts/check-jsonld.mjs
node scripts/check-en.mjs
node scripts/check-contrast.mjs

# raineylagunastudios.com
cd c:\Users\Stu\raineylagunastudios
node scripts/check-html.mjs
```

All four scripts must exit `0`. Don't deploy until they do.

Last verified all green: 2026-05-03.

---

## Total monthly cost when fully signed up

| Item | Cost (US$) |
|---|---|
| Domains (avg) | 1.70 |
| Email (Zoho free) | 0 |
| Hosting (CF Pages + Vercel hobby) | 0 |
| Neon Postgres free | 0 |
| R2 storage | 0 |
| Plausible | 9 |
| SerpAPI | 50 |
| Anthropic / OpenAI | ~10 |
| Resend | 0 |
| Cal.com free | 0 |
| **Total** | **~US$ 70/mo** |

That's the floor. Until customers sign, you can run everything except
Plausible and SerpAPI on free tiers — true minimum is **~US$ 2/mo**
(domains only).

---

## When stuck

- DNS not resolving after 24 h → re-check at <https://dnschecker.org>,
  flush local DNS, try a different network.
- Vercel build fails → check `package.json` engines; pin Node 20.
- Audit "Vigía caído, modo simulación" → `VIGIA_API` env var or
  `<meta name="vigia-api">` is wrong, or `/api/audit` isn't deployed.
- Email going to spam → SPF/DKIM/DMARC not set; rerun MXToolbox.

End.
