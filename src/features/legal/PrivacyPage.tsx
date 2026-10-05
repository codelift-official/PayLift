// TODO: Lawyer review before sale
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Effective Date: October 4, 2026 | Last Updated: October 4, 2026
          </p>
        </header>

        <article className="prose max-w-none text-sm space-y-6 leading-relaxed" style={{ color: 'var(--text-primary)' }}>
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold">1. Data We Collect</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Billify Technologies Private Limited (&quot;Billify&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to protecting the privacy
              of business owners, retail operators, staff, and end consumers. In the course of providing our point-of-sale and
              cloud retail management platform, we collect information in three categories:
            </p>
            <ul className="list-disc pl-5 space-y-1" style={{ color: 'var(--text-muted)' }}>
              <li>
                <strong>Merchant Account Information:</strong> Name of business entity, store address, GSTIN, business category,
                registered owner name, email address, mobile number, and password hashes collected upon sign-up or profile update.
              </li>
              <li>
                <strong>Retail Transaction and Operational Data:</strong> Customer contact phone numbers or names input during checkout,
                line items, sale prices, applicable GST percentages, discounts, payment modes (Cash, UPI, Card), return histories,
                and hardware printer identifier profiles.
              </li>
              <li>
                <strong>Technical and Usage Metrics:</strong> Device IP addresses, browser types, terminal operating system versions,
                session timestamps, error logs, and navigation telemetry collected automatically to maintain system security and uptime.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold">2. How We Use Your Data</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              We process personal and operational data strictly for genuine business purposes under lawful bases, including:
            </p>
            <ul className="list-disc pl-5 space-y-1" style={{ color: 'var(--text-muted)' }}>
              <li>Delivering POS terminal functionalities, item barcode lookup, rapid bill generation, and receipt printing.</li>
              <li>Transmitting digital invoice copies, payment confirmations, and return updates via SMS or WhatsApp Cloud API when authorized.</li>
              <li>Compiling merchant-accessible financial statements, GST compliance summaries, and sales analytics reports.</li>
              <li>Verifying account identity, processing subscription renewals, and preventing unauthorized login attempts.</li>
              <li>Complying with legal duties under the Indian Information Technology Act, 2000, and rules framed thereunder.</li>
            </ul>
            <p style={{ color: 'var(--text-muted)' }}>
              We do NOT sell, lease, or monetize your retail transaction records, product margins, or customer contact directories
              to third-party advertising networks, market aggregators, or brokers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold">3. Data Storage and Security</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              All merchant database entries and application assets are hosted in secure, enterprise-grade cloud facilities located
              within the Republic of India (utilizing ISO 27001, SOC 2 Type II certified cloud infrastructure). Data in transit is
              strictly encrypted using Transport Layer Security (TLS 1.3/HTTPS). Data at rest, including database backups, is safeguarded
              using AES-256 bit encryption. Access to production databases is restricted to authorized platform engineers through
              bastion access controls with mandatory multi-factor authentication and immutable audit logging.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold">4. Third-Party Sharing and Disclosures</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              We share data only with vetted third-party service providers essential for delivering the Service:
            </p>
            <ul className="list-disc pl-5 space-y-1" style={{ color: 'var(--text-muted)' }}>
              <li><strong>Payment Gateways:</strong> RBI-authorized payment aggregators (e.g. Razorpay, Cashfree) for recurring subscription billing.</li>
              <li><strong>Messaging Gateways:</strong> Meta Platforms, Inc. (WhatsApp Business Cloud API) and telecom SMS gateways for sending digital receipts.</li>
              <li><strong>Cloud Infrastructure:</strong> Cloudflare and AWS data centers for edge routing, hosting, and secure data storage.</li>
              <li><strong>Statutory Authorities:</strong> Indian law enforcement, tax authorities, or regulatory bodies when required under applicable law, court order, or formal summons.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold">5. Data Retention Policies</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              We retain merchant transaction logs, invoice histories, and customer directories for as long as your tenant subscription
              remains active. Because retail merchants in India are legally mandated to retain books of accounts and GST tax invoices
              for a statutory period of six (6) years under the Central Goods and Services Tax Act, 2017, Billify maintains your
              billing records during your active subscription to support statutory compliance. If an account is cancelled or terminated,
              we retain the data in an encrypted backup state for sixty (60) days, after which it is permanently purged, unless longer
              retention is required by law.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold">6. User Rights and Data Portability</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              In accordance with the Digital Personal Data Protection Act, 2023 (DPDP Act) and international data privacy norms,
              merchants and data principals enjoy the following rights:
            </p>
            <ul className="list-disc pl-5 space-y-1" style={{ color: 'var(--text-muted)' }}>
              <li><strong>Right of Access & Portability:</strong> You can download a complete JSON/CSV database export of all bills, products, and customer directories via Account Settings.</li>
              <li><strong>Right to Rectification:</strong> You can correct or update personal and store profile details directly through your settings panel.</li>
              <li><strong>Right to Erasure:</strong> Following account closure, you may submit a verified written request to delete all non-statutory records.</li>
              <li><strong>Right to Withdraw Consent:</strong> You may toggle off optional features, such as automated WhatsApp receipts or SMS alerts, at any time.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold">7. Cookies and Tracking Technologies</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Billify uses essential cookies and local browser storage (such as Web Storage API and IndexedDB) solely to preserve
              your authenticated session, remember active shop selection, and cache offline POS catalog data for rapid barcode
              scanning. We do not place third-party cross-site advertising cookies or behavioral tracking pixels within our authenticated
              application environment. You may clear your browser cookies and local storage at any time through your browser settings,
              though doing so will log you out of your terminal session.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold">8. Protection of Children&apos;s Privacy</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Our Service is exclusively designed for commercial enterprises, retail shop owners, and professional operators aged
              eighteen (18) years or older. We do not knowingly solicit or collect personal information from minors under the age of
              eighteen. If we become aware that personal information relating to a child has been inadvertently gathered, we will take
              immediate steps to delete such records from our database servers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold">9. Amendments to this Privacy Policy</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              We may update this Privacy Policy from time to time to reflect modifications in our software architecture, regulatory
              statutes, or industry practices. Whenever revisions occur, we will update the &quot;Last Updated&quot; date at the top of this
              document. For significant changes that alter how we handle your personal data, we will provide prominent notice through
              a dashboard banner or email dispatch at least fifteen (15) days prior to implementation.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold">10. Contact Information and Grievance Officer</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              In accordance with the Information Technology Act, 2000, and the Digital Personal Data Protection Act, 2023, the details
              of our appointed Grievance Officer for privacy and data protection matters are provided below:
            </p>
            <div className="p-4 rounded-lg border text-xs sm:text-sm font-mono space-y-1" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
              <p><strong>Grievance Officer:</strong> Mr. Alok Deshmukh</p>
              <p><strong>Entity:</strong> Billify Technologies Private Limited</p>
              <p><strong>Address:</strong> Baner Business Park, Pune, Maharashtra 411045, India</p>
              <p><strong>Email:</strong> privacy@billify.app | grievance@billify.app</p>
              <p><strong>Response Turnaround:</strong> Within 48 hours for acknowledgment; resolution within 30 days.</p>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
};
