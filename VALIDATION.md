# Validation — 2026-10-06

Nine fixture tests passed under Node.js 26.7.0. Six failed against the original 0.1.4 code before the repairs. Covered API error handling, search encoding, empty latest feeds, malformed and multi-page pagination, rating preferences, and page server responses.

Live checks executed the replacement provider with a curl-backed Client adapter against public MangaDex endpoints:

- Popular listing: 20 titles.
- First sampled title: zero English chapters returned by the API.
- Second sampled title: 216 chapters.
- Sample chapter: one image URL, fetched with HTTP 200.

The adapter validates request/response logic but not Mangayomi's embedded runtime or the user's network. Mangayomi in-app verification remains outstanding. A concrete cause for the user's device-specific failure has not been established.
