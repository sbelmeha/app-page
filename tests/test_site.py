"""Check the generated GitHub Pages output: python3 tests/test_site.py [_site]."""
from html.parser import HTMLParser
from pathlib import Path
import sys
import unittest
from urllib.parse import urlparse

OUTPUT = Path(sys.argv.pop(1)) if len(sys.argv) > 1 else Path('_site')


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.elements = []
        self.feed(path.read_text())

    def handle_starttag(self, tag, attrs):
        self.elements.append((tag, dict(attrs)))

    def tags(self, tag):
        return [attrs for name, attrs in self.elements if name == tag]


class PublishedSiteTests(unittest.TestCase):
    def test_home_page_leads_to_the_app_store(self):
        page = Page(OUTPUT / 'index.html')
        self.assertFalse(page.tags('form'))
        badge, = [a for a in page.tags('a') if a.get('class') == 'badge']
        self.assertEqual(urlparse(badge['href']).netloc, 'apps.apple.com')
        self.assertTrue(badge['href'].endswith('/id1456159174'))
        banner, = [m for m in page.tags('meta') if m.get('name') == 'apple-itunes-app']
        self.assertEqual(banner['content'], 'app-id=1456159174')
        for image in page.tags('img'):
            self.assertTrue(image.get('alt'), image['src'])
            self.assertTrue((OUTPUT / image['src'].lstrip('/')).is_file(), image['src'])
        self.assertEqual(page.tags('canvas')[0]['aria-hidden'], 'true')

    def test_home_page_does_not_promise_a_price(self):
        text = (OUTPUT / 'index.html').read_text().lower()
        self.assertNotIn('free', text)
        self.assertNotIn('waitlist', text)

    def test_legal_pages_show_when_they_were_updated(self):
        for route in ['privacypolicy', 'terms']:
            text = (OUTPUT / route / 'index.html').read_text()
            self.assertRegex(text, r'Last updated [A-Z][a-z]+ \d{1,2}, \d{4}<', route)

    def test_public_pages_and_internal_links_resolve(self):
        for route in ['', 'privacypolicy', 'terms', 'legacy-privacy', 'legacy-terms']:
            path = OUTPUT / route / 'index.html'
            self.assertTrue(path.is_file(), route)
            page = Page(path)
            self.assertTrue(page.tags('h1'), route)
            for anchor in page.tags('a'):
                href = anchor.get('href', '')
                if not href.startswith('/') or href.startswith('//'):
                    continue
                target = OUTPUT / urlparse(href).path.lstrip('/')
                self.assertTrue(target.is_file() or (target / 'index.html').is_file(), href)

    def test_new_pages_are_self_contained_and_accessible(self):
        for route in ['', 'privacypolicy', 'terms']:
            page = Page(OUTPUT / route / 'index.html')
            self.assertEqual(len(page.tags('h1')), 1, route)
            self.assertEqual(page.tags('html')[0]['lang'], 'en')
            self.assertEqual(page.tags('main')[0]['id'], 'main')
            for script in page.tags('script'):
                self.assertEqual(route, '')
                self.assertEqual(script.get('type'), 'module')
                self.assertTrue((OUTPUT / script['src'].lstrip('/')).is_file())
            self.assertFalse(page.tags('base'), route)
            for link in page.tags('link'):
                if link.get('rel') == 'stylesheet':
                    self.assertTrue((OUTPUT / link['href'].lstrip('/')).is_file())


if __name__ == '__main__':
    unittest.main()
