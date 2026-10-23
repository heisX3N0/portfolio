// Search and sharing data (SPEC 9.3): JSON-LD for the Person and for each case study, and the OG image paths.
import { getOrdered } from './content';
import { getSite } from './site';
import type { Work } from './content';

/** OG images (built by src/pages/og/[name].png.ts): one per published role page, one for every other page. */
export const ogImagePath = (name: string) => `/og/${name}.png`;
export const SITE_OG = 'site';

// SPEC 9.3 names exactly these two credentials.
const CREDENTIALS = ['cbap', 'pspo-ii'];

/** Person JSON-LD for the root page, About and each role page. Only a role page has a jobTitle (its CV title). */
export async function personJsonLd(origin: URL, jobTitle?: string) {
  const site = await getSite();
  const certifications = await getOrdered('certifications');
  const credentials = CREDENTIALS.map((id) => {
    const cert = certifications.find((c) => c.id === id);
    if (!cert) throw new Error(`certifications.yaml: no "${id}" entry for the Person JSON-LD`);
    return {
      '@type': 'EducationalOccupationalCredential',
      name: cert.name,
      credentialCategory: 'certification',
      ...(cert.issuer ? { recognizedBy: { '@type': 'Organization', name: cert.issuer } } : {}),
      ...(cert.url ? { url: cert.url } : {}),
    };
  });
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: site.name,
    url: new URL('/', origin).href,
    ...(jobTitle ? { jobTitle } : {}),
    sameAs: [site.linkedin],
    hasCredential: credentials,
    alumniOf: site.alumniOf.map((name) => ({ '@type': 'CollegeOrUniversity', name })),
  };
}

/** Article JSON-LD for a case study page. */
export async function articleJsonLd(origin: URL, work: Work, url: URL) {
  const site = await getSite();
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: work.title,
    description: work.summary,
    url: url.href,
    mainEntityOfPage: url.href,
    image: new URL(ogImagePath(SITE_OG), origin).href,
    author: { '@type': 'Person', name: site.name, url: new URL('/', origin).href },
  };
}
