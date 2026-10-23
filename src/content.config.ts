import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { parse } from 'yaml';
import {
  siteSchema,
  roleSchema,
  workSchema,
  experienceSchema,
  certificationSchema,
  writingGroupSchema,
  aboutSchema,
} from './lib/schemas';

// SPEC 9.2. The schemas live in src/lib/schemas.ts so the Node tests can check them.

// Collections come back sorted by id, so lists record their position: the order in the file is the display order.
const ordered = (path: string) =>
  file(path, {
    parser: (text) => {
      const items: unknown = parse(text);
      if (!Array.isArray(items)) throw new Error(`${path} must be a YAML list (each entry starting with "- id:")`);
      return items.map((item: Record<string, unknown>, position) => ({ ...item, position }));
    },
  });

const site = defineCollection({ loader: file('src/content/site.yaml'), schema: siteSchema });
const roles = defineCollection({ loader: glob({ pattern: '*.md', base: 'src/content/roles' }), schema: roleSchema });
const work = defineCollection({ loader: glob({ pattern: '*.md', base: 'src/content/work' }), schema: workSchema });
const experience = defineCollection({ loader: ordered('src/content/experience.yaml'), schema: experienceSchema });
const certifications = defineCollection({ loader: ordered('src/content/certifications.yaml'), schema: certificationSchema });
const writing = defineCollection({ loader: ordered('src/content/writing.yaml'), schema: writingGroupSchema });
const about = defineCollection({ loader: glob({ pattern: 'about.md', base: 'src/content' }), schema: aboutSchema });

export const collections = { site, roles, work, experience, certifications, writing, about };
