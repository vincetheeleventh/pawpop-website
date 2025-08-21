// src/app/api/checkout/route.ts
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    console.log('Checkout request received');
    
    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Request body:', requestBody);
    } catch (e) {
      console.error('Error parsing request body:', e);
      return new NextResponse(JSON.stringify({ error: 'Invalid request body' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { priceId, quantity } = requestBody;
    console.log('Price ID:', priceId, 'Quantity:', quantity);

    if (!priceId || !quantity) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing priceId or quantity' }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate price ID format
    if (!priceId.startsWith('price_')) {
      console.error('Invalid price ID format:', priceId);
      return new NextResponse(
        JSON.stringify({ error: 'Invalid price ID format' }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: Number(quantity),
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || req.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || req.headers.get('origin')}/test-checkout?canceled=true`,
      client_reference_id: 'test_reference_id',
      customer_email: 'test@example.com', // In production, collect this from your form
    });

    console.log('Checkout session created:', session.id);
    
    return new NextResponse(JSON.stringify({ 
      sessionId: session.id 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("[CHECKOUT_POST]", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new NextResponse(
      JSON.stringify({ error: errorMessage }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
