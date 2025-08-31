import type { Metadata } from "next";
import '@fontsource/open-sans/400.css';
import '@fontsource/open-sans/500.css';
import '@fontsource/open-sans/600.css';
import '@fontsource/open-sans/700.css';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/500.css';
import '@fontsource/nunito/600.css';
import '@fontsource/nunito/700.css';
import '@fontsource/quicksand/400.css';
import '@fontsource/quicksand/500.css';
import '@fontsource/quicksand/600.css';
import "./globals.css";
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Providers } from './providers';

// Font variables for CSS
const fontVariables = {
  '--font-sans': '"Open Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  '--font-heading': '"Nunito", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  '--font-accent': '"Quicksand", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
} as const;

export const metadata: Metadata = {
  title: "PawPop Art - Custom Pet Pop Art Portraits | Turn Your Pet Into Art",
  description: "Transform your beloved pet into a stunning pop art masterpiece! Custom pet portraits that celebrate the unique bond between you and your furry friend. Digital downloads and premium prints available.",
  keywords: "custom pet portraits, pet pop art, dog portraits, cat portraits, pet art, personalized pet gifts, pet canvas prints",
  openGraph: {
    title: "PawPop Art - Custom Pet Pop Art Portraits",
    description: "Transform your beloved pet into a stunning pop art masterpiece! Custom pet portraits with digital downloads and premium prints available.",
    url: "https://pawpop.art",
    siteName: "PawPop Art",
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
    title: "PawPop Art - Custom Pet Pop Art Portraits",
    description: "Transform your beloved pet into a stunning pop art masterpiece!",
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
    <html lang="en" style={fontVariables as React.CSSProperties}>
      <body className="font-sans">
        <Providers>
          <Header />
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
