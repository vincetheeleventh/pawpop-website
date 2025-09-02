import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | PawPop Art',
  description: 'Learn how PawPop Art collects, uses, and protects your personal information when you use our custom pet portrait services.',
};

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
      <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
      
      <div className="prose prose-lg max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
          <p className="mb-4">
            When you use PawPop Art services, we collect the following types of information:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Personal Information:</strong> Name, email address, phone number, and billing address when you place an order.</li>
            <li><strong>Pet Photos:</strong> Images you upload for creating custom pet portraits.</li>
            <li><strong>Payment Information:</strong> Credit card details processed securely through Stripe (we do not store payment information).</li>
            <li><strong>Usage Data:</strong> Information about how you interact with our website, including IP address, browser type, and pages visited.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
          <p className="mb-4">We use your information to:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Process and fulfill your custom pet portrait orders</li>
            <li>Communicate with you about your order status and delivery</li>
            <li>Provide customer support and respond to inquiries</li>
            <li>Improve our services and website functionality</li>
            <li>Send promotional emails (with your consent)</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Information Sharing</h2>
          <p className="mb-4">
            We do not sell, trade, or rent your personal information to third parties. We may share your information with:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Service Providers:</strong> Stripe for payment processing, Printify for order fulfillment</li>
            <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
            <li><strong>Business Transfers:</strong> In the event of a merger or acquisition</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
          <p className="mb-4">
            We implement appropriate security measures to protect your personal information against unauthorized access, 
            alteration, disclosure, or destruction. This includes:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>SSL encryption for data transmission</li>
            <li>Secure servers and databases</li>
            <li>Regular security audits and updates</li>
            <li>Limited access to personal information by authorized personnel only</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Your Rights</h2>
          <p className="mb-4">You have the right to:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Access and review your personal information</li>
            <li>Request corrections to inaccurate information</li>
            <li>Request deletion of your personal information</li>
            <li>Opt-out of marketing communications</li>
            <li>Data portability (receive a copy of your data)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Cookies and Tracking</h2>
          <p className="mb-4">
            Our website uses cookies and similar technologies to enhance your experience. These help us:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Remember your preferences and settings</li>
            <li>Analyze website traffic and usage patterns</li>
            <li>Provide personalized content and advertisements</li>
          </ul>
          <p className="mb-4">
            You can control cookie settings through your browser preferences.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Children's Privacy</h2>
          <p className="mb-4">
            Our services are not intended for children under 13 years of age. We do not knowingly collect 
            personal information from children under 13.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. International Users</h2>
          <p className="mb-4">
            If you are accessing our services from outside the United States, please note that your information 
            may be transferred to and processed in the United States.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Changes to This Policy</h2>
          <p className="mb-4">
            We may update this privacy policy from time to time. We will notify you of any changes by posting 
            the new policy on this page and updating the "Last updated" date.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
          <p className="mb-4">
            If you have any questions about this Privacy Policy, please contact us:
          </p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p><strong>Email:</strong> pawpopart@gmail.com</p>
            <p><strong>Address:</strong> 2006-1323 Homer St, Vancouver BC Canada V6B 5T1</p>
            <p><strong>Phone:</strong> +1 604 499 7660</p>
          </div>
        </section>
      </div>
    </div>
  );
}
