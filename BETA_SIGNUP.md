# Reflex 3 beta signup

GitHub Pages serves the homepage and the existing `/privacypolicy/` and `/terms/` URLs. The new pages use `reflex` / `reflex-legal` layouts, local assets, and a small canvas wordmark animation. The form works without JavaScript; reduced-motion users see a static wordmark. Older app legal pages remain available; the previous shared Reflex/Perfect Loop Maker policy is preserved at `/legacy-privacy/` and the old terms at `/legacy-terms/`.

## Email delivery activation

The form posts directly to FormSubmit for delivery to **rflx.app@gmail.com**. Emails contain the submitted address and an explicit request to join the Reflex 3 waitlist and be notified when the beta is ready. No API secret belongs in this static repository.

1. Publish through the repository's existing GitHub Pages configuration.
2. Submit one request from `https://rflx.app/` using an address you control. Complete the provider's spam check.
3. In `rflx.app@gmail.com`, open FormSubmit's activation email and confirm the form. Check spam if necessary. Activation is required before normal delivery works.
4. Submit another controlled request. Verify the recipient, subject, request text, Reply-To, and return to `https://rflx.app/thanks/`. Do not share the signup link with testers until this delivery check passes.
5. Once the beta is ready, add approved addresses manually to the external TestFlight group in App Store Connect. Apple handles the actual invitation. The form does not automatically enroll testers.

Keep FormSubmit's default reCAPTCHA enabled. The hidden honeypot adds spam filtering. No automatic reply, subscriber export, or public email list is created by this code. FormSubmit documents 30-day submission retention. The privacy policy covers FormSubmit, Gmail, GitHub Pages, and Apple's invitation handling.

If changing the receiving address, update `index.html`, contact links, policy, app settings, and this guide. FormSubmit requires activation again for the new address. After activation, FormSubmit can provide an opaque endpoint if you want to replace the visible recipient in the form action.

Build with the repository's GitHub Pages/Jekyll toolchain (`bundle install`, `bundle exec jekyll build`), then run `python3 tests/test_site.py` to check the generated form, preserved URLs, internal navigation, and page structure. Browser checks should cover desktop/mobile layout, required and invalid email validation, legal navigation, and the thank-you page. Delivery and CAPTCHA require the separate live check above; a locally intercepted form submission cannot prove email delivery.

Run `node --test tests/particle-motion.test.mjs` to verify particle flight, edge bounces, pointer interaction, and return to the wordmark.
