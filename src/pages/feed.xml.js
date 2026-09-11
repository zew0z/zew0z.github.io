import rss from '@astrojs/rss';
import { getWriteups, postUrl, shortTitle } from '../lib/writeups';

export async function GET(context) {
  const posts = await getWriteups();
  return rss({
    title: 'zew0z :: security writeups',
    description: 'CTF writeups, labs, and flags - a living record of breaking boxes to learn how they are built.',
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: postUrl(post),
      categories: [...post.data.tags],
    })),
    customData: '<language>en</language>',
  });
}
