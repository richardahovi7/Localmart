import Link from 'next/link'

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-green-50 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-green-800 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: August 2026</p>

        <div className="prose prose-sm max-w-none text-gray-700 space-y-6">
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">1. Introduction</h2>
            <p>
              LocalMart ("we", "us", "our") operates an online marketplace connecting buyers with local
              sellers in Ghana. This Privacy Policy explains how we collect, use, and protect your
              information when you use our platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">2. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Account information: name, email address, phone number, password</li>
              <li>Order information: delivery address, order history, payment method selected</li>
              <li>Seller information: business name, description, location, product listings</li>
              <li>Usage data: pages visited, searches performed, device and browser information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To process and fulfill your orders</li>
              <li>To communicate order updates and delivery notifications</li>
              <li>To connect buyers with sellers and facilitate transactions</li>
              <li>To improve our platform and personalize your experience</li>
              <li>To detect and prevent fraud or misuse of the platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">4. Payment Information</h2>
            <p>
              Payments are processed through Paystack, a third-party payment processor. LocalMart does
              not store your card or mobile money credentials. Please refer to Paystack's own privacy
              policy for details on how they handle payment data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">5. Sharing Your Information</h2>
            <p>
              We share order and delivery details with the relevant seller(s) so they can fulfill your
              order. We do not sell your personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">6. Data Security</h2>
            <p>
              We take reasonable technical and organizational measures to protect your information.
              However, no method of transmission over the internet is completely secure, and we cannot
              guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">7. Your Rights</h2>
            <p>
              You may access, update, or request deletion of your account information at any time by
              contacting us through our Help Center.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">8. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Continued use of LocalMart after
              changes are posted constitutes acceptance of the revised policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">9. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please visit our{' '}
              <Link href="/help" className="text-green-700 hover:underline">Help Center</Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}