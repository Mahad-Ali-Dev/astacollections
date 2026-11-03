# Google Search Console: owner checklist

Do these once the `claude/seo-ui` changes are live on astacollections.com.

## 1. Verify the domain (once, about 10 minutes)

1. Go to https://search.google.com/search-console → **Add property** → **Domain** → enter `astacollections.com`.
2. Google shows a `TXT` record. Add it at your domain's DNS host (wherever the nameservers point; if DNS is on Vercel, use Vercel → Domains → astacollections.com → DNS Records → Add → Type `TXT`, Name `@`).
3. Click **Verify**. DNS can take up to an hour.

A Domain property covers both `astacollections.com` and `www.`, http and https.

## 2. Fix www first (Vercel)

`https://www.astacollections.com` currently shows a certificate error. In Vercel go to Project → Settings → **Domains** → Add `www.astacollections.com` → choose **Redirect to astacollections.com** with **308 Permanent**.

## 3. Submit the sitemap

Search Console → **Sitemaps** → enter `sitemap.xml` → Submit. Expect about 170 URLs (home, shop, FAQ, shipping, about, contact, 14 collections, about 158 products).

## 4. Request indexing for the key pages

Search Console → **URL inspection** → paste each URL → **Request indexing** (about 10 a day is fine):

1. https://astacollections.com/
2. https://astacollections.com/products
3. https://astacollections.com/category/rings
4. https://astacollections.com/category/couple-rings
5. https://astacollections.com/category/pendant
6. https://astacollections.com/category/zircon-rings
7. https://astacollections.com/category/hand-cuff
8. https://astacollections.com/category/studs
9. https://astacollections.com/category/bracelets
10. https://astacollections.com/faq

Run **Test live URL** on one product page and check that **"User-declared canonical"** is the product's own URL. Before this change it was the home page.

## 5. Clean up

- **Pages** report: over the next 2–4 weeks expect "Duplicate, Google chose different canonical" to fall and "Indexed" to rise. Cart, checkout, login and account will move to "Excluded by noindex", which is correct.
- **Removals** → New request → "Remove all URLs with this prefix" for anything odd you see indexed, such as `https://astacollections.com/checkout` or `/cart`. This is optional; noindex removes them anyway, just more slowly.
- **Enhancements** → Product snippets / Merchant listings: check for errors after Google recrawls.

## 6. Bing (5 minutes, worth it)

https://www.bing.com/webmasters → **Import from Google Search Console**. Bing's index feeds ChatGPT search and Copilot.

## 7. Track weekly

Performance → Search results → Queries, then filter out queries containing "asta" to see non-brand growth. The target phrases for each page are in `docs/seo/SEO-PLAN.md` §3.
