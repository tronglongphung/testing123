// Independent source for comick.live, based on its public page data.
const mangayomiSources = [{
    name: "Comick Live", lang: "en", id: 1910342401,
    baseUrl: "https://comick.live", apiUrl: "https://comick.live/api",
    iconUrl: "https://comick.live/favicon.ico", typeSource: "single",
    itemType: 0, version: "0.1.0", pkgPath: "comick.js"
}];

class DefaultExtension extends MProvider {
    constructor() {
        super();
        this.client = new Client();
        this.searchCursors = {};
    }
    getHeaders() {
        return {"Accept": "application/json, text/html", "Referer": "https://comick.live/"};
    }
    async request(path) {
        const response = await this.client.get(`https://comick.live${path}`, this.getHeaders());
        const status = Number(response.statusCode || response.status || 0);
        const body = response.body || "";
        if (status === 403 || /cf-chl-|Just a moment\.\.\./i.test(body)) {
            throw new Error("Comick Cloudflare challenge (403). Open comick.live in Mangayomi's WebView and complete any challenge manually, then retry. Access may remain blocked.");
        }
        if (status >= 400) throw new Error(`Comick HTTP ${status}. Please retry later.`);
        return body;
    }
    parseJson(body) {
        let data;
        try { data = JSON.parse(body); }
        catch (_) { throw new Error("Comick returned HTML instead of JSON; the API may be blocked or changed."); }
        if (!data || data.errors || data.error) throw new Error("Comick API returned an error.");
        return data;
    }
    embedded(body, id) {
        // Read data only: never execute page scripts.
        const scripts = body.match(/<script\b[^>]*>[\s\S]*?<\/script>/gi) || [];
        for (const script of scripts) {
            const opening = script.slice(0, script.indexOf(">") + 1);
            if (opening.indexOf(`id="${id}"`) < 0 && opening.indexOf(`id='${id}'`) < 0) continue;
            return this.parseJson(script.slice(script.indexOf(">") + 1, script.lastIndexOf("</")));
        }
        throw new Error(`Comick embedded ${id} data is missing; the page may have changed.`);
    }
    comicPath(url) {
        const path = String(url).replace(/^https:\/\/comick\.live/, "");
        if (!/^\/comic\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_.-]+)?\/?$/.test(path)) {
            throw new Error("Use a Comick URL beginning https://comick.live/comic/ with a valid title slug.");
        }
        return path.replace(/\/$/, "");
    }
    cover(comic) {
        const value = comic.default_thumbnail || comic.full_image_path || comic.cover_url || "";
        return /^https:\/\//.test(value) ? value : "";
    }
    entry(comic) {
        if (!comic || !comic.slug || !comic.title) throw new Error("Comick returned invalid title data.");
        return {name: comic.title, link: `/comic/${comic.slug}`, imageUrl: this.cover(comic)};
    }
    async homepage(section) {
        const data = this.embedded(await this.request("/home"), "sv-data").data;
        if (!data || !Array.isArray(data[section])) throw new Error("Comick homepage catalogue changed.");
        const covers = {};
        Object.keys(data).forEach(key => {
            if (Array.isArray(data[key])) data[key].forEach(c => { if (c.slug && this.cover(c)) covers[c.slug] = this.cover(c); });
        });
        const seen = {};
        const list = data[section].filter(c => c.slug && c.title && !seen[c.slug] && (seen[c.slug] = true)).map(c => {
            const item = this.entry(c);
            if (!item.imageUrl) item.imageUrl = covers[c.slug] || "";
            return item;
        });
        return {list, hasNextPage: false};
    }
    async getPopular(page) {
        return page > 1 ? {list: [], hasNextPage: false} : this.homepage("rank");
    }
    async getLatestUpdates(page) {
        return page > 1 ? {list: [], hasNextPage: false} : this.homepage("news");
    }
    async search(query, page, filters) {
        query = String(query).trim();
        if (/^https:\/\/comick\.live\/comic\//.test(query) || /^\/comic\//.test(query)) {
            if (page > 1) return {list: [], hasNextPage: false};
            const path = this.comicPath(query).split("/").slice(0, 3).join("/");
            const comic = this.embedded(await this.request(path), "comic-data");
            return {list: [this.entry(comic)], hasNextPage: false};
        }
        const key = `${query}:${page}`;
        const cursor = page > 1 ? this.searchCursors[key] : null;
        if (page > 1 && !cursor) throw new Error("Comick search cursor expired. Start the search again.");
        const url = `/api/search?type=comic&q=${encodeURIComponent(query)}&order_by=follow_count&order_direction=desc${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;
        const result = this.parseJson(await this.request(url));
        if (!Array.isArray(result.data)) throw new Error("Comick search response changed.");
        const next = result.next_cursor || result.nextCursor || null;
        if (next) this.searchCursors[`${query}:${page + 1}`] = next;
        return {list: result.data.map(c => this.entry(c)), hasNextPage: !!next};
    }
    async getDetail(url) {
        const path = this.comicPath(url).split("/").slice(0, 3).join("/");
        const comic = this.embedded(await this.request(path), "comic-data");
        const chapters = [];
        const seen = {};
        for (let page = 1; ; page++) {
            const result = this.parseJson(await this.request(`/api/comics/${encodeURIComponent(comic.slug)}/chapter-list?lang=en&chapOrder=desc&page=${page}`));
            const pagination = result.pagination;
            if (!Array.isArray(result.data) || !pagination || !Number.isInteger(pagination.last_page) || pagination.last_page < 1 || (pagination.current_page != null && pagination.current_page !== page)) {
                throw new Error("Comick chapter pagination changed.");
            }
            for (const chapter of result.data) {
                if (chapter.lang !== "en" || !chapter.hid || seen[chapter.hid]) continue;
                seen[chapter.hid] = true;
                chapters.push({
                    name: `${chapter.vol ? `Vol. ${chapter.vol} ` : ""}Ch. ${chapter.chap == null ? "Oneshot" : chapter.chap}${chapter.title ? ` - ${chapter.title}` : ""}`,
                    url: `/comic/${comic.slug}/${chapter.hid}-chapter-${chapter.chap == null ? "null" : chapter.chap}-en`,
                    scanlator: Array.isArray(chapter.group_name) ? chapter.group_name.join(", ") : (chapter.group_name || ""),
                    dateUpload: String(Date.parse(chapter.publish_at || chapter.created_at) || 0)
                });
            }
            if (page >= pagination.last_page) break;
            if (!result.data.length || page >= 500) throw new Error("Comick chapter pagination stopped making progress.");
        }
        const names = rows => (rows || []).map(x => x.name || x.title || "").filter(Boolean).join(", ");
        return {
            name: comic.title, imageUrl: this.cover(comic), description: comic.desc || "",
            author: names(comic.authors),
            genre: (comic.md_comic_md_genres || []).map(x => (x.md_genres || x).name).filter(Boolean),
            status: {1: 0, 2: 1, 3: 3, 4: 2}[comic.status] == null ? 0 : {1: 0, 2: 1, 3: 3, 4: 2}[comic.status],
            chapters
        };
    }
    async getPageList(url) {
        const data = this.embedded(await this.request(this.comicPath(url)), "sv-data");
        const chapter = data.chapter;
        if (!chapter || chapter.lang !== "en" || !Array.isArray(chapter.images)) throw new Error("Comick English reader data is unavailable.");
        const pages = chapter.images.map(i => i.url).filter(u => typeof u === "string" && /^https:\/\//.test(u));
        if (!pages.length) throw new Error("Comick has no public images for this chapter; it may be external or removed.");
        return pages;
    }
    getFilterList() { return []; }
    getSourcePreferences() { return []; }
}
