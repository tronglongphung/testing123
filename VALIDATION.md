# Live validation — 2026-10-06

Executed the source with a curl-backed Mangayomi Client adapter.

- Public homepage: 50 popular titles parsed.
- Test title: The Beginning After the End.
- English chapter list: 249 chapters across five API pages.
- Reader page: one ordered image URL parsed.
- Fetching that image: HTTP 403. With browser User-Agent and Referer: HTTP 429. No repeated attempts after rate-limit response.
- Search API: HTTP 403 Cloudflare challenge.

Ten fixture tests pass. Mangayomi installation and image rendering have not been verified. This is a working catalogue/chapter parser and a candidate reader integration; it is not a verified end-to-end source for this network. The JSON catalogue cannot remove upstream Cloudflare or CDN restrictions.
