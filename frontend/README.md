# Frontend — Next.js App

This folder is a placeholder. To scaffold the actual Next.js project here, run from inside `/frontend`:

```bash
npx create-next-app@latest . --typescript --tailwind --app
```

(Accept the defaults, or adjust flags per your team's preference — TypeScript + Tailwind pairs well with the design doc's warm/editorial visual direction in `/docs/design_doc.md`.)

Then start the local dev server with:

```bash
npm run dev
```

This runs the frontend at `http://localhost:3000`, which will call the backend (running separately via `uvicorn`) at `http://localhost:8000`.

See `/docs/tech_stack.md` for the full stack rationale and `/docs/design_doc.md` for visual direction (colors, typography, key screens).
