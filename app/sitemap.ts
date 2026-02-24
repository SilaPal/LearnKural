import { MetadataRoute } from 'next';
import { getAllKurals } from '@/lib/kurals';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const kurals = await getAllKurals();
  const baseUrl = 'https://learnthirukkural.com';

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/kural-playing`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  const kuralPages: MetadataRoute.Sitemap = kurals.map((kural) => ({
    url: `${baseUrl}/kural-learning/${kural.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.9,
  }));

  return [...staticPages, ...kuralPages];
}
