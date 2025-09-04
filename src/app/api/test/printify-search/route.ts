import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    if (!process.env.PRINTIFY_API_TOKEN) {
      return NextResponse.json({ error: "Printify API token not configured" }, { status: 500 });
    }

    console.log('🔍 Searching for canvas blueprints...');

    // Get all blueprints
    const blueprintsResponse = await fetch('https://api.printify.com/v1/catalog/blueprints.json', {
      headers: {
        "Authorization": `Bearer ${process.env.PRINTIFY_API_TOKEN}`,
        "Content-Type": "application/json"
      }
    });

    if (!blueprintsResponse.ok) {
      const errorText = await blueprintsResponse.text();
      console.error("Printify blueprints fetch error:", errorText);
      return NextResponse.json({ 
        error: `Failed to fetch blueprints: ${blueprintsResponse.status}`,
        details: errorText 
      }, { status: blueprintsResponse.status });
    }

    const blueprintsData = await blueprintsResponse.json();
    const blueprints = blueprintsData.data || [];

    // Filter for canvas/poster blueprints
    const canvasBlueprints = blueprints.filter((bp: any) => {
      const title = bp.title.toLowerCase();
      return title.includes('canvas') || title.includes('poster') || title.includes('print');
    });

    console.log(`✅ Found ${canvasBlueprints.length} canvas/poster blueprints`);

    // For each canvas blueprint, check if it has the sizes we need
    const targetSizes = ['12x18', '18x24', '20x30'];
    const blueprintDetails = [];

    for (const blueprint of canvasBlueprints.slice(0, 5)) { // Check first 5 to avoid too many API calls
      try {
        // Get print providers for this blueprint
        const providersResponse = await fetch(`https://api.printify.com/v1/catalog/blueprints/${blueprint.id}/print_providers.json`, {
          headers: {
            "Authorization": `Bearer ${process.env.PRINTIFY_API_TOKEN}`,
            "Content-Type": "application/json"
          }
        });

        if (providersResponse.ok) {
          const providers = await providersResponse.json();
          if (providers.length > 0) {
            // Get variants for first provider
            const variantsResponse = await fetch(`https://api.printify.com/v1/catalog/blueprints/${blueprint.id}/print_providers/${providers[0].id}/variants.json`, {
              headers: {
                "Authorization": `Bearer ${process.env.PRINTIFY_API_TOKEN}`,
                "Content-Type": "application/json"
              }
            });

            if (variantsResponse.ok) {
              const variantsData = await variantsResponse.json();
              const variants = variantsData.variants || [];
              
              // Check if this blueprint has our target sizes
              const foundSizes = [];
              for (const variant of variants) {
                const title = variant.title || '';
                for (const targetSize of targetSizes) {
                  const [w, h] = targetSize.split('x');
                  if ((title.includes(`${w}"`) && title.includes(`${h}"`)) || 
                      (title.includes(`${h}"`) && title.includes(`${w}"`))) {
                    foundSizes.push({
                      size: targetSize,
                      variantId: variant.id,
                      title: title
                    });
                  }
                }
              }

              blueprintDetails.push({
                id: blueprint.id,
                title: blueprint.title,
                foundSizes: foundSizes,
                totalVariants: variants.length
              });
            }
          }
        }
      } catch (error) {
        console.error(`Error checking blueprint ${blueprint.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      totalBlueprints: blueprints.length,
      canvasBlueprints: canvasBlueprints.length,
      checkedBlueprints: blueprintDetails
    });

  } catch (error) {
    console.error("Error searching Printify blueprints:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
