import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const writeups = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/writeups' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string(),
    tags: z.array(z.string()).default([]),
    platform: z.enum(['thm', 'htb', 'blog']),
    difficulty: z.string().optional(),
    room: z.string().optional(),
  }),
});

export const collections = { writeups };
