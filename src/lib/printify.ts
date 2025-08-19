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

export async function getProducts() {
  if (!process.env.PRINTIFY_API_TOKEN) {
    throw new Error("Printify API token is not configured.");
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

  const data = await response.json();
  return data;
}
