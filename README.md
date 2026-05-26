# Instructor DB

A React + Vite app connected to Supabase for managing instructor data.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the dev server:
   ```bash
   npm run dev
   ```

3. Open http://localhost:5173 in your browser.

## Build for production

```bash
npm run build
```

The `dist/` folder can be deployed to Vercel, Netlify, or any static host.

## Deploy to Vercel (free)

1. Push this folder to a GitHub repo
2. Go to vercel.com → New Project → import your repo
3. Click Deploy — done!

## Project structure

```
src/
  lib/
    supabase.js     ← Supabase client
    fields.js       ← Column definitions
  components/
    Dashboard.jsx   ← Stats + CM cards
    InstructorsTable.jsx ← Filtered table with pagination
    InstructorModal.jsx  ← Add / Edit form
    ImportTab.jsx   ← Paste CSV import
    Toast.jsx       ← Notification system
  App.jsx           ← Root component + tab layout
  index.css         ← All styles
  main.jsx          ← Entry point
```
