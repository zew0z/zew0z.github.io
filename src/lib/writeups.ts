import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';

export type Writeup = CollectionEntry<'writeups'>;

/* Jekyll slugs strip the date prefix: 2026-09-11-agent-sudo-tryhackme -> agent-sudo-tryhackme */
export function postSlug(post: Writeup): string {
  return post.id.replace(/^\d{4}-\d{2}-\d{2}-/, '');
}

export function postUrl(post: Writeup): string {
  const d = post.data.date;
  const p = (n: number) => String(n).padStart(2, '0');
  return `/${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())}/${postSlug(post)}.html`;
}

export function readMinutes(post: Writeup): number {
  const words = (post.body || '').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export async function getWriteups(): Promise<Writeup[]> {
  const posts = await getCollection('writeups');
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export function platformOf(post: Writeup): 'thm' | 'htb' | 'blog' {
  return post.data.platform;
}

export function shortTitle(post: Writeup): string {
  return post.data.title.split(' - ')[0].replace(/ 2025$/, '');
}

export function searchItem(post: Writeup) {
  const text = (post.body || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*`_|:-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 12000);
  return {
    title: shortTitle(post),
    url: postUrl(post),
    date: post.data.date.toISOString().slice(0, 10),
    difficulty: post.data.difficulty || null,
    room: post.data.room || null,
    platform: platformOf(post),
    tags: post.data.tags,
    description: post.data.description,
    text,
  };
}
