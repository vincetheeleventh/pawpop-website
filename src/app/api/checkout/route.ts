// src/app/api/checkout/route.ts
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { priceId, quantity } = await req.json();

    if (!priceId || !quantity) {
      return new NextResponse("Missing priceId or quantity", { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: quantity,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/?success=true`,
      cancel_url: `${req.headers.get("origin")}/?canceled=true`,
    });

    return NextResponse.json({ sessionId: session.id });

  } catch (error) {
    console.error("[CHECKOUT_POST]", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new NextResponse(errorMessage, { status: 500 });
  }
}
