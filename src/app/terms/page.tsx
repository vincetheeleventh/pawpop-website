import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | PawPop Art',
  description: 'Read the terms and conditions for using PawPop Art custom pet portrait services.',
};

export default function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
      <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
      
      <div className="prose prose-lg max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
          <p className="mb-4">
            By accessing and using PawPop Art services, you accept and agree to be bound by the terms and 
            provision of this agreement. If you do not agree to abide by the above, please do not use this service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Service Description</h2>
          <p className="mb-4">
            PawPop Art provides custom pet portrait creation services, transforming your pet photos into 
            pop art style digital artwork and physical prints. Our services include:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>AI-assisted artwork generation with human artist refinement</li>
            <li>Digital download delivery</li>
            <li>Physical print fulfillment through third-party partners</li>
            <li>Customer support and order management</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. User Responsibilities</h2>
          <p className="mb-4">You agree to:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Provide accurate and complete information when placing orders</li>
            <li>Upload only photos you own or have permission to use</li>
            <li>Use our services for lawful purposes only</li>
            <li>Not upload inappropriate, offensive, or copyrighted content</li>
            <li>Pay all fees associated with your orders</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Intellectual Property</h2>
          <p className="mb-4">
            <strong>Your Content:</strong> You retain ownership of the original photos you upload. By using our service, 
            you grant us a license to use your photos solely for creating your custom artwork.
          </p>
          <p className="mb-4">
            <strong>Created Artwork:</strong> Once completed and paid for, you own the rights to your custom pet portrait 
            for personal use. Commercial use requires separate licensing agreement.
          </p>
          <p className="mb-4">
            <strong>Our IP:</strong> The PawPop Art brand, website, and proprietary processes remain our intellectual property.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Payment Terms</h2>
          <ul className="list-disc pl-6 mb-4">
            <li>All payments are processed securely through Stripe</li>
            <li>Payment is required before artwork creation begins</li>
            <li>Prices are subject to change without notice</li>
            <li>All sales are final unless covered by our refund policy</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Order Process and Timeline</h2>
          <p className="mb-4">
            <strong>Digital Orders:</strong> Delivered within 3-5 business days after payment confirmation.
          </p>
          <p className="mb-4">
            <strong>Physical Prints:</strong> Production and shipping typically takes 7-14 business days.
          </p>
          <p className="mb-4">
            We will provide order updates via email. Delays may occur due to high demand or quality control requirements.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Quality Standards</h2>
          <p className="mb-4">
            We strive to deliver high-quality artwork that meets your expectations. However:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Artwork quality depends on the quality of source photos provided</li>
            <li>We may request additional photos if the original is unsuitable</li>
            <li>Minor revisions are included; major changes may incur additional fees</li>
            <li>We reserve the right to refuse orders that cannot meet quality standards</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Limitation of Liability</h2>
          <p className="mb-4">
            PawPop Art shall not be liable for any indirect, incidental, special, consequential, or punitive damages, 
            including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Prohibited Uses</h2>
          <p className="mb-4">You may not use our service:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>For any unlawful purpose or to solicit others to perform unlawful acts</li>
            <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
            <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
            <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
            <li>To submit false or misleading information</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. Termination</h2>
          <p className="mb-4">
            We may terminate or suspend your account and bar access to the service immediately, without prior notice 
            or liability, under our sole discretion, for any reason whatsoever and without limitation, including but 
            not limited to a breach of the Terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">11. Changes to Terms</h2>
          <p className="mb-4">
            We reserve the right to modify or replace these Terms at any time. If a revision is material, 
            we will provide at least 30 days notice prior to any new terms taking effect.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">12. Contact Information</h2>
          <p className="mb-4">
            Questions about the Terms of Service should be sent to us at:
          </p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p><strong>Email:</strong> hello@pawpopart.com</p>
            <p><strong>Address:</strong> 2006-1323 Homer St, Vancouver BC Canada V6B 5T1</p>
            <p><strong>Phone:</strong> +1 604 499 7660</p>
          </div>
        </section>
      </div>
    </div>
  );
}
