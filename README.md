# MangaDex Repair for Mangayomi

An independent repair fork of the m2k3a MangaDex JavaScript extension. Includes 45 languages. Requires Mangayomi with JavaScript extension support (metadata minimum 0.5.0). Actual compatibility must be checked in your installed app.

## Publish to your GitHub

1. Create a public GitHub repository, named `testing123`.
2. Before uploading, open a terminal in this folder and run:

   ```sh
   node scripts/configure.cjs tronglongphung testing123
   npm test
   ```

   For a different repository or branch, substitute its name and pass the branch as the third argument.
3. Upload this folder's contents to the repository root on the selected branch. Include `mangadex.js`, `index.json`, `LICENSE`, and `NOTICE`.
4. Add the printed raw `index.json` URL to Mangayomi's Manga repository field. Refresh Extensions and install **MangaDex Repair** in your language.
5. Open Sources → MangaDex Repair. Test browsing, a manga detail page, and chapter pages.

The bundled `index.json` is configured for `tronglongphung/testing123` on branch `main`. After publishing, import:

```text
https://raw.githubusercontent.com/tronglongphung/testing123/main/index.json
```

This URL will only work once these files are uploaded. No new GitHub repository has been created by this package.

The repair uses distinct source IDs so the original and repair can coexist. Existing library entries do not automatically move: test the repair first, then use your app's migration feature if available, or add titles again.

## Fixes

- API errors (including rate limits) are surfaced instead of silently turning into zero chapters.
- Non-JSON block pages and missing chapter server data show readable errors.
- Pagination validates progress and fails clearly at the API's 10,000-item boundary.
- Search encodes reserved characters.
- Empty latest feeds do not trigger a second request with `limit=0`.
- Browse and chapter lists use a content rating preference, defaulting to safe and suggestive. Adult ratings require explicit selection; metadata marks the extension NSFW because it supports them.
- Covers tolerate missing relationships and respect the quality preference.

## Validation and limits

Run `npm test` with Node.js 18 or newer. Tests execute extension code with mocked Mangayomi host objects and API fixtures. They do not prove the app's embedded JavaScript runtime or your network works. Live API checks are documented in `VALIDATION.md`.

This extension cannot restore chapters removed from MangaDex, bypass network blocks, or read external publisher-only chapters. The original user's precise failure was not reproduced inside Mangayomi, so these are verified code repairs rather than a guaranteed fix for that device.

## Sources and license

- Upstream code: https://github.com/m2k3a/mangayomi-extensions/blob/main/javascript/manga/src/all/mangadex.js
- Mangayomi extension guide: https://github.com/Swakshan/mangayomi-swak-extensions/blob/main/CONTRIBUTING-JS.md
- MangaDex API: https://api.mangadex.org

Apache-2.0. See `LICENSE` and `NOTICE`.
