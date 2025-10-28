import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { artworkId, customerEmail } = await req.json();

    if (!artworkId || !customerEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify artwork exists and is a Pop5Pack proof
    const { data: artwork, error: artworkError } = await supabase
      .from('artworks')
      .select('*')
      .eq('id', artworkId)
      .single();

    if (artworkError || !artwork) {
      return NextResponse.json(
        { error: 'Artwork not found' },
        { status: 404 }
      );
    }

    const isPop5Pack = artwork.generation_metadata?.product_type === 'pop5pack';
    const isProof = artwork.generation_metadata?.is_proof === true;

    if (!isPop5Pack || !isProof) {
      return NextResponse.json(
        { error: 'Invalid artwork type' },
        { status: 400 }
      );
    }

    // Check if already purchased
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('artwork_id', artworkId)
      .eq('order_status', 'completed')
      .single();

    if (existingOrder) {
      return NextResponse.json(
        { error: 'This pack has already been purchased' },
        { status: 400 }
      );
    }

    const parodyStyle = artwork.generation_metadata?.parody_style || 'wizard';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Pop 5-Pack: All 4 Parody Styles',
              description: `High-resolution, watermark-free versions of all 4 iconic parody styles (Wizard, PAWS, Popstar, Dogfather)`,
              images: [artwork.generated_images?.artwork_preview].filter(Boolean),
            },
            unit_amount: 500, // $5.00 in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/pop5pack/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pop5pack/checkout/${artworkId}`,
      customer_email: customerEmail,
      metadata: {
        artworkId,
        productType: 'pop5pack',
        parodyStyle,
        customerEmail,
      },
    });

    // Create pending order record
    await supabase.from('orders').insert({
      artwork_id: artworkId,
      customer_email: customerEmail,
      product_type: 'pop5pack_digital',
      total_amount_cents: 500,
      stripe_session_id: session.id,
      order_status: 'pending',
      order_metadata: {
        product_type: 'pop5pack',
        parody_style: parodyStyle,
        pack_price_cents: 500,
        delivery_method: 'digital',
      },
    });

    return NextResponse.json({
      sessionId: session.id,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
