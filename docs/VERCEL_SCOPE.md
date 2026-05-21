# Vercel CLI — scope `syaifullahfittra-1444`

This repo pins CLI commands to **your Vercel username/slug** `syaifullahfittra-1444` so deploys don’t hit another team’s project.

## One-time setup

1. Install CLI if needed (global): `npm i -g vercel`, or rely on `npx vercel`.

2. Log in as **that** account:

   ```bash
   npm run vercel:login
   ```

3. Confirm:

   ```bash
   npm run vercel:whoami
   ```

   You should see **syaifullahfittra-1444** (or your linked identity).

4. Link this folder to a project **under that scope** (creates `tpac-os` if missing):

   ```bash
   npm run vercel:link
   ```

   This writes `.vercel/project.json` locally (ignored by git).

## Deploy

- **Production**

  ```bash
  npm run vercel:deploy
  ```

- **Preview**

  ```bash
  npm run vercel:deploy:preview
  ```

## Troubleshooting

| Issue | Fix |
|--------|-----|
| `The specified scope does not exist` | Run **`npm run vercel:login`** first while signed into Vercel as that user. Then **`npm run vercel:teams`** and confirm the slug matches **`syaifullahfittra-1444`** (copy from dashboard URL if unsure). |
| `Error: Not authorized` | Run **`npm run vercel:login`** again; revoke stale tokens at **Vercel → Account Settings → Tokens**. |
| Wrong team still receives deploys | Delete `.vercel` locally and run `npm run vercel:link` again after login. |
| Scope slug differs | Replace `syaifullahfittra-1444` in `package.json` scripts with your exact slug from **Vercel dashboard URL** or `vercel teams ls`. |
