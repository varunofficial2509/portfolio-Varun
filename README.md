# Varun Teja — Portfolio (Static)

A dark, terminal-styled developer portfolio. Fully static: plain HTML, CSS,
and vanilla JavaScript — no build step, no framework, no backend, no Python.

## Structure

```
portfolio/
├── index.html          Page markup + content (hero, skills, experience, projects)
├── css/
│   └── styles.css       Theme: dark background, purple accent, monospace headings
├── js/
│   ├── config.js          The one place CHATBOT_URL lives
│   └── main.js             Hero node-graph animation + "Ask My AI" link wiring
├── assets/
│   ├── images/            avatar.webp
│   └── icons/              favicon.svg
└── README.md
```

## Running locally

No build step — any static file server works. From this directory:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

(Opening `index.html` directly by double-clicking also works, since nothing
here fetches external data at runtime.)

## Editing content

Content (name, tagline, skills, experience, projects) is written directly
into `index.html` — there's no JSON data file or build step. To update it,
edit the relevant section of `index.html` directly:

- Hero: `.vt-hero-name`, `.vt-hero-title`, `.vt-hero-tagline`, `.vt-hero-summary`
- Skills: the `.vt-skill-card` blocks inside `<section>` under `#skills`
- Experience: the `.vt-exp` block under `#experience`
- Projects: the `.vt-project` blocks under `#projects`

## Connecting the AI chatbot

The AI assistant is a separate project (Streamlit + LangGraph + RAG, see
`../chatbot/`) with its own deployment — this portfolio never embeds it or
calls its backend. The "Ask My AI →" button just links out to it, opening
in a new tab.

The chatbot's URL lives in exactly one place: `CHATBOT_URL` in
`js/config.js`. Set it once the chatbot has a deployed URL:

```js
const CHATBOT_URL = "https://your-chatbot.streamlit.app";
```

Until it's set, the button stays visible (so the layout never shifts) but
does nothing when clicked, rather than jumping the page to `#`.

## Deploying to GitHub Pages

Nothing to build or install — GitHub Pages serves this folder's files
exactly as they are. Every local reference in `index.html`/`css/styles.css`
is a **relative path** (`css/styles.css`, `js/main.js`, `assets/...`, no
leading `/`), so the site works unmodified both at a domain root (a
`username.github.io` user site) and under a project subpath
(`username.github.io/repo-name/`) — GitHub Pages commonly serves project
sites from a subpath, and relative paths are what make that work.

**Option A — this folder as its own repository:**

1. Push the contents of `portfolio/` to a new GitHub repo (this folder
   becomes the repo root).
2. Repo **Settings → Pages → Source**: **Deploy from a branch** →
   branch `main`, folder `/ (root)`.
3. Save. GitHub publishes it at `https://<username>.github.io/<repo-name>/`
   within a minute or two.

**Option B — keeping it inside this monorepo:**

GitHub Pages can only publish from a repo root or a `/docs` folder on a
branch, not an arbitrary subfolder like `portfolio/`. Either:
- Push just this folder's contents to a separate repo (Option A), or
- Add a small GitHub Actions workflow that publishes the `portfolio/`
  subfolder to Pages on every push — ask if you want that set up.

### Post-deploy checklist

After it's live, a quick pass confirms everything travelled correctly:

- [ ] Page loads at the published URL, dark theme renders (no flash of
      unstyled/default content)
- [ ] Nav links (`/home`, `/skills`, `/experience`, `/projects`) scroll to
      the right section
- [ ] Avatar image and favicon show up
- [ ] Hero node-graph is drawing and reacts to the cursor
- [ ] "Ask My AI →" opens the chatbot in a new tab (once `CHATBOT_URL` in
      `js/config.js` is set)
- [ ] Browser devtools console has no errors, and the Network tab shows no
      404s for `css/styles.css`, `js/config.js`, `js/main.js`, or the
      avatar/favicon
