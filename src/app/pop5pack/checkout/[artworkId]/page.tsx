import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Pop5PackCheckout from '@/components/pop5pack/Pop5PackCheckout';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const metadata: Metadata = {
  title: 'Checkout - Get All 4 Parody Styles | PawPop',
  description: 'Complete your purchase and get high-resolution, watermark-free versions of all 4 iconic parody styles for just $5.',
};

interface PageProps {
  params: {
    artworkId: string;
  };
}

export default async function Pop5PackCheckoutPage({ params }: PageProps) {
  const { artworkId } = params;

  // Fetch artwork details
  const { data: artwork, error } = await supabase
    .from('artworks')
    .select('*')
    .eq('id', artworkId)
    .single();

  if (error || !artwork) {
    notFound();
  }

  // Verify this is a Pop5Pack proof
  const isPop5Pack = artwork.generation_metadata?.product_type === 'pop5pack';
  const isProof = artwork.generation_metadata?.is_proof === true;

  if (!isPop5Pack || !isProof) {
    notFound();
  }

  // Get proof image URL
  const proofImageUrl = artwork.generated_images?.artwork_preview;
  const parodyStyle = artwork.generation_metadata?.parody_style || 'wizard';
  const customerEmail = artwork.customer_email;

  return (
    <Pop5PackCheckout
      artworkId={artworkId}
      proofImageUrl={proofImageUrl}
      parodyStyle={parodyStyle}
      customerEmail={customerEmail}
    />
  );
}
