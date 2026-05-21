# Vercel CLI — scope matching your dashboard

CLI scripts use **`syaifullahfittra-1444s-projects`** — the **slug from `npm run vercel:teams`** (Vercel’s default “username’s projects” team). Using just `syaifullahfittra-1444` caused **“scope does not exist”** for many accounts.

## One-time setup

1. **`cd`** into this repo folder (must contain **`package.json`**):

   ```bash
   cd "C:\Users\admin\logs os\tpac-os"
   ```

2. Log in as your Vercel user:

   ```bash
   npm run vercel:login
   ```

3. Confirm team slug (must match **`package.json`** scripts):

   ```bash
   npm run vercel:teams
   ```

4. Link this folder → project **`tpac-os`**:

   ```bash
   npm run vercel:link
   ```

## Deploy

```bash
npm run vercel:deploy
npm run vercel:deploy:preview   # preview URL
```

## Troubleshooting

| Issue | Fix |
|--------|-----|
| `ENOENT` / **`package.json` not found** | Run commands **inside** the repo directory (see **`cd`** above). |
| **`ENOTFOUND api.vercel.com`** | DNS/network: turn **VPN/proxy off** briefly, **`ipconfig /flushdns`**, set DNS to **`8.8.8.8`**, firewall allow **node.exe**/terminal, retry. Verify: `nslookup api.vercel.com` or open https://api.vercel.com in a browser. |
| **`The specified scope does not exist`** | Run **`npm run vercel:teams`** and paste the **exact** slug into **`package.json`** `vercel:*` scripts (then commit or keep locally). |
| **`Error: Not authorized`** | **`npm run vercel:login`**; clear tokens under **Vercel → Account → Tokens**. |
| Wrong org still receives deploys | Delete **`.vercel`** in this repo, **`npm run vercel:link`** again. |

`.vercel/` is gitignored; each clone must **`vercel:link`** once.
