# kiwii.luuhoanghiep.com

The Kiwii landing page. Plain HTML, CSS and JS — what is in this directory is
byte for byte what gets served.

## Deployment

Cloudflare Pages, connected to this repository. Every push to `main` redeploys.

| Setting          | Value     |
| ---------------- | --------- |
| Framework preset | None      |
| Build command    | _(empty)_ |
| Output directory | `site`    |
| Branch           | `main`    |

There is no build step, so nothing needs installing and the deploy is a file
upload. The custom domain is attached in the Pages project, and because
`luuhoanghiep.com` is already on Cloudflare the DNS record is created there
rather than by hand.

Set **Build watch paths** to `site/*` in the project settings if you would
rather not redeploy on every unrelated commit.

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
