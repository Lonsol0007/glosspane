# Glosspane

A comic reader for files you already have, with in-place page translation.

```bash
npm install
npm run dev            # http://localhost:3000
npx vitest run         # unit tests
npm run build && npx playwright test   # end-to-end tests against the production build
```

Everything is stored in the browser (IndexedDB). Translation uses the reader's own
Anthropic API key, entered under Settings; see `.env.example` before setting a server key.

Planning documents, test plan and launch material live in `../replica/`.
