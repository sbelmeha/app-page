# rflx.app

GitHub Pages serves the Reflex home page and the `/privacypolicy/` and `/terms/` URLs the app and its App Store listing link to. The previous shared Reflex/Perfect Loop Maker policy is preserved at `/legacy-privacy/` and the old terms at `/legacy-terms/`; other apps on this domain keep their own pages: Resonance R-1's wishlist under `/r1/`, Jar's legal pages under `/jar/`.

## Home page

One screen: the wordmark, "Every motion paints. Every motion plays.", the App Store badge and a footer. The home page is plain HTML (`index.html`, `layout: null`) with `assets/home.css`; the legal pages use the `reflex` and `reflex-legal` layouts with `assets/reflex.css`.

Behind the text, threads of light follow the visitor's pointer or finger (`assets/silk.mjs`, simulation in `assets/silk-field.mjs`). Movement paints its velocity into a coarse field that fades over about 1.25 s; a few thousand free threads ride it and are drawn as their last 16 positions, so they stretch into lines while the current flows and shrink to dust when it stops. A short scripted stroke plays on load and after 16 s without input. The page pauses while hidden, shows only the text with reduced motion, and drops threads on a device that cannot keep up. How this could become a mode of the app's Silk effect is described in `Docs/SilkStreams.md` in the Reflex repository.

- The badge is Apple's official "Download on the App Store" artwork (black, US-UK), saved from Apple's marketing toolbox as `assets/app-store-badge.svg`. Do not recolour or redraw it.
- `assets/app-store-qr.svg` encodes `https://apps.apple.com/app/id1456159174` and shows only on computers with a mouse. Regenerate it if the link changes.
- `apple-itunes-app` shows Safari's Smart App Banner on iPhone and iPad.
- The page names no price: Reflex is free to download with Reflex Pro purchases inside.

## Resonance R-1

`/r1/` is the wishlist for Resonance R-1, an iPhone instrument. It took over from Jar's TestFlight waitlist, and `/jar/` now only redirects to it (`jar/index.html`, a meta refresh, as GitHub Pages has no server redirects). Plain HTML (`r1/index.html`, `layout: null`) with `r1/r1.css` and `r1/r1.js`, black, one column: a render of the R-1 lying face down in the dark with its glow spilling out from under it (`r1/r1-lights-out.jpg`, made by `Design/R1/site/teaser_r1.py` in the ResonanceR1 repository), the line "Something to fall asleep to.", and the email field. The page must never show the R-1's face: any new image comes from that script and is checked for the face, controls, card slot and wordmark first.

- The glow breathes (a slow brightness cycle on the image), and stands still with reduced motion.
- Signups go to the private Google Sheet below, tagged `app: "r1"`. The browser remembers the address in `localStorage` to show the confirmation again.
- The page names no policy page: a line under the form says what the address is used for and how to be taken off the list.

## Jar

Jar, a separate iPhone app, no longer has a page of its own; its Privacy Policy and Terms of Use, which the app and its App Store listing link to, stay at `/jar/privacy/` and `/jar/terms/` (`_pages/jar_privacy.md`, `_pages/jar_terms.md`, layout `jar-legal` with `jar/legal.css`, and Jar's icon `jar/icon-180.png`). Keep the policy in step with the app's `PrivacyInfo.xcprivacy` and its Firebase events, and update it when gifts or Google Fonts change what leaves a device.

## Waitlist sheet

Signups from `/r1/` (and before it Jar's `/jar/`) go to a private Google Sheet through a Google Apps Script web app (`scripts/jar-waitlist.gs`, deployed as Execute as: Me, Who has access: Anyone). Its URL is `ENDPOINT` in `r1/r1.js`. The script only appends rows (email, date, app), skips an address already on the list for the same app and a filled `website` honeypot, and has no `doGet`, so the sheet can't be read through it. Update it under Deploy > Manage deployments > Edit > New version, which keeps the URL; a new deployment changes it.

## Build and checks

Build with the repository's GitHub Pages/Jekyll toolchain (`bundle install`, `bundle exec jekyll build`), then:

- `python3 tests/test_site.py` checks the generated pages: the App Store link and banner, images, preserved URLs, internal links and page structure.
- `node --test tests/silk-field.test.mjs` checks the thread simulation: the painted current, threads stretching and settling, respawn, and hostile input.

Browser checks should cover desktop and phone layouts, a pointer or touch stroke, the QR code on desktop only, reduced motion, and the legal pages.
