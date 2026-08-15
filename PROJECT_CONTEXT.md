# Wartop Project Context

Updated: 2026-08-15

## Product

Wartop is a React/Vite storefront for game top-up, digital vouchers, entertainment subscriptions, AI tools, e-wallet products, and an internal customer wallet.

The public interface uses Wartop's blue–cyan identity:

- deep navy base surfaces;
- electric blue, cyan, and aqua highlights;
- Wartop wordmark in the header, hero, and footer;
- Wartop mark for favicon, compact avatars, chat, and admin login;
- responsive layouts for desktop and mobile.

## Main architecture

- `src/App.jsx`: client routing, auth state, account protection, and product state.
- `src/components/`: storefront header, Wartop hero, product navigation, flash sale, login, SEO, footer, and chat.
- `src/views/`: home, order, invoice, wallet, transactions, legal/blog pages, and admin screens.
- `src/lib/`: cloud state, storage, chat, wallet, user activity, and Supabase integration.
- `api/`: Vercel serverless endpoints for admin auth, AI chat, state synchronization, and traffic.
- `supabase/wartop_app_state.sql`: state table schema for a fresh Wartop deployment.

## Brand assets

- `src/assets/wartop-mark.png`: compact Wartop mark bundled by Vite.
- `src/assets/wartop-wordmark.png`: full Wartop wordmark bundled by Vite.
- `public/wartop-mark.png`: public fallback mark.
- `public/wartop-wordmark.png`: public fallback wordmark.
- `public/favicon.png`: browser icon.
- `public/logo.png`: social and structured-data image.

## Runtime notes

- Local development remains usable without Supabase environment variables through the safe auth fallback.
- A deployed environment should configure `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and the server-side service-role variables.
- A deployment migrating from a previous state table must rename or copy that table to `wartop_app_state` before the new API is published.
- Public SEO metadata currently uses `https://wartop.shop`; update `index.html`, `src/components/SeoManager.jsx`, `public/robots.txt`, and `public/sitemap.xml` if the production domain differs.

## Validation

Before deployment, run:

```bash
npm run lint
npm run build
```

Then verify the home, order, invoice, wallet, transactions, login, chat, and admin views at desktop and mobile widths.
