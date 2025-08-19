import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PawPop Art",
  description: "Turn your pet into a pop art icon!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 text-gray-800`}>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
