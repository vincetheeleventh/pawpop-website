// src/app/api/products/route.ts
import { getProducts } from "@/lib/printify";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const products = await getProducts();
    return NextResponse.json(products);
  } catch (error) {
    console.error("[PRODUCTS_GET]", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new NextResponse(errorMessage, { status: 500 });
  }
}
