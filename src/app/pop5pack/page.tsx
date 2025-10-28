import { Metadata } from 'next';
import Pop5PackHero from '@/components/pop5pack/Pop5PackHero';
import ParodyStylesSection from '@/components/pop5pack/ParodyStylesSection';
import HowItWorksSection from '@/components/pop5pack/HowItWorksSection';

export const metadata: Metadata = {
  title: 'Pop 5-Pack | Turn Your Pet into Iconic Parodies',
  description: 'Get your pet transformed into 4 iconic parodies - Wizard, PAWS, Popstar, and Dogfather. Start with a free proof!',
  openGraph: {
    title: 'Pop 5-Pack | Turn Your Pet into Iconic Parodies',
    description: 'Get your pet transformed into 4 iconic parodies. Start with a free proof!',
    type: 'website',
  },
};

export default function Pop5PackPage() {
  return (
    <main className="min-h-screen bg-site-bg">
      <Pop5PackHero />
      <ParodyStylesSection />
      <HowItWorksSection />
    </main>
  );
}
