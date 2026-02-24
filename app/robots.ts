import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/login', '/api/admin/', '/api/auth/'],
      },
      {
        userAgent: 'Googlebot',
        allow: ['/', '/api/kurals', '/api/seo/'],
        disallow: ['/admin', '/login', '/api/admin/', '/api/auth/'],
      },
    ],
    sitemap: 'https://learnthirukkural.com/sitemap.xml',
  };
}
