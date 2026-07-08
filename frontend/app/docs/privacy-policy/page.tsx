import { DocsPage, DocsBody } from "fumadocs-ui/page"

export default function PrivacyPolicyPage() {
  const toc = [
    { title: "Introduction", url: "#introduction", depth: 2 },
    { title: "Data We Collect", url: "#collection", depth: 2 },
    { title: "How We Use Data", url: "#usage", depth: 2 },
    { title: "Data Security", url: "#security", depth: 2 },
    { title: "Your Rights", url: "#rights", depth: 2 },
    { title: "Contact Us", url: "#contact", depth: 2 },
  ]

  return (
    <DocsPage toc={toc}>
      <DocsBody>
        <div className="space-y-3">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl" id="overview">
            Privacy Policy
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            Last Updated: July 8, 2026. This Privacy Policy details how VidyaSchool collects, utilizes, protects, and governs personal information for students, educators, and guardians.
          </p>
        </div>

        <section className="space-y-4 pt-6">
          <h2 className="text-xl font-bold text-foreground" id="introduction">1. Introduction</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Welcome to VidyaSchool ("we", "us", "our"). We are committed to safeguarding the privacy and security of our portal users. This policy governs data collected through the portal, mobile apps, and school databases.
          </p>
        </section>

        <section className="space-y-4 pt-6">
          <h2 className="text-xl font-bold text-foreground" id="collection">2. Data We Collect</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            To provide efficient academic workflows, we gather the following personal identifiers:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
            <li><strong>Profiles:</strong> Full names, profile pictures, institutional emails, secure credentials, and preferred platform roles.</li>
            <li><strong>Academics:</strong> Grade level, section allocations, exam marks, classes rosters, and report card remarks.</li>
            <li><strong>Emergency Contacts:</strong> Parent or guardian names, verified phone numbers, and physical residential addresses.</li>
            <li><strong>Commute Coordinates:</strong> Selected transit modes (Walking vs Transport) and transport route zones.</li>
          </ul>
        </section>

        <section className="space-y-4 pt-6">
          <h2 className="text-xl font-bold text-foreground" id="usage">3. How We Use Data</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Collected data is restricted solely to institutional academic administration:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
            <li>Managing classroom registers and verifying student onboarding.</li>
            <li>Generating tuition fee ledgers and issuing transaction receipts.</li>
            <li>Routing transportation school buses based on pincodes.</li>
            <li>Delivering real-time complaint updates and notices notifications.</li>
          </ul>
        </section>

        <section className="space-y-4 pt-6">
          <h2 className="text-xl font-bold text-foreground" id="security">4. Data Security</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            VidyaSchool employs industry-standard encryption protocols (SSL/TLS) for data transmission. Access to database ledgers is governed strictly by Role-Based Access Control (RBAC), restricting student profile visibility only to verified educators and administrators.
          </p>
        </section>

        <section className="space-y-4 pt-6">
          <h2 className="text-xl font-bold text-foreground" id="rights">5. Your Rights</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Students and guardians retain the right to audit profile records, request correction of grades (via class teacher tickets), or modify commuter preferences. Administrative access is required to purge student account profiles permanently.
          </p>
        </section>

        <section className="space-y-4 pt-6">
          <h2 className="text-xl font-bold text-foreground" id="contact">6. Contact Us</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            For privacy inquiries or data auditing concerns, please file a support ticket directly through the portal helpdesk or contact the registrar office at: <code className="text-xs bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">privacy@vidyaschool.edu</code>.
          </p>
        </section>
      </DocsBody>
    </DocsPage>
  )
}
