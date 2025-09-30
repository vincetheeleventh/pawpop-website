import { Metadata } from 'next';
import UploadPageClient from './UploadPageClient';

export const metadata: Metadata = {
  title: 'Upload Your Pet Photo | PawPop Custom Pet Portraits',
  description: 'Transform your pet\'s photo into a beautiful custom portrait. Enter your email first, then upload your pet\'s photo to create a unique masterpiece in minutes.',
  openGraph: {
    title: 'Upload Your Pet Photo | PawPop',
    description: 'Transform your pet\'s photo into a beautiful custom portrait',
    images: ['/images/hero_1.jpeg'],
  },
};

export default function UploadPage() {
  return <UploadPageClient />;
}
