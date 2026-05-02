# Thomas Taylor Research Partner

A browser app for searching and discussing the Thomas Taylor corpus. It runs locally for development and can be deployed as a private hosted research app with Supabase login, user-specific saved investigations, and a backend-only OpenAI key.

## Run it

```sh
export OPENAI_API_KEY="your_api_key_here"
npm start
```

Then open:

```text
http://localhost:3000
```

The local app indexes every `.doc` file in this directory. Local search works without an API key; the conversational research partner and external web enrichment use the OpenAI API.

You can also paste an OpenAI API key into the sidebar after the app opens. That key is kept in this browser's local storage and sent only to the local app server for AI requests.

Saved investigations are stored in `.taylor-cache/sessions/`. The app also appends a human-readable usage and improvement log at `.taylor-cache/usage-log.md`.

The main `Investigate` button searches the selected corpus scope, retrieves source passages, and asks the AI layer for a complete source-grounded synthesis. If the model response reports that it ran out of output, the server retries once with a larger output budget and lighter reasoning effort.

## Original-language pilot

The first Greek-source pilot covers selected passages in `17IAMBL.doc`, Taylor's Iamblichus, *On the Mysteries*. Normal investigations stay focused on Taylor's corpus. Greek appears only as an on-demand lookup layer.

Highlight Taylor wording in an answer, a source-card excerpt, or the passage reader, then choose "Show original" to see the best phrase-level estimate of the underlying Greek or Latin. The lookup first checks curated phrase mappings. If no mapping exists and an OpenAI API key is active, it asks the AI layer for a best-effort estimate from the selected wording and surrounding Taylor passage. Turn on "External sources" before lookup when you want that fallback to search online source editions.

This pilot currently contains six curated alignment zones and thirty-five phrase lookups from Iamblichus' *De Mysteriis* using the OpenGreekAndLatin/Scaife Greek edition. It is intentionally narrow, so the app labels it as a pilot rather than implying that the whole Taylor corpus has been aligned.

## Useful settings

```sh
OPENAI_MODEL=gpt-5.5
OPENAI_REASONING_EFFORT=medium
OPENAI_MAX_OUTPUT_TOKENS=12000
PORT=3000
TAYLOR_CORPUS_DIR=/path/to/Taylor
```

Use `npm run index` to rebuild the corpus cache manually.

## Hosted Private Beta

The hosted version uses:

- Render for the Node web service.
- Supabase Auth for invited-user login.
- Supabase Postgres for saved investigations and usage logs.
- `data/corpus-index.json` as the deployable corpus artifact.
- A backend-only `OPENAI_API_KEY`.

Before deploying, run:

```sh
npm run export:corpus
```

Apply the Supabase schema in `supabase/schema.sql`, then configure Supabase Auth:

- Email magic links enabled.
- Invited users created in Supabase Auth.
- Site URL set to the Render URL.
- Redirect URL set to the Render URL.

Private access flow:

- Users sign in at `/signin` with an already-approved email address.
- Optional access requests are available at the unlinked `/request-access` page.
- Access requests are stored in `public.taylor_access_requests`; review them in Supabase.
- To approve someone, create or invite that email address in Supabase Auth, then mark the request `approved` if you want the table to reflect your decision.

Render environment variables:

```sh
USE_BUNDLED_CORPUS=true
AUTH_REQUIRED=true
LOCAL_FILE_ACCESS=false
ALLOW_CLIENT_API_KEYS=false
ACCESS_REQUESTS_ENABLED=true
APP_URL=https://your-render-app.onrender.com
OPENAI_API_KEY=...
SUPABASE_URL=...
SUPABASE_ANON_KEY=... # public anon JWT or sb_publishable_... key only
SUPABASE_SERVICE_ROLE_KEY=...
```

Never put an `sb_secret_...` key in `SUPABASE_ANON_KEY`; that value is sent to the browser for Supabase Auth. If an `sb_secret_...` key is ever exposed, rotate it in Supabase and update Render.

The `render.yaml` file contains the baseline Render service configuration.
