import { Metadata } from 'next';
import UploadPageClient from './UploadPageClient';

export const metadata: Metadata = {
  title: 'Upload Your Pet Photo | PawPop Custom Pet Portraits',
  description: 'Transform your pet\'s photo into a beautiful custom portrait. Upload your pet\'s photo and create a unique masterpiece in minutes.',
  openGraph: {
    title: 'Upload Your Pet Photo | PawPop',
    description: 'Transform your pet\'s photo into a beautiful custom portrait',
    images: ['/images/hero_image.png'],
  },
};

export default function UploadPage() {
  return <UploadPageClient />;
}
