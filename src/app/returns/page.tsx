import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Return & Refund Policy | PawPop Art',
  description: 'Learn about PawPop Art return and refund policy for custom pet portraits and prints.',
};

export default function ReturnPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Return & Refund Policy</h1>
      <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
      
      <div className="prose prose-lg max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Digital Products</h2>
          <p className="mb-4">
            <strong>No Returns:</strong> Due to the custom and digital nature of our artwork, digital downloads 
            are non-returnable once delivered. All sales are final.
          </p>
          <p className="mb-4">
            <strong>Quality Guarantee:</strong> If you're not satisfied with the quality of your digital artwork, 
            please contact us within 7 days of delivery. We'll work with you to make reasonable adjustments or 
            provide a full refund if we cannot meet your expectations.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Physical Products</h2>
          <p className="mb-4">
            <strong>Defective Items:</strong> We will replace or refund any physical products that arrive damaged, 
            defective, or significantly different from what was ordered.
          </p>
          <p className="mb-4">
            <strong>Return Window:</strong> You must report any issues within 30 days of delivery.
          </p>
          <p className="mb-4">
            <strong>Return Process:</strong>
          </p>
          <ol className="list-decimal pl-6 mb-4">
            <li>Contact our support team at returns@pawpop.art</li>
            <li>Provide your order number and photos of the issue</li>
            <li>We'll provide a prepaid return label if applicable</li>
            <li>Send the item back in original packaging</li>
            <li>Refund or replacement will be processed within 5-7 business days</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Refund Eligibility</h2>
          <p className="mb-4">You may be eligible for a refund if:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>We cannot deliver your order within the promised timeframe</li>
            <li>The final artwork significantly differs from your reasonable expectations</li>
            <li>Your physical product arrives damaged or defective</li>
            <li>We determine that your source photo is unsuitable for quality artwork creation</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Non-Refundable Situations</h2>
          <p className="mb-4">Refunds will not be provided for:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Change of mind after artwork creation has begun</li>
            <li>Dissatisfaction with artistic interpretation (within reasonable quality standards)</li>
            <li>Customer-provided photos that are low quality or unsuitable</li>
            <li>Delays caused by customer unresponsiveness</li>
            <li>Physical products damaged due to customer mishandling</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Refund Processing</h2>
          <p className="mb-4">
            <strong>Timeline:</strong> Approved refunds will be processed within 5-7 business days.
          </p>
          <p className="mb-4">
            <strong>Method:</strong> Refunds will be issued to the original payment method used for the purchase.
          </p>
          <p className="mb-4">
            <strong>Partial Refunds:</strong> In some cases, we may offer partial refunds for orders that have 
            been partially completed or where minor issues can be resolved.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Shipping Costs</h2>
          <p className="mb-4">
            <strong>Original Shipping:</strong> Non-refundable unless the return is due to our error.
          </p>
          <p className="mb-4">
            <strong>Return Shipping:</strong> We'll provide prepaid return labels for defective or incorrect items.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Exchanges</h2>
          <p className="mb-4">
            We don't offer direct exchanges. If you need a different size or format, please:
          </p>
          <ol className="list-decimal pl-6 mb-4">
            <li>Request a return/refund for the original item</li>
            <li>Place a new order for your preferred option</li>
            <li>We'll prioritize processing your new order</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Quality Assurance</h2>
          <p className="mb-4">
            Before delivery, all artwork goes through our quality control process. We may:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Request additional or higher quality photos</li>
            <li>Provide preview images for your approval</li>
            <li>Suggest alternative approaches for better results</li>
            <li>Decline orders that cannot meet our quality standards (with full refund)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Cancellations</h2>
          <p className="mb-4">
            <strong>Before Production:</strong> Full refund available if you cancel before artwork creation begins.
          </p>
          <p className="mb-4">
            <strong>During Production:</strong> Partial refund may be available depending on completion status.
          </p>
          <p className="mb-4">
            <strong>After Completion:</strong> No refunds for completed digital artwork unless quality issues exist.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
          <p className="mb-4">
            For returns, refunds, or questions about this policy:
          </p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p><strong>Email:</strong> returns@pawpop.art</p>
            <p><strong>Support:</strong> hello@pawpop.art</p>
            <p><strong>Phone:</strong> +1-555-PAWPOP1</p>
            <p><strong>Hours:</strong> Monday-Friday, 9 AM - 6 PM PST</p>
          </div>
          <p className="mt-4">
            Please include your order number and detailed description of the issue when contacting us.
          </p>
        </section>
      </div>
    </div>
  );
}
