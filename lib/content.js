import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

const contentRoot = path.join(process.cwd(), "content");

function readCollection(folder) {
  const dir = path.join(contentRoot, folder);
  if (!fs.existsSync(dir)) {
    return [];
  }

  const files = fs.readdirSync(dir).filter((file) => file.endsWith(".md"));
  const items = files.map((file) => {
    const slug = file.replace(/\.md$/, "");
    const raw = fs.readFileSync(path.join(dir, file), "utf8");
    const { data, content } = matter(raw);
    return { slug, frontmatter: data, body: content };
  });

  return items;
}

export function getBlogPosts() {
  const posts = readCollection("blog").filter((post) => {
    if (post.frontmatter.draft === true) {
      return false;
    }
    return true;
  });

  posts.sort((a, b) => {
    const dateA = new Date(a.frontmatter.date || 0).getTime();
    const dateB = new Date(b.frontmatter.date || 0).getTime();
    return dateB - dateA;
  });

  return posts;
}

export function getBlogPost(slug) {
  const post = getBlogPosts().find((item) => item.slug === slug);
  if (!post) {
    return null;
  }

  const html = marked.parse(post.body);
  return { ...post, html };
}

export function getPrograms() {
  const programs = readCollection("programs");

  programs.sort((a, b) => {
    const orderA = Number(a.frontmatter.order ?? 99);
    const orderB = Number(b.frontmatter.order ?? 99);
    return orderA - orderB;
  });

  return programs;
}

export function getSettings() {
  const file = path.join(contentRoot, "settings", "home.json");
  if (!fs.existsSync(file)) {
    return {};
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}
