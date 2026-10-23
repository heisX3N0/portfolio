// What a role page shows in search results and link previews (P4.5). Kept free of astro:content so the Node tests
// can import it. The short fields are optional: without them a role page shares its full CV title and supporting line.
import type { PublishedRole } from './schemas';

export function roleShare(role: PublishedRole, name: string) {
  return {
    title: `${name} | ${role.shortTitle ?? role.title}`,
    description: role.shareDescription ?? role.supporting,
    // The OG image shows the full CV title, so its alt text does too.
    imageAlt: `${name} | ${role.title}`,
  };
}
