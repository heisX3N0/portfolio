import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';

// P2 adds about, experience, certifications, writing, roles and work (SPEC 9.2).
const site = defineCollection({
  loader: file('src/content/site.yaml'),
  schema: z.object({
    name: z.string(),
    rootLine: z.string(),
    rootIntro: z.string(),
    email: z.email(),
    linkedin: z.url(),
    github: z.url(),
    substack: z.url(),
    location: z.string(),
    defaultCv: z.string().startsWith('/cv/'),
    headshot: z.object({ show: z.boolean(), src: z.string() }),
  }),
});

export const collections = { site };
