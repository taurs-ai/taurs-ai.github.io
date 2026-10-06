# taurs-ai.github.io

The Tau.rs website. Static HTML, CSS, and a small JavaScript tag filter, hosted on GitHub Pages. Markdown posts are converted to HTML at build time; visitors do not need a Markdown parser or an API connection.

## Build and preview

Requires Node.js 22 or newer. From the repository root:

```sh
npm ci
npm run build
python3 -m http.server 8000 --directory _site
```

Open http://localhost:8000 or http://localhost:8000/blog/.

`npm run build` discovers all dated Markdown posts, refreshes `blog/index.html` and each post's HTML page, and copies the static site into `_site/` for deployment. It also removes generated pages for deleted posts. Generated HTML can be committed for branch-based GitHub Pages hosting or a simple preview from the repository root.

Run `npm test` to check Markdown processing, indexing, and rebuild behavior.

## Writing a post

Add a Markdown file under a date folder, such as `blog/20261006/my-post.md`:

```markdown
---
tags: [development, rust]
description: An optional custom excerpt for the blog tile.
author: An optional author name
---

# My post title

Write the post in Markdown here.

## A section

More text, code blocks, images, lists, or tables.
```

- Dates come from `YYYYMMDD` folder names. Posts are listed newest first; posts on the same date are ordered by title, then filename.
- Titles come from the first `# Heading`. An optional `title` field overrides it. Without either, the filename is used.
- Excerpts come from the first paragraph unless `description` is provided.
- Tags are optional YAML front matter. Use a list as above, or one string. Tags are normalized to lowercase; missing tags use `uncategorized`.
- Each file gets its own URL, such as `/blog/20261006/my-post.html`, so multiple posts on the same date work independently.
- Images can live alongside a post and use relative paths. Relative links to other `.md` posts are converted to `.html` links. Section headings get linkable IDs.
- Raw HTML is displayed as text. Standard Markdown, fenced code blocks, and tables are supported.

Run `npm run build` after adding or editing posts. The example posts under `blog/20261005/` demonstrate the format. Their original text is unchanged; their front matter supplies sample tags.

The sidebar filters posts by one tag at a time. Filtered URLs such as `/blog/?tag=testing` can be shared, and browser back/forward restores the selected filter. Without JavaScript, all posts and article pages remain readable.

## GitHub Pages

For automatic builds, set **Settings → Pages → Source** to **GitHub Actions**. The included `.github/workflows/pages.yml` checks and builds the site on pull requests and deploys `_site/` when changes reach `main`. Adding a dated Markdown post is enough; the workflow regenerates the index and article pages.

Alternatively, keep **Deploy from a branch** with **/ (root)** selected. Run `npm run build` locally and commit the generated `blog/index.html` and article `.html` files along with their Markdown sources before pushing. The public site is https://taurs-ai.github.io/.

## Editing the site

- `index.html`: homepage content and navigation.
- `blog/YYYYMMDD/*.md`: blog post sources.
- `templates/blog.html`: shared blog index and article shell. Generated blog HTML should not be edited directly.
- `scripts/build-blog.mjs`: post discovery, Markdown rendering, and static page generation.
- `assets/blog.js`: tag filtering, URL state, and result counts.
- `assets/styles.css` and `assets/blog.css`: shared styles and blog layouts.
- `assets/taurs-ai-logo-transparent.png`: the transparent logo used in the website header on both pages.
- `assets/taurs-ai-logo.png`: the original logo with a light background, used as the browser tab icon on both pages.
