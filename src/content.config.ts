import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Blog posts live as Markdown in src/content/blog/*.md.
// A git-based CMS dashboard (or you, by hand) writes files here.
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    category: z.string().default('General'),
    cover: z.string().optional(),
    author: z.string().default('Abdul Rehman Khan'),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
