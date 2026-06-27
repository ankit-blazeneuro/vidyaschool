import { Badge } from "@/components/ui/badge"
import { Shield } from "lucide-react"
import { DocsPage, DocsBody } from "fumadocs-ui/page"

interface GuideArticle {
  title: string
  badge: string
  description: string
  steps?: { step: string; title: string; desc: string }[]
  details?: { title: string; body: string }[]
}

const ARTICLES: Record<string, Record<string, GuideArticle>> = {
  auth: {
    signup: {
      title: "Account Registration (Signup)",
      badge: "Authentication",
      description: "Learn how to register your profile credentials on the VidyaSchool portal and choose your preferred platform roles.",
      steps: [
        {
          step: "01",
          title: "Select preferred Role",
          desc: "Choose between 'Student' or 'Teacher' when creating your profile. Students are registered directly on submission, whereas Teachers are queued for manual administrative verification before portal activation."
        },
        {
          step: "02",
          title: "Email & Credentials",
          desc: "Provide your full name, institutional email address, and select a secure password. Ensure institutional emails are typed correctly to receive verification links."
        },
        {
          step: "03",
          title: "Social Logins (Alternative)",
          desc: "Alternatively, click Google or GitHub icons to link and sign in directly using OAuth social login channels. This automatically verifies your email profile."
        }
      ]
    },
    login: {
      title: "Portal Login Streams",
      badge: "Authentication",
      description: "Walkthrough on signing into the dashboard and accessing your designated workspace controls.",
      details: [
        {
          title: "1. Credential Login",
          body: "Input your registered email address and password on the login screen. Click Sign In to verify credentials."
        },
        {
          title: "2. Automatic Dashboard Redirects",
          body: "Upon successful authentication, the gateway redirects you to your corresponding dashboard layout:\n• Students: Redirected to `/student/[username]` dashboard.\n• Teachers: Redirected to `/teacher/[username]` workspace.\n• Accounts Clerks: Redirected to `/accounts/[username]` control panels.\n• Administrators: Redirected to `/admin/[username]` command center."
        }
      ]
    },
    approval: {
      title: "Verification & Educator Approvals",
      badge: "Authentication",
      description: "Understand the email verification cycle and administrative approval flows for teachers.",
      details: [
        {
          title: "1. Email Verification links",
          body: "Upon creating an account, an automated email verification link is transmitted. Clicking this link verifies your profile status, enabling dashboard onboarding."
        },
        {
          title: "2. Educator/Teacher Approval Waiting Room",
          body: "For security, new teacher registrations are placed in a 'pending' state. Teachers will be redirected to the Waiting Room page and cannot access classroom tools. Once an Administrator audits and approves the teacher request, access is instantly granted."
        }
      ]
    }
  },
  student: {
    onboarding: {
      title: "Student Profile Onboarding",
      badge: "Onboarding Wizard",
      description: "Complete guide on setting up your account profile, emergency coordinates, class allocations, and commuter choices to activate your portal workspace.",
      steps: [
        {
          step: "01",
          title: "Admission Number & Phone Registration",
          desc: "Input your official school-assigned admission key (e.g. 2024/STU/102). This matches your registration with the central registrar database. Submit your primary mobile number to register for automated text alert streams."
        },
        {
          step: "02",
          title: "Assigned Class Bracket & Section Setup",
          desc: "Select your active grade level and sections. This configures your dashboard feeds, class homework journals, and examination calendars. Double-check this selection as class assignments can only be changed by administrators."
        },
        {
          step: "03",
          title: "Mode of Commute selection",
          desc: "Choose between 'Walking' and 'School Transport'. Selecting School Transport links your profile to transit logs and school bus schedules. Walkers are tracked for perimeter checkouts only."
        },
        {
          step: "04",
          title: "Parent / Guardian Contact Information",
          desc: "Submit parent names, emergency phone numbers, and optional email IDs. This is required for fee-due notices, progress report card sign-offs, and critical school announcements."
        },
        {
          step: "05",
          title: "Mailing Address Verification",
          desc: "Provide street address, state, city, and a valid 6-digit postal pincode. This is verified against municipal zones for school transport routing setups."
        }
      ],
      details: [
        {
          title: "Why is onboarding mandatory?",
          body: "Without completed onboarding records, the database locks student dashboard access. Complete profile registration resolves database tags, allowing instant ledger views, report card releases, and message boards logs."
        },
        {
          title: "Troubleshooting common errors",
          body: "If the screen reports 'Admission number already exists', it means another profile is registered with those details. Contact the administration helpdesk to reset credentials. Ensure your pincode contains exactly 6 digits."
        }
      ]
    },
    fees: {
      title: "Fees Ledger & Online Payments",
      badge: "Finance Center",
      description: "Verify outstanding balances, tuition fees, transport fees, and co-curricular concessions, and pay online securely.",
      details: [
        {
          title: "1. Auditing the Fees Ledger",
          body: "Navigate to the Fees section of your sidebar. The ledger details all generated monthly fee installments, itemized by basic tuition, transport surcharge, and activity fees. Outstanding items are categorized as 'Pending' or 'Overdue' (past payment deadline), while settled items are marked as 'Paid'."
        },
        {
          title: "2. Executing Online Payments",
          body: "Click the Pay Now button next to any unpaid installment. This launches the secure Razorpay Checkout overlay. You can process transactions using credit/debit cards, NetBanking, mobile wallets, or instant UPI (Google Pay, PhonePe, Paytm). Confirmations are processed in real-time, instantly marking installments as Paid."
        },
        {
          title: "3. Downloading Official Receipts",
          body: "Once paid, click the 'PDF Receipt' action next to the installment. This generates a digitally signed PDF invoice showing receipt numbers, transaction reference IDs, and payment stamps. Keep these for tax clearance audits."
        },
        {
          title: "4. Scholarship Concessions & Waivers",
          body: "If you are on EWS, Merit-based, or Sports scholarships, concessions are applied directly to the installment amount. Check the 'Applied Waiver' lines on the card detail drawers. Contact the accountant's desk if waivers are missing."
        }
      ]
    },
    marks: {
      title: "Academic Marks & Performance Sheets",
      badge: "Report Cards",
      description: "Detailed view of your test results, subject aggregates, term percentages, and grade cards.",
      details: [
        {
          title: "1. Navigating Grades",
          body: "The Marks portal compiles all test sheets published by teachers. Select terms (Term 1, Mid-Term, Term 2) or filter by specific subjects (Mathematics, Physics, English) using the filter dropdown cards."
        },
        {
          title: "2. Weighted Grading System",
          body: "Your final subject percentages are calculated using weighted grades: Assignments contribute 20% to the subject grade, Mid-Terms contribute 30%, and Term Finals contribute 50%. The cumulative GPA is auto-generated upon term final score submissions."
        },
        {
          title: "3. Accessing Remarks & Sign-offs",
          body: "Check teacher comments on assignment lines. Report cards require parent sign-off parameters, which are tracked on the profile dashboard sheets."
        }
      ]
    },
    library: {
      title: "Library Catalog & Borrowing Tracker",
      badge: "Library Desk",
      description: "Manage issued books, verify return deadlines, avoid late fines, and search library collections.",
      details: [
        {
          title: "1. Borrowed Books Ledger",
          body: "The library card lists all active books issued to your student card. Each item lists the library barcode, book title, checkout date, and return deadline. Items past deadlines are flagged with high-visibility overdue warnings."
        },
        {
          title: "2. Fine Calculation Surcharges",
          body: "Overdue books accumulate library fines at a rate of ₹10 per day. Accumulated fines are added to the next student fees ledger installment automatically. Prompt returns avoid these charges."
        },
        {
          title: "3. Catalog Search",
          body: "Search the digital catalog by title, author, or genre to check current shelf availability before visiting the library desk."
        }
      ]
    },
    complaints: {
      title: "Filing a Complaint & Support Tickets",
      badge: "Support Desk",
      description: "Report technical glitches, infrastructural issues, or classroom concerns directly to authorities.",
      details: [
        {
          title: "1. Launching a Ticket",
          body: "Click the File a Complaint button in the sidebar. This opens the complaint submission modal, which bypasses general inbox channels to route issues directly to designated staff."
        },
        {
          title: "2. Recipient Routing Options",
          body: "Select the appropriate destination for your issue:\n• Teacher: For classroom, syllabus, or peer concerns.\n• Tech Support (Admin): For portal issues, password resets, or device bugs.\n• Principal / Vice-Principal (Admin): For serious escalations or infrastructural reports."
        },
        {
          title: "3. Tagging Users",
          body: "Use the 'Tag People' field to reference specific users. Start typing '@' to search and tag students or teachers. Tagged users will receive a copy of the ticket in their portal notifications."
        },
        {
          title: "4. Tracking Resolutions",
          body: "Upon submission, the portal outputs a success toast with a unique reference number (e.g., CMP-77169). Use this ID to track updates with support clerks."
        }
      ]
    }
  },
  teacher: {
    roster: {
      title: "Class Roster & Student Profiles",
      badge: "Classroom Manager",
      description: "Detailed instructions for teachers to manage student lists, emergency phone numbers, and transit modes.",
      details: [
        {
          title: "1. Roster Auditing",
          body: "Access the Class section of your dashboard. The roster grid lists all assigned class students, including admission codes, registered emails, and onboarding statuses (Completed vs Pending)."
        },
        {
          title: "2. Filtering & Contact Cards",
          body: "Use search bars to filter by student name. Clicking a student row opens their contact card, listing parent names, emergency phone numbers, and commute modes (Walking vs Transport). This is critical for organizing school bus routes or coordinating parent updates."
        }
      ]
    },
    grading: {
      title: "Marks Submission & Grading Management",
      badge: "Grades Editor",
      description: "Learn how to record student test scores, batch-submit term exams, and publish grades.",
      details: [
        {
          title: "1. Entering Grades",
          body: "Navigate to your assigned subjects page. Select the target class and exam type (Assignment, Midterm, or Final Exam). The grid updates to show input fields for each student."
        },
        {
          title: "2. Score Ranges & Validation",
          body: "Input numeric scores within the designated max limits (e.g. 0-100). The form checks inputs in real-time, preventing input of values exceeding max limits or negative scores."
        },
        {
          title: "3. Grade Publishing",
          body: "Review the filled grades and click Submit. Published scores update student report cards instantly and trigger GPA/average percentage recalculations."
        }
      ]
    },
    notices: {
      title: "Publishing Notices & Announcements",
      badge: "Bulletin Board",
      description: "Broadcast class updates, homework tasks, or exam announcements directly to student portals.",
      details: [
        {
          title: "1. Creating an Announcement",
          body: "Open the Notices tab and click New Announcement. Draft your notice, add titles, select target classes (e.g. Class 10-A, Class 9-B), and attach optional files."
        },
        {
          title: "2. Broadcast Delivery",
          body: "Clicking Publish instantly pushes the notice to the target student notice board streams. Important notices can be flagged as urgent to display warning flags on student log screens."
        }
      ]
    },
    escalations: {
      title: "Leave Requests & supplies Procurements",
      badge: "Requests Center",
      description: "How to submit official leaves or supply orders directly to administration.",
      details: [
        {
          title: "1. Supply Orders",
          body: "Request classroom materials (supplies, books, lab assets) through the requests panel. Input item names, quantities, and justification reasons. Admin reviews requests in real-time."
        },
        {
          title: "2. Submitting Leave Requests",
          body: "Select the leave option, choose date ranges, input reason descriptions, and submit. Status fields update to Approved or Rejected as admin reviews the request."
        }
      ]
    },
    complaints: {
      title: "Educator Support & Complaint Tickets",
      badge: "Helpdesk",
      description: "Log infrastructural issues or coordinate reports directly with coordinators or IT support.",
      details: [
        {
          title: "1. Submitting Support Requests",
          body: "Use the File a Complaint button in the sidebar. Select Academic Coordinator, Principal, or IT Support, fill in titles, tag users, and describe your request. CMP reference numbers are issued for all submissions."
        }
      ]
    }
  }
}

export default async function DocArticlePage({
  params
}: {
  params: Promise<{ role: string; section: string }>
}) {
  const { role, section } = await params
  const article = ARTICLES[role]?.[section]

  if (!article) {
    return (
      <div className="p-8 md:p-12 text-center text-muted-foreground text-sm">
        Documentation page not found.
      </div>
    )
  }

  // Compile Table of Contents dynamically for the right sidebar content map
  const toc: { title: string; url: string; depth: number }[] = []
  toc.push({ title: "Overview", url: "#overview", depth: 2 })

  if (article.steps) {
    toc.push({ title: "Step-by-Step Guide", url: "#guide", depth: 2 })
  }

  if (article.details) {
    article.details.forEach((det) => {
      const slug = det.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
      toc.push({ title: det.title, url: `#${slug}`, depth: 2 })
    })
  }

  return (
    <DocsPage toc={toc}>
      <DocsBody>
        <div className="space-y-3">
          <Badge variant="outline" className="bg-primary/5 text-primary text-[10px] font-semibold border-primary/20">
            {article.badge}
          </Badge>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl" id="overview">
            {article.title}
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            {article.description}
          </p>
        </div>

        <div className="p-4 bg-muted/20 border border-muted-foreground/10 rounded-xl text-xs space-y-2">
          <p className="font-semibold flex items-center gap-1.5 text-foreground">
            <Shield className="size-4 text-emerald-500" />
            <span>Note for {role === "student" ? "Students" : "Educators"}</span>
          </p>
          <p className="text-muted-foreground leading-relaxed">
            This portal module is fully integrated with your dashboard profile. Contact administration if permissions are restricted.
          </p>
        </div>

        {article.steps && (
          <section className="space-y-6 pt-4" id="guide">
            <h3 className="text-lg font-bold text-foreground">Step-by-Step Guide</h3>
            <div className="space-y-4">
              {article.steps.map((st) => (
                <div key={st.step} className="flex gap-4 text-sm leading-relaxed border-b pb-4 border-muted/30 last:border-b-0">
                  <span className="font-extrabold text-primary text-base">{st.step}</span>
                  <div>
                    <h4 className="font-bold text-foreground text-base">{st.title}</h4>
                    <p className="text-muted-foreground mt-1">{st.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {article.details && (
          <section className="space-y-6 pt-4">
            {article.details.map((det, i) => {
              const slug = det.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
              return (
                <div key={i} className="space-y-2">
                  <h3 className="text-lg font-bold text-foreground" id={slug}>{det.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {det.body}
                  </p>
                </div>
              )
            })}
          </section>
        )}
      </DocsBody>
    </DocsPage>
  )
}
