---
name: generate-linkedin-cover
description: Render a LinkedIn banner (1584x396, 4:1) via Google Gemini Nano Banana 2 at native 21:9 aspect, composed to read on desktop and mobile. Output is a timestamped PNG in a vault's artifacts/linkedin-covers/ with a prompt sidecar. Reads brand colours and positioning from vault entity pages. Honours /ro:write-copy rules for any text in the banner. Used by /generate linkedin-cover. Not user-invocable directly, go through /generate.
user-invocable: false
allowed-tools: Bash(curl *) Bash(sips *) Bash(which *) Bash(mkdir *) Bash(date *) Bash(cp *) Bash(open *) Bash(python3 *) Bash(git *) Read Write Edit Glob Grep
content-pipeline:
  - pipeline:image
  - platform:linkedin
  - role:adapter
---

# Generate LinkedIn Cover

Produce a LinkedIn profile banner sized to spec (1584x396, 4:1) with safe-zone-aware composition, using Google Gemini Nano Banana 2 for image generation.

## Usage (via /generate router)

```
/generate linkedin-cover [--vault <name>] [--concept <slug>] [--person <slug>]
```

Examples:

```
/generate linkedin-cover                                       # default concept, current person
/generate linkedin-cover --concept typographic-statement        # pick a concept preset
/generate linkedin-cover --concept agent-graph --person ronan   # explicit person + concept
```

## Output naming convention

```
vaults/<vault>/artifacts/linkedin-covers/
  cover-<person-slug>-<YYYY-MM-DD>-<HHMM>.png           # final 1584x396
  cover-<person-slug>-<YYYY-MM-DD>-<HHMM>.prompt.md     # exact prompt sidecar
  source-wide-<person-slug>-<YYYY-MM-DD>-<HHMM>.png     # native 21:9 pre-crop from Gemini
```

**Why timestamped:** a person may iterate on 3-5 covers in a session before picking one. Never overwrite.

## LinkedIn banner spec (2026)

| Spec | Value | Notes |
|---|---|---|
| Canvas | 1584 × 396 px | 4:1 aspect ratio. Personal profile. |
| Safe zone (strict) | center 1100 × 300 px | Desktop + mobile both render this |
| Safe zone (generous) | center 1350 × 220 px | Desktop-focused; mobile may crop edges |
| **Live avatar overlay** | **~x=60-450, y=180-396** | **Observed on live LinkedIn renders. Much bigger than the 568×264 docs imply. Anything in this box gets covered by the profile photo.** |
| Mobile crop | ~central 60% of width | Left/right edges cropped on mobile |
| Format | PNG or JPEG | PNG for sharp typography |
| Max size | 8 MB | |

**Critical composition rule:** on live LinkedIn the profile avatar covers roughly `x=60-450, y=180-396`. Therefore text and important content must live EITHER in the top half (y<180) OR starting at x>450 (clear of the avatar horizontally). Do not rely on the official "bottom-left" docs — they under-represent the live coverage.

## Step 1: Resolve vault + person

Default vault: `personal-work` (identity + LinkedIn lives there). Override with `--vault`.

Resolve the person's identity by reading:

- `wiki/entities/<person>.md` — self-entity (positioning, pronouns, colour palette hints)
- `wiki/sources/linkedin-profile-<person>.md` — current LinkedIn snapshot (tone, headline)
- `wiki/comparisons/headline-bio-drafts-*.md` — latest positioning work
- `wiki/sources/cv-<person>-*.md` — for skill stack and accomplishments referenced in the banner

## Step 2: Brand palette

Default (matches the CV pipeline):

- Navy background: `#0f172a`
- Teal accent: `#14b8a6` (`#0f766e` for darker accent)
- Cream text: `#f8fafc`

Typography: Georgia serif for headline statements, system sans uppercase with letter-spacing for labels.

## Step 3: Pick a concept

### Concept: `typographic-statement` (default)

Confident phrase in editorial serif (headline) plus a teal uppercase tagline. Agent graph on the right.

### Concept: `agent-graph`

Less text, more visual. Headline only (no tagline), larger graph with richer constellation.

**Graph prompt directive (reusable across concepts):** if asking Gemini to render an "agent network" graphic, ALWAYS add the explicit anti-symmetry block below. Without it Gemini defaults to a radial flower/mandala shape that reads as decorative, not technical:

```
ABSOLUTELY CRITICAL: must NOT look like a flower, mandala, sun, or symmetric radial pattern.

An ASYMMETRIC, IRREGULAR network of small nodes connected by thin stroke lines. Looks like a SCATTERED CONSTELLATION or TECHNICAL GRAPH DIAGRAM.
- NO single dominant central hub with radiating spokes.
- NO symmetric petals or radiating rays.
- Nodes arranged irregularly in 2 or 3 loose pockets with stragglers drifting outside.
- Mix of short and long edges; some edges cross each other.
- Natural graph topology (some nodes 4-5 connections, others 1), NOT a wheel or sunburst.
- Think: neural network fragment, constellation of stars, circuit-board excerpt.
```

### Concept: `minimal-marque`

Short phrase, lots of negative space, one subtle accent mark. Most forgiving to any text-render issues.

## Step 4: Generate with Gemini at native 21:9

**This is the step where earlier iterations burned time. The key speed-ups:**

1. **Use `aspectRatio: "21:9"` in `imageConfig`.** This is the widest landscape aspect `nano-banana-pro-preview` supports. 4:1 is in the allowed enum but not implemented for this model — do NOT waste a call trying it.
2. **Compose the prompt for the final 1584×396 crop, not the 21:9 native output.** Tell Gemini to put content in the CENTRAL HORIZONTAL BAND; top and bottom strips will be cropped off.
3. **Give explicit positional rules for the avatar zone.** Prompt must say "left 40% of the canvas must be nearly empty navy — it will be covered by a profile avatar" and "text lives starting at 40% from the left, ending at 72% from the left".
4. **Skip the hybrid HTML-overlay approach unless text is still blurry at 21:9.** At 21:9 native, Gemini renders text crisply enough for LinkedIn. Hybrid (Gemini background + HTML text) was a good fallback for 1:1 and 16:9 renders but is unnecessary when you can get native wide format.

### Canonical Gemini call

```bash
set -a; . ~/.claude/.env; set +a   # loads GEMINI_API_KEY

python3 - <<'PY'
import json, os, base64, urllib.request
api_key = os.environ["GEMINI_API_KEY"]
prompt = """<full prompt, see Step 5>"""
payload = {
    "contents": [{"parts": [{"text": prompt}]}],
    "generationConfig": {
        "responseModalities": ["TEXT", "IMAGE"],
        "imageConfig": {"aspectRatio": "21:9"}
    }
}
url = f"https://generativelanguage.googleapis.com/v1beta/models/nano-banana-pro-preview:generateContent?key={api_key}"
req = urllib.request.Request(url, data=json.dumps(payload).encode(), headers={"Content-Type":"application/json"})
with urllib.request.urlopen(req, timeout=180) as r:
    data = json.loads(r.read())
for part in data.get("candidates",[{}])[0].get("content",{}).get("parts",[]):
    if "inlineData" in part:
        with open("<source-path>","wb") as f:
            f.write(base64.b64decode(part["inlineData"]["data"]))
        break
PY
```

The model returns at roughly 1584×672 (exact 21:9-ish).

### Allowed aspect ratios (for reference)

`nano-banana-pro-preview` accepts: `1:1`, `1:4`, `1:8`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`.
It does NOT implement: `4:1`, `8:1` (they pass syntax validation but fail at generation).

## Step 5: Canonical prompt template

```
Ultra-wide panoramic LinkedIn cover banner, 21:9 aspect ratio, maximum resolution, crystal-sharp text.

CRITICAL layout rules:
- The LEFT 40 PERCENT of the canvas must be nearly empty navy. It will be completely covered by a circular profile avatar on LinkedIn. Put NO text or important decoration there.
- Text (headline and tagline) lives in the MIDDLE portion: starting at ~40% from the left edge, ending at ~72% from the left edge.
- The agent-network graphic lives on the RIGHT: starting ~72% from the left edge.
- Vertically, text sits in the top half; tagline no lower than 60% from the top.

Background: uniform deep navy hex {BACKGROUND_HEX} across the whole canvas. No horizontal bands, no stripes. Subtle atmospheric {ACCENT} glow around the agent-network hub.

TEXT (starting ~40% from left, top half):
{HEADLINE_LINES}
Italicised word: {ITALIC_WORD} in {ACCENT_HEX}; other words in {CREAM_HEX}. LARGE, sharp crystal-clear letterforms. Serif typeface like Georgia or Baskerville.

Below the headline, tagline in uppercase sans-serif {ACCENT_HEX}:
{TAGLINE}
Large enough to read easily, visible letter-spacing.

RIGHT SIDE (starting ~72% from left, centred): an elegant agent-network graphic. Central glowing hub node connected by thin curving {ACCENT_HEX} stroke lines to 15 to 20 smaller satellite nodes in an organic irregular constellation. Subtle luminous glow around the hub.

Style: editorial, cinematic, print-quality, Swiss minimal, soft technical atmosphere. NO AI-synthetic look, NO neon glow, NO horizontal colour bands, NO photos, NO faces, NO brand logos.
```

Fill the `{PLACEHOLDER}` slots from the person's brand palette and the chosen concept.

## Step 6: Apply /ro:write-copy rules to text

Before sending the prompt, scan the in-image text for banned patterns per `/ro:write-copy` (em-dashes, en-dashes, "delve", "leverage", "robust", "seamless", "tapestry", "landscape", "empower", "unlock", "streamline", "not only X but also Y", "it's not just X, it's Y"). Rewrite if anything hits.

## Step 7: Crop or composite to 1584 × 396 with PIL

**Prefer PIL over `sips`.** `sips --cropToHeightWidth` always centre-crops; PIL supports arbitrary offsets AND can composite navy padding when Gemini puts text too tight to an edge.

### Step 7a: Inspect the source first (MANDATORY)

View the source with `Read` before choosing a strategy. Look specifically at:

1. **Where does the headline top sit?** (source y of first ascender)
2. **Where does the tagline bottom sit?** (source y of descenders)
3. **Any white frame around the content?** (Gemini sometimes adds one)
4. **Does text sit close to ANY edge?** Top, bottom, left, right.

### Step 7b: Pick the strategy

| Situation | Strategy | Code |
|---|---|---|
| Text sits comfortably with >50px navy on all sides | Centre crop | `y0 = (src.height - 396) // 2` |
| Text sits low in the source (y > source_h/2) | Top-biased crop | `y0 = text_top - 40` |
| **Text sits tight to the top (source y < 80)** | **Composite onto fresh navy canvas** | see below |
| White frame around source | Crop past the frame first | `y0 = frame_top + (content_height - 396) // 2` |
| Graph clips on either side | Re-generate with `x=1140-1500` tighter | — |

### Step 7c: Composite strategy for tight-top source

Gemini often places the headline at source y=30-60, giving almost no native top padding. Cropping at y=0 alone is not enough — the text still hugs the output top edge. Fix: composite onto a fresh 1584×396 navy canvas with a deliberate top offset.

```python
from PIL import Image
src = Image.open("<source-wide-path>")
navy = (15, 23, 42)   # #0f172a
final = Image.new("RGB", (1584, 396), navy)
# paste_y controls how much navy sits above source content
paste_y = 60          # 60px navy above source top; increase to push text lower
rows_to_paste = 396 - paste_y
final.paste(src.crop((0, 0, 1584, rows_to_paste)), (0, paste_y))
final.save("<final-path>")
```

The paste-y value is the effective "added top padding". Rule of thumb: aim for **total 80-120px of navy above headline ascenders** in the final 396-tall banner.

### Step 7d: Mandatory padding check (close-the-loop rule)

After cropping / compositing, `Read` the output and verify visually:

- **Top padding:** navy space above headline ascenders should be at least 60-80px. If ascenders hug the top edge (<40px), redo with bigger `paste_y` or a larger top offset.
- **Bottom padding:** tagline descenders should have at least 40px navy below them.
- **Left padding:** if headline starts `x < 400`, the avatar will cover it — regenerate with stricter positioning directive.
- **Right margin:** graph should end at or before `x = 1342` for mobile safe zone.

If any check fails, iterate. Do NOT report the cover as final until all four checks pass.

## Step 8: MANDATORY — view the rendered output AND run the four-check gate

Use the `Read` tool on the final PNG. Then run through the four checks explicitly:

1. **Top padding check:** is there at least 60-80px navy above the headline ascenders? (Measure by eye — if the top of the `B` / `h` / `k` looks like it's touching the top edge, the answer is no.)
2. **Bottom padding check:** is there at least 40px navy below the tagline descenders?
3. **Avatar-zone check:** does the first headline letter start at `x > 400`? (Required so the LinkedIn avatar circle at x=60-450 does not cover text.)
4. **Mobile safe-zone check:** does the graph end at `x < 1342`? (Required so mobile's central-60% crop still shows the graph.)

**If any check fails, iterate before reporting.** Do not ever report the cover as "done" without having viewed it AND confirmed all four checks pass. Earlier sessions burned 3-5 iterations because only one of these was checked at a time.

Common failure modes and fixes:

| Check | Fail symptom | Fix |
|---|---|---|
| Top padding | Ascenders hug top edge | Re-composite with larger `paste_y` (Step 7c) |
| Bottom padding | Descenders hug bottom | Reduce `paste_y` or use top-biased crop |
| Avatar zone | Headline starts at x<400 | Regenerate with stronger "left 40% nearly empty" directive |
| Mobile safe-zone | Graph extends to x>1342 | Regenerate with tighter graph bounds (72%-85% from left) |

## Step 9: Write the prompt sidecar

```yaml
---
generator: generate-linkedin-cover@0.2.0
generated-at: <UTC timestamp>
model: nano-banana-pro-preview
aspect-ratio: 21:9
native-dimensions: 1584x672
final-dimensions: 1584x396
crop-strategy: centre | top-biased-y<N>
person: <person-slug>
concept: <concept-slug>
palette:
  background: "#0f172a"
  accent: "#14b8a6"
  text: "#f8fafc"
---

# Prompt

<full prompt text>

# Notes

Anything unexpected: what Gemini did or didn't follow, text clarity at this resolution, avatar collision observed, composition quirks.
```

## Step 10: Open and report

```bash
open "<final-path>"
```

Report in 3-5 bullets:

- Output path
- Concept used
- Composition check: text clear of avatar (x>450 OR y<180)? Tagline fully inside frame? Graph fits safe zone?
- Any issues worth the user knowing
- Offer: regenerate a variant, or commit

Do not auto-commit.

## Rules

- **Always use `aspectRatio: "21:9"`** for the Gemini call. Never 1:1 or 16:9 for banners unless explicitly requested.
- **Always timestamp filenames.** Never overwrite a prior cover.
- **Always view the rendered PNG via `Read`** before reporting. This is the close-the-loop requirement.
- **Compose for the final 4:1 crop, not the 21:9 canvas.** Content in the top/bottom 20% of the 21:9 source will be cropped off.
- **Avatar zone is `x=60-450, y=180-396`** on live LinkedIn, not the 568×264 the official docs imply. Put text starting at x>450 or in the top half.
- **No em or en dashes in any text** that appears in the image. Apply `/ro:write-copy` rules pre-generation.
- **No photos, no faces, no brand logos, no neon glow** unless explicitly asked.
- **Pure HTML/SVG fallback** only if Gemini cannot produce acceptable text even at 21:9 (rare). Full composition in Gemini is preferred — it produces atmospheric depth HTML cannot match.
- **Crop with PIL, not sips**, so top-biased crops are trivial when text sits low in the source.
- **No auto-commit.**

## Changelog

- **v0.3.0 (2026-04-24):** close-the-loop overhaul. Added compositing strategy (Step 7c) for the common case where Gemini places the headline at source y<80, giving no usable top padding via cropping alone — now builds a fresh 1584×396 navy canvas and pastes source with offset. Replaced the single "view the output" rule with an explicit four-check gate (top padding, bottom padding, avatar-zone, mobile safe-zone) that must pass before reporting. Learning came from shipping three covers that "looked fine" on a quick glance but all had text touching the top edge on live LinkedIn.
- **v0.2.0 (2026-04-24):** switched default from 1:1 + hybrid-overlay to native `21:9 + PIL crop`. Added live avatar zone observation (`x=60-450, y=180-396`, much larger than docs). Added mandatory view-before-report rule. Removed the `--size 1536x1024` code path that was wasting half the pixels on top/bottom strips.
- **v0.1.0 (2026-04-24):** initial skill with hybrid Gemini-bg + HTML-text-overlay approach.
