// TODO: Lawyer review before sale
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const RefundPolicyPage: React.FC = () => {
  return (
    <div
      className="min-h-screen p-4 sm:p-8"
      style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <Link
          to="/"
          className="inline-flex items-center text-xs font-semibold hover:text-primary transition-colors mb-2"
          style={{ color: 'var(--text-muted)' }}
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Home
        </Link>

        <header className="border-b pb-4" style={{ borderColor: 'var(--bg-border)' }}>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Refund &amp; Cancellation Policy</h1>
          <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Effective Date: October 4, 2026 | Last Updated: October 4, 2026
          </p>
        </header>

        <article className="prose max-w-none text-sm space-y-6 leading-relaxed" style={{ color: 'var(--text-primary)' }}>
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold">1. Overview and Free Trial Evaluation Guarantee</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Billify Technologies Private Limited (&quot;Billify&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) provides a cloud-native point-of-sale,
              inventory management, and retail billing platform delivered as Software-as-a-Service (SaaS). We want every retail
              merchant to be completely confident in our solution before spending a single rupee. To ensure complete satisfaction,
              Billify offers an unhindered 14-day free trial on all standard subscription plans. During this 14-day trial period,
              merchants have full access to create bills, configure bluetooth thermal printers, test barcode scanning, and explore
              sales analytics without any upfront credit card commitment or setup charge.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold">2. Subscription Cancellation Rules</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              You may cancel your recurring Billify subscription at any time without penalty or cancellation fees. Cancellation can
              be initiated directly through the Account settings section of your tenant dashboard or by emailing a cancellation
              request to billing@billify.app from your registered owner email address.
            </p>
            <ul className="list-disc pl-5 space-y-1" style={{ color: 'var(--text-muted)' }}>
              <li>
                <strong>Monthly Subscriptions:</strong> When you cancel a monthly subscription, your account remains active and fully
                functional through the end of your current monthly billing period. No further recurring charges will be placed on your
                payment instrument.
              </li>
              <li>
                <strong>Annual Subscriptions:</strong> When you cancel an annual plan, you will continue to have full access for the
                remainder of the 12-month paid term. Because annual plans receive substantial discounts compared to monthly billing,
                prorated refunds for unused months are not provided except under the statutory eligibility window outlined below.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold">3. Eligibility Window for Refunds</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Due to the immediate provisioning of cloud infrastructure and our commitment to a risk-free 14-day evaluation trial,
              recurring subscription payments are generally non-refundable once processed. However, we maintain a fair customer policy
              and recognize legitimate exceptional circumstances. A refund request will be considered eligible if:
            </p>
            <ul className="list-disc pl-5 space-y-1" style={{ color: 'var(--text-muted)' }}>
              <li>
                <strong>Duplicate Charges:</strong> You were billed more than once for the same subscription period due to a payment
                gateway communication failure or technical network timeout.
              </li>
              <li>
                <strong>Billing Errors:</strong> You were charged an incorrect subscription amount differing from the published tier
                pricing agreed during checkout.
              </li>
              <li>
                <strong>First-Time Annual Plan 7-Day Window:</strong> If you upgrade to an annual plan for the first time and submit a
                written refund request within seven (7) calendar days of the initial annual charge, you will receive a full refund minus
                standard payment gateway transaction processing fees (typically 2% + GST).
              </li>
              <li>
                <strong>Prolonged Service Outage:</strong> In the extraordinary event that Billify core billing servers experience an
                unscheduled continuous outage exceeding seventy-two (72) consecutive hours attributable solely to our core infrastructure,
                affected merchants are entitled to a prorated credit or refund for that billing month.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold">4. Refund Request Process &amp; Verification</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              To ensure secure processing and prevent fraudulent charge claims, all refund requests must follow this step-by-step
              verification procedure:
            </p>
            <ol className="list-decimal pl-5 space-y-1.5" style={{ color: 'var(--text-muted)' }}>
              <li>
                Send an email from your registered account owner address to <strong>billing@billify.app</strong> with the subject line
                &quot;Refund Request – [Your Business Name / Tenant Slug]&quot;.
              </li>
              <li>
                Include the transaction reference number, invoice date, amount charged, and the specific reason for requesting a refund.
                In cases of duplicate charges, attach bank or card statements showing both debits.
              </li>
              <li>
                Our billing operations team will review your application within two (2) business days and verify payment gateway logs.
              </li>
              <li>
                Upon approval, refunds are remitted strictly to the original source payment instrument (credit card, debit card, UPI ID,
                or net banking account) through our payment gateway partner (e.g. Razorpay/Cashfree). In accordance with Reserve Bank
                of India (RBI) guidelines, refunds typically reflect in your bank account within five to seven (5–7) business days.
              </li>
            </ol>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold">5. Non-Refundable Situations and Exceptions</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Refunds will NOT be granted under the following circumstances:
            </p>
            <ul className="list-disc pl-5 space-y-1" style={{ color: 'var(--text-muted)' }}>
              <li>Requests submitted after the expiration of the 7-day initial annual upgrade window.</li>
              <li>Ordinary monthly renewals where the merchant forgot to cancel prior to the automatic renewal date.</li>
              <li>Third-party hardware incompatibility (e.g., non-standard ESC/POS printers not adhering to Bluetooth SPP standards).</li>
              <li>Suspension or termination of an account resulting from a violation of our Terms of Service or fraudulent activity.</li>
              <li>Local internet connectivity interruptions, mobile carrier outages, or power failures at the merchant store location.</li>
              <li>Third-party service fees, such as Meta WhatsApp Business conversation message fees or SMS gateway credits consumed.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold">6. Chargebacks and Dispute Resolution</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              We strongly encourage merchants to contact our dedicated billing support desk prior to initiating a bank chargeback or
              payment dispute. Chargebacks incur substantial administrative bank penalties and cause immediate automated suspension
              of your cloud terminal until the dispute investigation concludes. In virtually all cases, our billing team can resolve
              genuine payment discrepancies directly within 48 hours without causing disruption to your daily retail store operations.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold">7. Contact Information for Billing Support</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              For any billing inquiries, invoice clarifications, or refund requests, please contact our billing helpdesk:
            </p>
            <div className="p-4 rounded-lg border text-xs sm:text-sm font-mono space-y-1" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
              <p><strong>Billify Technologies Private Limited</strong></p>
              <p>Attn: Billing &amp; Finance Operations</p>
              <p>Baner Business Park, Pune, Maharashtra 411045, India</p>
              <p>Email: billing@billify.app | codelift.official@gmail.com</p>
              <p>Telephone: +91 20 6789 0124 (Mon–Fri, 9:30 AM – 6:00 PM IST)</p>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
};
