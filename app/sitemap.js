import { site } from "@/lib/site";
import { getBlogPosts, getPrograms } from "@/lib/content";

export default function sitemap() {
  const base = site.url;
  const now = new Date();

  const staticRoutes = ["", "/about", "/programs", "/blog", "/donate", "/contact"];
  const entries = staticRoutes.map((route) => {
    return {
      url: `${base}${route}`,
      lastModified: now
    };
  });

  const posts = getBlogPosts();
  posts.forEach((post) => {
    let lastModified = now;
    if (post.frontmatter.date) {
      lastModified = new Date(post.frontmatter.date);
    }
    entries.push({
      url: `${base}/blog/${post.slug}`,
      lastModified
    });
  });

  const programs = getPrograms();
  programs.forEach((program) => {
    entries.push({
      url: `${base}/programs#${program.slug}`,
      lastModified: now
    });
  });

  return entries;
}
