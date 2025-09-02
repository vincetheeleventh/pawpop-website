// src/lib/printify.ts

const PRINTIFY_API_URL = "https://api.printify.com/v1";

interface PrintifyErrorResponse {
  status: string;
  code: number;
  message: string;
  errors: {
    reason: string;
    message: string;
  };
}

export interface Blueprint {
  id: number;
  title: string;
  brand: string;
  images: string[];
  description: string;
  tags: string[];
}

export interface PaginatedBlueprints {
  data: Blueprint[];
  current_page: number;
  per_page: number;
  total: number;
}

export async function getProducts(): Promise<PaginatedBlueprints> {
  if (!process.env.PRINTIFY_API_TOKEN) {
    console.warn("Printify API token is not configured. Returning empty products list.");
    return {
      data: [],
      current_page: 1,
      per_page: 0,
      total: 0
    };
  }

  const response = await fetch(`${PRINTIFY_API_URL}/catalog/blueprints.json`, {
    headers: {
      "Authorization": `Bearer ${process.env.PRINTIFY_API_TOKEN}`,
    },
    next: { revalidate: 3600 } // Revalidate every hour
  });

  if (!response.ok) {
    const errorData: PrintifyErrorResponse = await response.json();
    console.error("Printify API Error:", errorData);
    throw new Error(`Failed to fetch products: ${errorData.message}`);
  }

  const blueprints = await response.json();
  
  // Transform the Printify API response to match our expected structure
  const transformedData: Blueprint[] = blueprints.map((bp: any) => ({
    id: bp.id,
    title: bp.title,
    brand: bp.brand,
    description: bp.description || '',
    images: bp.images?.map((img: any) => img.url) || [],
    tags: bp.tags || []
  }));

  return {
    data: transformedData,
    current_page: 1,
    per_page: transformedData.length,
    total: transformedData.length
  };
}
