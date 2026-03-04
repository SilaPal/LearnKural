import { NextResponse } from 'next/server';
import { getAllKurals } from '@/lib/kurals';

function extractYouTubeId(url: string | null): string {
  if (!url) return '';
  const embedMatch = url.match(/embed\/([a-zA-Z0-9_-]+)/);
  if (embedMatch) return embedMatch[1];
  const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  if (watchMatch) return watchMatch[1];
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (shortMatch) return shortMatch[1];
  return '';
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const kurals = await getAllKurals();
  const baseUrl = 'https://learnthirukkural.com';

  const kuralsWithVideos = kurals.filter(k => {
    const tamilId = extractYouTubeId(k.youtube_tamil_url);
    const englishId = extractYouTubeId(k.youtube_english_url);
    return tamilId || englishId;
  });

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
`;

  for (const kural of kuralsWithVideos) {
    const pageUrl = `${baseUrl}/kural-learning/${kural.slug}/`;
    const tamilVideoId = extractYouTubeId(kural.youtube_tamil_url);
    const englishVideoId = extractYouTubeId(kural.youtube_english_url);

    xml += `<url>
<loc>${escapeXml(pageUrl)}</loc>
`;

    if (tamilVideoId) {
      const title = `Thirukkural ${kural.id} - ${escapeXml((kural.kural_english || 'Tamil Wisdom').replace(/\\n/g, ' ').substring(0, 80))} | குறள் ${kural.id}`;
      const description = escapeXml(
        `Learn Thirukkural ${kural.id} with Tamil video explanation. ${(kural.meaning_english || '').replace(/\\n/g, ' ')} குறள் ${kural.id}: ${(kural.kural_tamil || '').replace(/\\n/g, ' ').substring(0, 150)}`
      );

      xml += `<video:video>
<video:thumbnail_loc>https://img.youtube.com/vi/${tamilVideoId}/maxresdefault.jpg</video:thumbnail_loc>
<video:title>${title}</video:title>
<video:description>${description}</video:description>
<video:content_loc>https://www.youtube.com/watch?v=${tamilVideoId}</video:content_loc>
<video:player_loc>https://www.youtube.com/embed/${tamilVideoId}</video:player_loc>
<video:family_friendly>yes</video:family_friendly>
<video:requires_subscription>no</video:requires_subscription>
<video:live>no</video:live>
<video:tag>thirukkural</video:tag>
<video:tag>tamil</video:tag>
<video:tag>thiruvalluvar</video:tag>
<video:tag>kural ${kural.id}</video:tag>
<video:tag>learn tamil</video:tag>
<video:tag>திருக்குறள்</video:tag>
</video:video>
`;
    }

    if (englishVideoId && englishVideoId !== tamilVideoId) {
      const title = `Thirukkural ${kural.id} English Explanation - ${escapeXml((kural.kural_english || 'Tamil Wisdom').replace(/\\n/g, ' ').substring(0, 80))}`;
      const description = escapeXml(
        `Learn Thirukkural ${kural.id} with English video explanation. ${(kural.meaning_english || '').replace(/\\n/g, ' ')}`
      );

      xml += `<video:video>
<video:thumbnail_loc>https://img.youtube.com/vi/${englishVideoId}/maxresdefault.jpg</video:thumbnail_loc>
<video:title>${title}</video:title>
<video:description>${description}</video:description>
<video:content_loc>https://www.youtube.com/watch?v=${englishVideoId}</video:content_loc>
<video:player_loc>https://www.youtube.com/embed/${englishVideoId}</video:player_loc>
<video:family_friendly>yes</video:family_friendly>
<video:requires_subscription>no</video:requires_subscription>
<video:live>no</video:live>
<video:tag>thirukkural</video:tag>
<video:tag>english</video:tag>
<video:tag>thiruvalluvar</video:tag>
<video:tag>kural ${kural.id}</video:tag>
</video:video>
`;
    }

    xml += `</url>
`;
  }

  xml += `</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
