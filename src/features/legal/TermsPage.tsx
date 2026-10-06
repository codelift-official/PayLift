// TODO: Lawyer review before sale
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const TermsPage: React.FC = () => {
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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Terms of Service</h1>
          <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Effective Date: October 4, 2026 | Last Updated: October 4, 2026
          </p>
        </header>

        <article className="prose max-w-none text-sm space-y-6 leading-relaxed" style={{ color: 'var(--text-primary)' }}>
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold">1. Acceptance of Terms</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              These Terms of Service (&quot;Terms&quot;) constitute a legally binding agreement between Sahayak Technologies
              Private Limited (&quot;Sahayak&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) and the individual or legal entity
              (&quot;Subscriber&quot;, &quot;Merchant&quot;, &quot;User&quot;, or &quot;you&quot;) registering for, accessing, or utilizing our
              point-of-sale software, cloud applications, hardware integration utilities, and related services
              (collectively, the &quot;Service&quot;). By creating an account, accessing our cloud POS, installing our application,
              or using any features of Sahayak, you represent that you have read, understood, and agreed to be bound by
              these Terms, as well as our Privacy Policy and Refund Policy. If you are entering into these Terms on behalf of a
              business, shop, or company, you represent that you hold the legal authority to bind that entity to these Terms.
              If you do not agree with any provision of these Terms, you must discontinue all use of the Service immediately.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold">2. License and Scope of Use</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Subject to your ongoing compliance with these Terms and timely payment of applicable subscription dues, Sahayak
              grants you a limited, non-exclusive, non-transferable, revocable license to access and use the Service strictly
              for your internal retail, billing, and inventory management operations. You shall not: (a) sub-license, resell,
              rent, lease, or distribute the Service to any third party; (b) reverse engineer, decompile, or disassemble any
              software components powering the Service; (c) attempt to circumvent any security controls, licensing throttles,
              shop quotas, or access permissions; (d) use the Service to store or transmit any unlawful, fraudulent, defamatory,
              or malicious materials; or (e) utilize automated scrapers or bots to query our application servers. Any unauthorized
              use immediately terminates the license granted herein.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold">3. Account Registration and Security</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              To access the Service, you must register a business tenant account by providing authentic, complete, and current
              details including your business legal name, owner email address, mobile phone number, and Goods and Services Tax
              Identification Number (GSTIN) where applicable. You are responsible for safeguarding the confidentiality of your
              login credentials, passwords, and multi-factor authentication tokens. You agree to assume responsibility for all
              activities and transactions executed under your tenant account, including actions performed by staff members or
              store managers to whom you grant role-based access. In the event of any unauthorized credential access or security
              breach, you must notify Sahayak support within twelve (12) hours of discovery.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold">4. Fees, Invoicing, and Payment</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Access to Sahayak is provided on a recurring subscription basis according to the tier (such as Starter, Pro, or
              Enterprise) and billing frequency (monthly or annually) selected during checkout. All listed prices are in Indian
              Rupees (INR) and exclude applicable Goods and Services Tax (GST), which will be charged in accordance with Indian tax
              statutes. Subscription fees are billed in advance on the first day of each billing cycle. You authorize Sahayak and its
              designated payment gateway partners to automatically charge your registered payment instrument (credit card, debit card,
              UPI, or net banking) for recurring charges. In the event of a payment default, we reserve the right to initiate a grace
              period or temporarily suspend POS terminals until full settlement is recorded.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold">5. Refund Policy Summary</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Sahayak provides a 14-day free trial period during which you may thoroughly evaluate the features and compatibility
              of our cloud POS and receipt printers prior to committing to a paid tier. In accordance with our Refund & Cancellation
              Policy, recurring software subscription payments are non-refundable once processed. In the case of documented duplicate
              transactions or proven technical billing errors, written requests submitted within seven (7) days will be reviewed by
              our billing team. For full details on dispute procedures, please review our separate Refund & Cancellation Policy.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold">6. Merchant Data and Customer Data</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              As between Sahayak and the Subscriber, you retain complete ownership of all merchant business records, product
              catalogs, inventory counts, retail customer contact directories, sales history, and tax records created or stored
              in your tenant database (&quot;Merchant Data&quot;). You grant Sahayak a limited, worldwide license to host, copy, transmit,
              and display Merchant Data solely to the extent necessary to provide, optimize, and maintain the Service. You are solely
              responsible for the accuracy, legality, and compliance of your customer transactions with the Indian Information
              Technology Act, 2000, and the Digital Personal Data Protection Act, 2023. Sahayak implements industry-standard encryption
              and enables on-demand full database archive export via your Account settings.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold">7. Intellectual Property Rights</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              All software programs, frontend interfaces, source code, visual designs, database architectures, trademarks, logos,
              documentation, and proprietary algorithms associated with Sahayak are the exclusive intellectual property of Sahayak
              Technologies Private Limited and its licensors. Nothing in these Terms transfers any title, ownership, or intellectual
              property rights to you, except for the limited revocable license expressly set forth in Section 2. You may not copy,
              modify, adapt, frame, or reproduce any part of our web application or platform administrative interfaces without prior
              written consent.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold">8. Warranties and Limitation of Liability</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              THE SERVICE IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
              IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR
              NON-INFRINGEMENT. SAHAYAK DOES NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, COMPLETELY ERROR-FREE, OR IMMUNE
              FROM THIRD-PARTY SERVICE INTERRUPTIONS (SUCH AS CLOUD OUTAGES, TELECOM FAILURES, OR META WHATSAPP DOWNTIME). TO THE
              MAXIMUM EXTENT PERMITTED BY APPLICABLE INDIAN LAW, IN NO EVENT SHALL SAHAYAK, ITS DIRECTORS, EMPLOYEES, OR AFFILIATES BE
              LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA LOSS,
              BUSINESS INTERRUPTION, OR HARDWARE INCOMPATIBILITY, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SERVICE. OUR
              AGGREGATE LIABILITY UNDER THESE TERMS SHALL NOT EXCEED THE TOTAL SUBSCRIPTION FEES ACTUALLY PAID BY YOU TO SAHAYAK IN THE
              THREE (3) MONTHS PRECEDING THE EVENT GIVING RISE TO LIABILITY.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold">9. Suspension and Termination</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              You may terminate your subscription at any time by navigating to your Account settings or by notifying support. Such
              termination will take effect at the conclusion of your current paid billing period. Sahayak reserves the right to
              suspend or terminate your account immediately without prior notice if: (a) you breach any material provision of these
              Terms; (b) you fail to pay recurring subscription fees following the expiration of any applicable grace period; (c) we
              are required to do so by applicable Indian regulatory or law enforcement bodies; or (d) your use poses a security risk
              or technical threat to our infrastructure. Upon termination, your right to use the POS terminal ceases, and we retain
              Merchant Data for a period of sixty (60) days to allow for final data export before permanent deletion.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold">10. Modifications to Terms and Service</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              We continuously improve our software and may add, adjust, or discontinue specific product features, integrations,
              or pricing structures over time. We reserve the right to revise these Terms periodically. In the event of material
              modifications, we will notify you by posting an announcement in the dashboard banner or sending an email notification
              to your registered tenant administrator address at least fifteen (15) days prior to the effective date of the new Terms.
              Your continued use of Sahayak following the effective date constitutes your affirmative acceptance of the revised Terms.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold">11. Governing Law and Dispute Resolution</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              These Terms, their interpretation, and any disputes arising out of or related to your use of the Service shall be
              governed by and construed in accordance with the substantive laws of the Republic of India, without regard to conflict
              of law principles. In the event of any claim, difference, or dispute arising between the parties, the parties agree
              to first seek amicable resolution through good-faith executive consultation within thirty (30) days. Any dispute
              that cannot be resolved amicably shall be submitted to the exclusive jurisdiction of the competent civil courts located
              in Pune/Mumbai, State of Maharashtra, India.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold">12. Contact Information and Legal Notices</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              If you have any questions, feedback, or legal notices concerning these Terms of Service, please contact our legal and
              administrative team:
            </p>
            <div className="p-4 rounded-lg border text-xs sm:text-sm font-mono space-y-1" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
              <p><strong>Sahayak Technologies Private Limited</strong></p>
              <p>Attn: Legal Affairs & Compliance</p>
              <p>Baner Business Park, Pune, Maharashtra 411045, India</p>
              <p>Email: legal@sahayak.app | codelift.official@gmail.com</p>
              <p>Telephone: +91 20 6789 0123 (Mon–Fri, 9:30 AM – 6:00 PM IST)</p>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
};
