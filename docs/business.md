# Business Model

## Dual Model: Open Source + SaaS

The open source version is the marketing engine. The SaaS is the business. Same codebase, different deployment config.

## Open Source (Free)

Public GitHub repo. Users self-host everything.

- Clone repo, create vaults, use Claude Code skills locally
- Optionally deploy to their own VPS with Docker
- Bring your own Claude API key
- Full feature parity with SaaS (minus managed infra)

**Purpose:** Build trust, attract contributors, free marketing. The Karpathy post got 55K likes — people are actively building implementations. Being the definitive open source version is the play.

## SaaS (Paid)

Hosted version — same app, we run the infra.

### Pricing Tiers

| Tier | Price | What you get |
|------|-------|-------------|
| **Free / OSS** | $0 | Self-host, bring everything yourself |
| **BYO Key** | ~$10/mo | Hosted app, paste your Claude API key, we run infra |
| **All-in** | ~$30-50/mo | We cover Claude API usage too, usage-capped |

### SaaS Features (beyond OSS)

- **Multi-tenant vault management** — create/delete vaults from UI, per-user isolation
- **Auth** — sign up, manage account
- **API key management** — paste your Claude key, or subscribe for included usage
- **Hosted wiki viewer** — browse wiki in browser, graph view, search
- **Mobile PWA** — zero setup, just open a URL
- **Auto-sync & backups** — vaults versioned, exportable as git repos anytime
- **Optional GitHub sync** — user connects their GitHub, vaults auto-push to their repos (premium feature)

### Vault Storage (SaaS)

Vaults are NOT on GitHub by default for SaaS customers. That adds complexity and API limits.

| Storage | How it works | Who it's for |
|---------|-------------|-------------|
| **Default** | Vaults on our infra, local git for history | Most users |
| **GitHub sync** | User connects GitHub, vaults push to their repos | Power users wanting ownership |
| **Export** | Download vault as zip anytime | Everyone — no lock-in |

### Critical Principle: No Lock-in

Vault export is always available. It's just markdown files. Users can leave anytime and take their knowledge with them. This is a feature, not a risk — builds trust, aligns with the Karpathy ethos.

## Go-to-Market

1. Ship the open source repo with good README and docs
2. Post on X and LinkedIn referencing Karpathy's original tweet/gist
3. The 30+ community implementations from the gist comments are potential users/contributors
4. SaaS waitlist from day one

## Technical Additions for SaaS (beyond OSS)

- Users table + auth (Clerk or similar)
- Per-user vault storage (S3 or filesystem with user namespacing)
- Proxy layer routing Claude API calls through our key or theirs
- Stripe for billing
