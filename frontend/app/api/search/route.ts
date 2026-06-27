import { NextRequest, NextResponse } from "next/server"

const ARTICLES = {
  auth: {
    signup: { title: "Account Registration (Signup)", desc: "Learn how to register your profile credentials on the VidyaSchool portal and choose your preferred platform roles." },
    login: { title: "Portal Login Streams", desc: "Walkthrough on signing into the dashboard and accessing your designated workspace controls." },
    approval: { title: "Verification & Educator Approvals", desc: "Understand the email verification cycle and administrative approval flows for teachers." }
  },
  student: {
    onboarding: { title: "Student Profile Onboarding", desc: "Complete guide on setting up your account profile, emergency coordinates, class allocations, and commuter choices to activate your portal workspace." },
    fees: { title: "Fees Ledger & Online Payments", desc: "Verify outstanding balances, tuition fees, transport fees, and co-curricular concessions, and pay online securely." },
    marks: { title: "Academic Marks & Performance Sheets", desc: "Detailed view of your test results, subject aggregates, term percentages, and grade cards." },
    library: { title: "Library Catalog & Borrowing Tracker", desc: "Manage issued books, verify return deadlines, avoid late fines, and search library collections." },
    complaints: { title: "Filing a Complaint & Support Tickets", desc: "Report technical glitches, infrastructural issues, or classroom concerns directly to authorities." }
  },
  teacher: {
    roster: { title: "Class Roster & Student Profiles", desc: "Detailed instructions for teachers to manage student lists, emergency phone numbers, and transit modes." },
    grading: { title: "Marks Submission & Grading Management", desc: "Learn how to record student test scores, batch-submit term exams, and publish grades." },
    notices: { title: "Publishing Notices & Announcements", desc: "Broadcast class updates, homework tasks, or exam announcements directly to student portals." },
    escalations: { title: "Leave Requests & supplies Procurements", desc: "How to submit official leaves or supply orders directly to administration." },
    complaints: { title: "Educator Support & Complaint Tickets", desc: "Log infrastructural issues or coordinate reports directly with coordinators or IT support." }
  }
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const query = searchParams.get("query") || searchParams.get("q") || ""
  
  const results: { id: string; title: string; content: string; url: string }[] = []
  
  if (!query.trim()) {
    return NextResponse.json([])
  }

  // Iterate and filter
  Object.entries(ARTICLES).forEach(([role, sections]) => {
    Object.entries(sections).forEach(([secName, article]) => {
      const matchTitle = article.title.toLowerCase().includes(query.toLowerCase())
      const matchDesc = article.desc.toLowerCase().includes(query.toLowerCase())
      
      if (matchTitle || matchDesc) {
        results.push({
          id: `${role}-${secName}`,
          title: article.title,
          content: article.desc,
          url: `/docs/${role}/${secName}`
        })
      }
    })
  })
  
  return NextResponse.json(results)
}
