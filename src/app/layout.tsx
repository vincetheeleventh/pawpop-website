import type { Metadata } from "next";
import { Arvo, Fredoka } from 'next/font/google';
import { GeistSans } from 'geist/font/sans';
import "./globals.css";
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Providers } from './providers';
import { GoogleAdsTracking } from '@/components/analytics/GoogleAdsTracking';
import PlausibleScript from '@/components/analytics/PlausibleScript';
import ClarityScript from '@/components/analytics/ClarityScript';

// PawPop Brand Fonts
const arvo = Arvo({ 
  weight: ['400', '700'],
  subsets: ['latin'], 
  variable: '--font-arvo',
  display: 'swap'
});

const fredoka = Fredoka({ 
  weight: '400',
  subsets: ['latin'], 
  variable: '--font-fredoka',
  display: 'swap'
});

export const metadata: Metadata = {
  title: "PawPop - The Unforgettable Gift for Pet Moms | AI Renaissance Portraits",
  description: "Transform into the Mona Lisa with your beloved pet! AI creates museum-quality Renaissance portraits in 60 seconds. The perfect gift for pet moms. Order now!",
  keywords: "pet mom gifts, mona lisa pet portraits, ai pet art, custom pet portraits, thoughtful pet gifts, pet parent art, personalized pet gifts, renaissance pet art",
  openGraph: {
    title: "PawPop - The Unforgettable Gift for Pet Moms",
    description: "Transform into the Mona Lisa with your beloved pet! AI creates museum-quality Renaissance portraits in 60 seconds.",
    url: "https://pawpop.art",
    siteName: "PawPop",
    images: [
      {
        url: "https://pawpop.art/images/hero_1.jpeg",
        width: 1200,
        height: 630,
        alt: "Pet mom transformed into Mona Lisa with her dog - PawPop Art",
      }
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PawPop - The Unforgettable Gift for Pet Moms",
    description: "Transform into the Mona Lisa with your beloved pet! Museum-quality AI Renaissance art in 60 seconds.",
    images: ["https://pawpop.art/images/hero_1.jpeg"],
    creator: "@pawpopart",
    site: "@pawpopart",
  },
  verification: {
    google: "30eO67pmdyXdxWYYZXuxhamPaTMcHKmtmSMbvuDNY7Y",
  },
  other: {
    "facebook-domain-verification": process.env.FACEBOOK_DOMAIN_VERIFICATION || "",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${arvo.variable} ${fredoka.variable}`}>
      <body className="font-geist bg-site-bg text-text-primary antialiased">
        <Providers>
          <GoogleAdsTracking />
          <PlausibleScript />
          <ClarityScript />
          <Header />
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
