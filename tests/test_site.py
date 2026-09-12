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
    def test_signup_delivers_only_the_requested_details_to_the_owner(self):
        page = Page(OUTPUT / 'index.html')
        form, = page.tags('form')
        self.assertEqual(form['method'].upper(), 'POST')
        self.assertEqual(form['action'], 'https://formsubmit.co/rflx.app@gmail.com')
        inputs = {field.get('name'): field for field in page.tags('input')}
        email = inputs['email']
        self.assertEqual(email['type'], 'email')
        self.assertIn('required', email)
        self.assertEqual(email['autocomplete'], 'email')
        self.assertIn('Reflex 3', inputs['request']['value'])
        self.assertIn('waitlist', inputs['request']['value'])
        self.assertIn('when the TestFlight beta is ready', inputs['request']['value'])
        self.assertIn('TestFlight', inputs['_subject']['value'])
        self.assertEqual(inputs['_next']['value'], 'https://rflx.app/thanks/')
        self.assertNotIn('_autoresponse', inputs)
        self.assertNotIn('_cc', inputs)
        self.assertNotEqual(inputs.get('_captcha', {}).get('value'), 'false')
        self.assertEqual([label['for'] for label in page.tags('label')], [email['id']])

    def test_version_stays_real_text_outside_the_particle_canvas(self):
        page = Page(OUTPUT / 'index.html')
        self.assertEqual(page.tags('h1')[0]['aria-label'], 'Reflex 3')
        self.assertEqual(page.tags('sup')[0]['class'], 'wordmark-version')
        self.assertEqual(page.tags('canvas')[0]['aria-hidden'], 'true')

    def test_public_pages_and_internal_links_resolve(self):
        for route in ['', 'privacypolicy', 'terms', 'thanks', 'legacy-privacy', 'legacy-terms']:
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
        for route in ['', 'privacypolicy', 'terms', 'thanks']:
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
