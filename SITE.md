# rflx.app

GitHub Pages serves the Reflex home page and the `/privacypolicy/` and `/terms/` URLs the app and its App Store listing link to. The previous shared Reflex/Perfect Loop Maker policy is preserved at `/legacy-privacy/` and the old terms at `/legacy-terms/`; other apps on this domain keep their own pages.

## Home page

One screen: the wordmark, "Every motion paints. Every motion plays.", the App Store badge and a footer. The home page is plain HTML (`index.html`, `layout: null`) with `assets/home.css`; the legal pages use the `reflex` and `reflex-legal` layouts with `assets/reflex.css`.

Behind the text, threads of light follow the visitor's pointer or finger (`assets/silk.mjs`, simulation in `assets/silk-field.mjs`). Movement paints its velocity into a coarse field that fades over about 1.25 s; a few thousand free threads ride it and are drawn as their last 16 positions, so they stretch into lines while the current flows and shrink to dust when it stops. A short scripted stroke plays on load and after 16 s without input. The page pauses while hidden, shows only the text with reduced motion, and drops threads on a device that cannot keep up. How this could become a mode of the app's Silk effect is described in `Docs/SilkStreams.md` in the Reflex repository.

- The badge is Apple's official "Download on the App Store" artwork (black, US-UK), saved from Apple's marketing toolbox as `assets/app-store-badge.svg`. Do not recolour or redraw it.
- `assets/app-store-qr.svg` encodes `https://apps.apple.com/app/id1456159174` and shows only on computers with a mouse. Regenerate it if the link changes.
- `apple-itunes-app` shows Safari's Smart App Banner on iPhone and iPad.
- The page names no price: Reflex is free to download with Reflex Pro purchases inside.

## Jar

`/jar/` is the TestFlight waitlist for Jar, a separate iPhone app: plain HTML (`jar/index.html`, `layout: null`) with `jar/jar.css` and `jar/jar.js`. Its three lines are the page of the app; tapping one drops its letters into a glass jar drawn on a canvas, and tapping the jar shakes a line back out.

- Signups go to a private Google Sheet through a Google Apps Script web app (`scripts/jar-waitlist.gs`, deployed as Execute as: Me, Who has access: Anyone). Its URL is `ENDPOINT` in `jar/jar.js`. The script only appends rows, skips repeats and a filled `website` honeypot, and has no `doGet`, so the sheet can't be read through it. Redeploying the script as a new deployment changes the URL.
- After a signup the address drops into the jar, and the browser remembers it in `localStorage` to show the confirmation again.

## Build and checks

Build with the repository's GitHub Pages/Jekyll toolchain (`bundle install`, `bundle exec jekyll build`), then:

- `python3 tests/test_site.py` checks the generated pages: the App Store link and banner, images, preserved URLs, internal links and page structure.
- `node --test tests/silk-field.test.mjs` checks the thread simulation: the painted current, threads stretching and settling, respawn, and hostile input.

Browser checks should cover desktop and phone layouts, a pointer or touch stroke, the QR code on desktop only, reduced motion, and the legal pages.
