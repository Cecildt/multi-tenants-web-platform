---
name: tenants-docs-publish
description: Build a tabbed HTML page from design-docs/*.md (Architecture, Tech Stack, Deployment, Processes), inline mermaid as SVG, and publish it as a private Claude Artifact. Use when asked to publish or refresh the design docs page.
allowed-tools: Bash, Read, Write, Edit, Artifact
---

# Guardrails
- Never make assumptions. Ask a clarification question only if an entry file or a file it links is missing (`build.mjs` exits with code 2), or a mermaid diagram still fails to render after the browser install below.
- Use the working tree as the source (including uncommitted changes).
- Put all temporary files in the scratchpad directory, never in the repo.
- Do not commit, push or share. Artifacts start private; give the link only.
- Do not edit the source `.md` files. Report problems found in them instead.
- Do not read the source docs or the generated HTML into context. The scripts do the work; rely on the script output and grep counts.

# Bundled files (in `assets/`, next to this file)
- `build.mjs`: discovers docs, renders mermaid to SVG, converts markdown with `marked`, rewrites links, assembles the page, writes `design-docs/html/multi-tenants-designs.html`.
- `style.css`, `app.js`: the page design (themed tokens, tabs, hash routing). The design is already settled and `artifact-design` compliant, so do not reload `artifact-design` or redesign. Edit these files only if the user asks for a design change.
- `check.mjs`: headless browser check of tabs and every deep link.

Page structure the scripts produce:

| Tab | Hash | Entry file |
|---|---|---|
| Architecture | `#architecture` | `design-docs/architecture.md` |
| Tech Stack | `#tech-stack` | `design-docs/tech-stack.md` |
| Deployment | `#deployment` | `design-docs/deployment.md` |
| Processes | `#processes` | `design-docs/process-designs/index.md` |

Every local `.md` linked from an entry file is inlined as a sub-section with id `<tab>-<file-stem>` (for example `#processes-account-lock`), and links to it become hash anchors. Other markdown files are ignored. To add a tab, add a row to `TABS` in `build.mjs`.

# Steps
Set `R` to the repo root and `W` to a directory inside the scratchpad.

1. **Install tooling** (scratchpad only):
   `mkdir -p $W && cd $W && npm init -y && npm i marked@12 playwright-core`
   Use `marked` as a library. The `npx marked` CLI does not add heading ids.
2. **Ensure a headless browser exists.** If `~/.cache/puppeteer/chrome-headless-shell` is missing, run `npx -y puppeteer browsers install chrome-headless-shell` (about 100MB, outside the repo). Mermaid rendering fails without it, and the error looks like a sandbox problem but is not. `build.mjs` already passes `--no-sandbox`.
3. **Build:** `node $R/.claude/skills/tenants-docs-publish/assets/build.mjs $R $W`
   It prints JSON with `expectedSvgs`, `inlinedSvgs`, `emptyFences` and the doc ids.
4. **Verify** (see below).
5. **Publish** with the Artifact tool, `file_path` = the generated HTML. Pass `icon: "blueprint"` and a one-sentence `description` on the first publish only.
   - If `design-docs/html/.artifact-url` is missing, publish a new artifact and write its URL to that file.
   - Otherwise read that artifact once with `action: "read"`, then publish with `url` set to the stored value, and no `icon`.
   - Do not preview or re-screenshot. The browser check in step 4 is the one look.
6. **Clean up:** delete `$W` (it holds `.mmd`, `.svg`, `node_modules`, config). Confirm with `git status --short` that only `design-docs/html/` changed.
7. **Report:** the artifact link, the checks that passed, and any source issues found (below).

# Verifications
Run these in one Bash call:
- `expectedSvgs` equals `inlinedSvgs`, and equals `grep -o '<svg' <html> | wc -l`. Empty mermaid fences are not counted. They render as a "Diagram not yet defined" placeholder, so `emptyFences` does not need a match.
- Zero ` ```mermaid ` text and zero `href="...md"` in the HTML (`grep -c`).
- `build.mjs` printed no `UNMAPPED LINK`, and each linked doc id appears once as `id="..."`.
- `node assets/check.mjs $R $W`: every panel and sub-section deep link shows a non-empty panel, the tab click works, there is no horizontal scroll and no page errors. If Chromium cannot run, check the structure with grep and say the browser check was skipped.

# Known source issues to report (never fix silently)
- Empty `.md` files render as an "empty document" note.
- Empty mermaid fences render as a placeholder.
- A table row with more cells than its header drops the extra cell. Name the file and row (previously the "GraphQL library" row in `tech-stack.md`).

# Notes
- Mermaid SVGs sit on a light panel so they stay readable in dark theme.
- Tech stack status cells ("In use", "Planned", "To decide: ...") become pills automatically.
- Page contract reminders (already handled in the assets): `<title>` first with no doctype or html/body tags, fonts only from Google Fonts, no external scripts, hash names with letters, digits and hyphens only, tokens defined on bare `:root`.
