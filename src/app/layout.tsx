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
  title: "PawPop - Transform Into Mona Lisa with Your Pet | AI Art Portraits",
  description: "Become the Mona Lisa with your beloved pet! Our AI artist Monsieur Brush creates museum-quality portraits that celebrate the bond between pet moms and their furry companions. Fast, magical, unforgettable.",
  keywords: "pet mom gifts, mona lisa pet portraits, ai pet art, custom pet portraits, thoughtful pet gifts, pet parent art, personalized pet gifts",
  openGraph: {
    title: "PawPop - Transform Into Mona Lisa with Your Pet",
    description: "Become the Mona Lisa with your beloved pet! Our AI artist creates museum-quality portraits in minutes.",
    url: "https://pawpop.art",
    siteName: "PawPop",
    images: [
      {
        url: "https://pawpop.art/images/pawpop-og-image.jpg",
        width: 1200,
        height: 630,
        alt: "PawPop Art - Custom Pet Pop Art Portraits",
      }
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PawPop - Transform Into Mona Lisa with Your Pet",
    description: "Become the Mona Lisa with your beloved pet! Museum-quality AI art in minutes.",
    images: ["https://pawpop.art/images/pawpop-og-image.jpg"],
    creator: "@pawpopart",
    site: "@pawpopart",
  },
  other: {
    "google-site-verification": process.env.GOOGLE_SITE_VERIFICATION || "",
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
