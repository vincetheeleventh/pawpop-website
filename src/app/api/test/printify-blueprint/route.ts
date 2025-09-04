import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    if (!process.env.PRINTIFY_API_TOKEN) {
      return NextResponse.json({ error: "Printify API token not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const blueprintId = searchParams.get('id') || '944'; // Default to canvas blueprint

    console.log(`📋 Fetching Printify blueprint ${blueprintId}...`);

    // First get blueprint info
    const blueprintResponse = await fetch(`https://api.printify.com/v1/catalog/blueprints/${blueprintId}.json`, {
      headers: {
        "Authorization": `Bearer ${process.env.PRINTIFY_API_TOKEN}`,
        "Content-Type": "application/json"
      }
    });

    if (!blueprintResponse.ok) {
      const errorText = await blueprintResponse.text();
      console.error("Printify blueprint fetch error:", {
        status: blueprintResponse.status,
        statusText: blueprintResponse.statusText,
        body: errorText
      });
      return NextResponse.json({ 
        error: `Failed to fetch blueprint: ${blueprintResponse.status}`,
        details: errorText 
      }, { status: blueprintResponse.status });
    }

    const blueprintData = await blueprintResponse.json();

    // Get print providers for this blueprint
    const providersResponse = await fetch(`https://api.printify.com/v1/catalog/blueprints/${blueprintId}/print_providers.json`, {
      headers: {
        "Authorization": `Bearer ${process.env.PRINTIFY_API_TOKEN}`,
        "Content-Type": "application/json"
      }
    });

    let printProviders = [];
    if (providersResponse.ok) {
      printProviders = await providersResponse.json();
    }

    // Get variants for the first print provider
    let variants = [];
    if (printProviders.length > 0) {
      const providerId = printProviders[0].id;
      const variantsResponse = await fetch(`https://api.printify.com/v1/catalog/blueprints/${blueprintId}/print_providers/${providerId}/variants.json`, {
        headers: {
          "Authorization": `Bearer ${process.env.PRINTIFY_API_TOKEN}`,
          "Content-Type": "application/json"
        }
      });

      if (variantsResponse.ok) {
        variants = await variantsResponse.json();
      }
    }

    console.log(`✅ Blueprint ${blueprintId} fetched successfully`);

    return NextResponse.json({
      success: true,
      blueprint: blueprintData,
      print_providers: printProviders,
      variants: variants
    });

  } catch (error) {
    console.error("Error fetching Printify blueprint:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
