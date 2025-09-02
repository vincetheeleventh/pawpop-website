import type { Metadata } from "next";
import { Inter, Playfair_Display, Fredoka } from 'next/font/google';
import "./globals.css";
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Providers } from './providers';

// PawPop Brand Fonts
const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter',
  display: 'swap'
});

const playfair = Playfair_Display({ 
  subsets: ['latin'], 
  variable: '--font-playfair',
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
        url: "https://pawpop.art/images/hero_image.png",
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
    images: ["https://pawpop.art/images/hero_image.png"],
    creator: "@pawpopart",
    site: "@pawpopart",
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || "",
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
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${fredoka.variable}`}>
      <body className="font-inter bg-gallery-white text-charcoal-frame antialiased">
        <Providers>
          <Header />
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
