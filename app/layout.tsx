import './globals.css';
import type { Metadata } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
  metadataBase: new URL('https://learnthirukkural.com'),
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  title: {
    default: 'Learn Thirukkural Online - Interactive Tamil Wisdom Learning Platform',
    template: '%s | Thirukkural Learning'
  },
  description: 'Learn ancient Tamil wisdom through 1330 Thirukkural verses with interactive audio pronunciation, speech recognition practice, video lessons, and word puzzles. Perfect for children and adults.',
  keywords: [
    'Thirukkural', 'Tamil wisdom', 'learn Tamil', 'Thiruvalluvar',
    'ancient Tamil literature', 'Tamil stories for kids', 'Tamil educational games',
    'pronunciation practice', 'interactive learning', 'Tamil culture',
    'thirukural in tamil', 'thirukural in english', 'thirukkural meaning',
    'குறள்', 'திருக்குறள்', 'திருவள்ளுவர்', 'தமிழ் கற்க'
  ],
  authors: [{ name: 'Thirukkural Learning Platform' }],
  creator: 'Thirukkural Learning Platform',
  publisher: 'Thirukkural Learning Platform',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: 'ta_IN',
    url: 'https://learnthirukkural.com',
    siteName: 'Thirukkural Learning Platform',
    title: 'Learn Thirukkural Online - Interactive Tamil Wisdom',
    description: 'Learn ancient Tamil wisdom through 1330 Thirukkural verses with audio, video, and interactive games.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Thirukkural Learning Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Learn Thirukkural Online',
    description: 'Interactive Tamil wisdom learning with 1330 verses, audio, video, and games.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: 'https://learnthirukkural.com',
    languages: {
      'en': 'https://learnthirukkural.com',
      'ta': 'https://learnthirukkural.com',
      'x-default': 'https://learnthirukkural.com',
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 font-sans antialiased" suppressHydrationWarning>
        {children}
        <Script 
          src="https://analytics.ahrefs.com/analytics.js" 
          data-key="1DskMOze8Olcc4VIK4Tt2g"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
