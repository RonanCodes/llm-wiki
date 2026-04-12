# Decisions & Open Questions

## Decisions Made

### One engine, many vaults (not many interconnected systems)
**Decision:** Claude Code is the engine. Skills live in `.claude/`. Vaults are dumb folders of markdown the engine operates on.
**Why:** Vaults are data, not applications. Centralizing logic means maintaining 1 system instead of N. A vault doesn't need its own skills — the same ingest/query/lint/promote works everywhere.
**Vault-specific skills:** Optional and rare (1% of cases). Even then, put them in the main skills folder.

### Separate vault per domain/project (not one mega-wiki)
**Decision:** One wiki per research topic/project. A meta vault for cross-cutting knowledge.
**Why:** Different privacy levels, independent lifecycles, clean git history, size independence. Karpathy himself uses separate wikis per research area ("various topics of research interest", plural).
**Source:** Karpathy's tweets + gist. Community comment #354 confirms: "running this pattern across multiple related knowledge domains."

### Each vault is its own git repo
**Decision:** Vaults are separate git repos, gitignored from the engine repo.
**Why:** Privacy (personal vault private, work vault shared), lifecycle (archive when project ships), size (500 PDFs in raw/ don't bloat other vaults).

### Meta vault for cross-project knowledge
**Decision:** A long-lived vault for knowledge not tied to any single project — tech patterns, strategy playbooks, vendor evaluations.
**Why:** Without this, reusable knowledge gets trapped in project vaults. You re-research things you already figured out. The promote operation moves learnings from project vaults into meta.
**Note:** Start without meta. Create it when you notice re-researching something.

### Next.js web app (not Expo native app)
**Decision:** Next.js app deployed as a PWA for mobile access.
**Why:** One codebase handles API routes (server-side vault access, Claude API calls) and UI. PWA works on mobile browser, installable to home screen, no app store. Expo adds significant complexity for minimal gain unless native features (push notifications, camera) are needed.

### Docker + Watchtower for self-hosted deployment
**Decision:** Docker Compose with Watchtower for auto-deploy.
**Why:** Push code -> CI builds image -> pushes to registry -> Watchtower detects within 5 min -> auto-redeploys. No webhook plumbing needed. Simplest auto-deploy setup.

### Domain tags in frontmatter from day one
**Decision:** All wiki pages get domain tags in YAML frontmatter.
**Why:** Community comment #364: "If there's any chance your knowledge spans multiple projects — add a domain tag to your frontmatter now. Shared entities become the most valuable nodes. Retrofitting this is painful."

### CLI tools for tweet/gist reading
**Decision:** Built `.claude/skills/read-tweet.md` and `.claude/skills/read-gist.md`.
**Methods:**
- Tweets: FXTwitter API (`api.fxtwitter.com`) — free, no auth, returns full text including note tweets. Fallback: oEmbed API.
- Gists: Raw URL (`gist.githubusercontent.com/.../raw/`) — bypasses API, no 502s. Fallback: `gh gist view --raw`, then `gh api`.
**Why yt-dlp doesn't work:** Only extracts video, fails on text-only tweets.
**Why syndication API is insufficient:** Truncates note tweets at ~280 chars.

## Open Questions

### Where does meta vault live?
Inside `vaults/` alongside project vaults? Or elevated to sit alongside the engine? It's long-lived and closely tied to how you work, so it might deserve a special position. **Decision deferred.**

### How many vaults to start with?
Recommendation: start with 2 (one personal, one for most active project). Don't create empty vaults speculatively. Create meta when you notice re-researching. **Not yet decided — user is still thinking.**

### Search at scale
At ~100 sources / ~hundreds of pages, `index.md` works fine (Karpathy confirms). Beyond that, need proper search. Options:
- [qmd](https://github.com/tobi/qmd) — local markdown search, hybrid BM25/vector, has CLI + MCP server
- Custom search script (LLM can help vibe-code it)
**Decision deferred until needed.**

### Obsidian integration depth
Obsidian is the viewer/IDE. Useful plugins:
- **Obsidian Web Clipper** — convert web articles to markdown for raw/
- **Marp** — markdown slide decks from wiki content
- **Dataview** — queries over page frontmatter
- **Graph view** — see wiki shape, hubs, orphans
**Decision deferred — figure out as we build.**

### SaaS auth provider
Options: Clerk (Vercel native), Descope, Auth0, roll your own.
**Decision deferred until SaaS phase.**
