# kiwii.luuhoanghiep.com

The Kiwii landing page. Plain HTML, CSS and JS — what is in this directory is
byte for byte what gets served.

## Deployment

A Cloudflare Worker serving static assets, configured in `wrangler.jsonc` at the
repo root. There is no `main`, so no script runs: every request is answered from
this directory. Same shape as the account's other static sites.

```sh
bunx wrangler@latest deploy    # from the repo root
```

Connecting the repository to [Workers
Builds](https://developers.cloudflare.com/workers/ci-cd/) deploys it on every
push to `main` instead; set the build command to nothing and leave the root
directory at the repo root, since `wrangler.jsonc` already points at `site`.

`.assetsignore` keeps this README out of the upload — everything else in here is
public.

The custom domain is attached to the Worker. `luuhoanghiep.com` is already on
Cloudflare, so the DNS record comes with it rather than being added by hand.

## Working on it locally

```sh
cd site && python3 -m http.server 8777
```

Then open <http://localhost:8777>. There is nothing to compile or watch.

## Notes

- Both languages ship in the markup as sibling `<i lang="vi">` / `<i lang="en">`
  elements and CSS shows one of them. Never swap text with JavaScript: the first
  version did, and it destroyed the inline `<code>` and `<kbd>` markup the moment
  anyone hit the toggle.
- The five permission-mode colours mirror `PERMISSION_COLORS` in
  `packages/tui/src/theme/index.ts`. Change them there and here together.
