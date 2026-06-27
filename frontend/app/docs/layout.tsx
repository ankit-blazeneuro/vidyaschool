"use client"

import { DocsLayout } from "fumadocs-ui/layouts/docs"
import type * as PageTree from "fumadocs-core/page-tree"
import { BookOpen } from "lucide-react"

const tree: PageTree.Root = {
  name: "Documentation",
  children: [
    {
      type: "folder",
      name: "Account & Authentication",
      children: [
        { type: "page", name: "1. Account Registration", url: "/docs/auth/signup" },
        { type: "page", name: "2. Portal Login Streams", url: "/docs/auth/login" },
        { type: "page", name: "3. Verification & Approval", url: "/docs/auth/approval" },
      ],
    },
    {
      type: "folder",
      name: "Student Guide",
      children: [
        { type: "page", name: "1. Profile Onboarding", url: "/docs/student/onboarding" },
        { type: "page", name: "2. Fees & Payments", url: "/docs/student/fees" },
        { type: "page", name: "3. Marks & Academic Cards", url: "/docs/student/marks" },
        { type: "page", name: "4. Library Catalog", url: "/docs/student/library" },
        { type: "page", name: "5. Filing a Complaint", url: "/docs/student/complaints" },
      ],
    },
    {
      type: "folder",
      name: "Teacher Guide",
      children: [
        { type: "page", name: "1. Class Roster", url: "/docs/teacher/roster" },
        { type: "page", name: "2. Marks Submission", url: "/docs/teacher/grading" },
        { type: "page", name: "3. Class Notice Publishing", url: "/docs/teacher/notices" },
        { type: "page", name: "4. Requests & Leaves", url: "/docs/teacher/escalations" },
        { type: "page", name: "5. Educator Complaints", url: "/docs/teacher/complaints" },
      ],
    },
  ],
}

export default function DocsPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <DocsLayout
      tree={tree}
      nav={{
        title: (
          <div className="flex items-center gap-2 font-bold text-sm">
            <BookOpen className="h-4 w-4 text-primary" />
            <span>VidyaSchool Docs</span>
          </div>
        ),
      }}
    >
      {children}
    </DocsLayout>
  )
}
