import type { APIRoute } from 'astro';
import sharp from 'sharp';
import { getWriteups, postSlug, readMinutes, shortTitle, type Writeup } from '../../lib/writeups';

export async function getStaticPaths() {
  const posts = await getWriteups();
  return posts.map((post) => ({ params: { slug: postSlug(post) }, props: { post } }));
}

const PLATFORM_COLOR = { thm: '#2dd4bf', htb: '#4ade80', blog: '#a78bfa' } as const;
const DIFFICULTY_COLOR: Record<string, string> = {
  'very-easy': '#2dd4bf',
  easy: '#4ade80',
  medium: '#fbbf24',
  hard: '#fb7185',
};

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function wrapTitle(title: string, maxChars: number, maxLines: number): string[] {
  const words = title.split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if (cur && (cur + ' ' + w).length > maxChars) {
      lines.push(cur);
      cur = w;
      if (lines.length === maxLines) break;
    } else {
      cur = cur ? cur + ' ' + w : w;
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  if (lines.length === maxLines && words.join(' ').length > lines.join(' ').length) {
    lines[maxLines - 1] = lines[maxLines - 1].replace(/\s+\S*$/, '') + '…';
  }
  return lines;
}

function renderSvg(post: Writeup): string {
  const color = PLATFORM_COLOR[post.data.platform];
  const titleLines = wrapTitle(shortTitle(post), 24, 3);
  const date = post.data.date.toISOString().slice(0, 10);
  const diff = post.data.difficulty ? post.data.difficulty.replace(' ', '-') : '';
  const diffColor = DIFFICULTY_COLOR[diff];
  const crumb = `guest@zew0z:~/writeups$ cat ${postSlug(post)}.md`;
  const titleY = 280;
  const metaY = titleY + (titleLines.length - 1) * 84 + 64;

  const titleSpans = titleLines
    .map((line, i) => `<tspan x="84" y="${titleY + i * 84}">${esc(line)}</tspan>`)
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#1f2947" stroke-width="1" opacity="0.35"/>
    </pattern>
    <linearGradient id="spectrum" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#2dd4bf"/>
      <stop offset="0.25" stop-color="#4ade80"/>
      <stop offset="0.5" stop-color="#fbbf24"/>
      <stop offset="0.75" stop-color="#fb7185"/>
      <stop offset="1" stop-color="#a78bfa"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.85" cy="0" r="1">
      <stop offset="0" stop-color="#2dd4bf" stop-opacity="0.12"/>
      <stop offset="0.6" stop-color="#2dd4bf" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="#0a0e1c"/>
  <rect width="1200" height="630" fill="url(#grid)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <text x="84" y="96" font-family="'JetBrains Mono','DejaVu Sans Mono',monospace" font-size="22" fill="#7f89b5">${esc(crumb)}</text>
  <rect x="84" y="150" width="${44 + post.data.platform.length * 13}" height="38" rx="4" fill="${color}"/>
  <text x="${84 + 22 + post.data.platform.length * 6.5}" y="176" text-anchor="middle" font-family="'JetBrains Mono','DejaVu Sans Mono',monospace" font-size="19" font-weight="700" fill="#0a0e1c">${esc(post.data.platform)}</text>
  ${diffColor ? `<text x="${136 + post.data.platform.length * 13}" y="177" font-family="'JetBrains Mono','DejaVu Sans Mono',monospace" font-size="20" fill="${diffColor}">[${esc(post.data.difficulty)}]</text>` : ''}
  <text font-family="'Space Grotesk Variable','DejaVu Sans',Verdana,sans-serif" font-size="72" font-weight="700" letter-spacing="-2" fill="#e9edfb">${titleSpans}</text>
  <text x="84" y="${metaY}" font-family="'JetBrains Mono','DejaVu Sans Mono',monospace" font-size="22" fill="#a9b2d4">${esc(date)} / ~${readMinutes(post)} min read</text>
  <rect x="84" y="540" width="180" height="5" rx="3" fill="url(#spectrum)"/>
  <text x="1116" y="548" text-anchor="end" font-family="'JetBrains Mono','DejaVu Sans Mono',monospace" font-size="22" fill="#2dd4bf">zew0z.github.io</text>
</svg>`;
}

export const GET: APIRoute = async ({ props }) => {
  const { post } = props as { post: Writeup };
  const png = await sharp(Buffer.from(renderSvg(post))).png().toBuffer();
  return new Response(new Uint8Array(png), {
    headers: { 'Content-Type': 'image/png' },
  });
};
