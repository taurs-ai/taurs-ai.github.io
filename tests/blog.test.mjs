import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { buildBlog, folderDate, parsePost } from '../scripts/build-blog.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));

test('plain Markdown supplies title, excerpt, folder date, and a unique post URL', () => {
  const post = parsePost('# Test blog\n\nA **small** post with `code`.\n', '20261005', 'test_blog.md');
  assert.equal(post.title, 'Test blog');
  assert.equal(post.description, 'A small post with code.');
  assert.equal(post.date, '2026-10-05');
  assert.equal(post.href, '20261005/test_blog.html');
  assert.deepEqual(post.tags, ['uncategorized']);
  assert.match(post.html, /<strong>small<\/strong>/);
  assert.doesNotMatch(post.html, /<h1/);
});

test('YAML metadata overrides inferred fields and normalizes tags', () => {
  const post = parsePost('---\ntitle: Custom title\ndescription: Custom excerpt\nauthor: Team\ntags: [Rust, rust, testing]\n---\n# Original heading\n\nText.', '20261005', 'example.md');
  assert.equal(post.title, 'Custom title');
  assert.equal(post.description, 'Custom excerpt');
  assert.equal(post.author, 'Team');
  assert.deepEqual(post.tags, ['rust', 'testing']);
  assert.equal(post.html.trim(), '<p>Text.</p>');
});

test('invalid dates and malformed metadata fail with actionable errors', () => {
  assert.throws(() => folderDate('20260230'), /Invalid date/);
  assert.throws(() => folderDate('20261301'), /Invalid date/);
  assert.equal(folderDate('20240229'), '2024-02-29');
  assert.throws(() => parsePost('---\ntags: [rust]\nText', '20261005', 'bad.md'), /closing ---/);
  assert.throws(() => parsePost('---\ntags: [123]\n---\nText', '20261005', 'bad.md'), /tags must be/);
  assert.throws(() => parsePost('---\ntitle: [bad]\n---\nText', '20261005', 'bad.md'), /title must be/);
});

test('Markdown preserves rich content and gives repeated headings unique anchors', () => {
  const source = '# Title\n\n## Details\n\n- First\n- Second\n\n```rust\nlet x = 1;\n```\n\n| Name | Value |\n| --- | --- |\n| a | b |\n\n## Details\n\n[Other](other.md#details) ![Diagram](diagram.png)';
  const post = parsePost(source, '20261005', 'rich.md');
  assert.match(post.html, /id="details"/);
  assert.match(post.html, /id="details-2"/);
  assert.match(post.html, /<ul>/);
  assert.match(post.html, /class="language-rust"/);
  assert.match(post.html, /<table>/);
  assert.match(post.html, /href="other.html#details"/);
  assert.match(post.html, /src="diagram.png"/);
});

test('raw HTML is escaped and unsafe Markdown links are not emitted', () => {
  const post = parsePost('# Safety\n\n<script>alert(1)</script>\n\n[bad](javascript:alert(1))', '20261005', 'safety.md');
  assert.doesNotMatch(post.html, /<script>|href="javascript:/);
  assert.match(post.html, /&lt;script&gt;/);
});

test('new dated files are discovered, sorted, rendered, and removed on rebuild', async (t) => {
  const temp = await mkdtemp(path.join(os.tmpdir(), 'taurs-blog-test-'));
  t.after(() => rm(temp, { recursive: true, force: true }));
  await mkdir(path.join(temp, 'templates'));
  await cp(path.join(root, 'templates/blog.html'), path.join(temp, 'templates/blog.html'));
  await mkdir(path.join(temp, 'assets'));
  await writeFile(path.join(temp, 'index.html'), '<h1>Home</h1>');
  await writeFile(path.join(temp, '.nojekyll'), '');
  for (const day of ['20261005', '20261006']) await mkdir(path.join(temp, 'blog', day), { recursive: true });
  await writeFile(path.join(temp, 'blog/20261005/z.md'), '# Z post\n\nOlder Z.');
  await writeFile(path.join(temp, 'blog/20261005/a.md'), '# A post\n\nOlder A.');
  await writeFile(path.join(temp, 'blog/20261006/new.md'), '---\ntags: [rust, testing]\n---\n# Newest\n\nNew post.');
  await writeFile(path.join(temp, 'blog/20261005/manual.html'), '<p>Preserve this hand-written file.</p>');
  const posts = await buildBlog(temp);
  assert.deepEqual(posts.map((post) => post.title), ['Newest', 'A post', 'Z post']);
  const index = await readFile(path.join(temp, 'blog/index.html'), 'utf8');
  assert.equal((index.match(/class="post-card"/g) ?? []).length, 3);
  assert.match(index, /data-filter-tag="rust"/);
  assert.ok(index.indexOf('20261006/new.html') < index.indexOf('20261005/a.html'));
  const article = await readFile(path.join(temp, '_site/blog/20261006/new.html'), 'utf8');
  assert.match(article, /<h1>Newest<\/h1>/);
  assert.match(article, /<p>New post.<\/p>/);
  assert.match(article, /href="\.\.\/\?tag=rust"/);
  await buildBlog(temp);
  assert.equal(await readFile(path.join(temp, 'blog/index.html'), 'utf8'), index, 'Builds are deterministic');
  await rm(path.join(temp, 'blog/20261006/new.md'));
  await buildBlog(temp);
  await assert.rejects(readFile(path.join(temp, 'blog/20261006/new.html')), { code: 'ENOENT' });
  await assert.rejects(readFile(path.join(temp, '_site/blog/20261006/new.html')), { code: 'ENOENT' });
  assert.match(await readFile(path.join(temp, 'blog/20261005/manual.html'), 'utf8'), /Preserve this/);
});
