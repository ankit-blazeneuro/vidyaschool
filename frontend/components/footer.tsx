"use client"

import * as React from "react"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-background py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          
          {/* Column 1: Brand Info */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 font-semibold text-sm tracking-tight text-foreground hover:opacity-90">
              <span className="font-semibold text-sm">VidyaSchool</span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
              Modern learning environment focused on academic excellence, creative arts, STEM innovation, and holistic development.
            </p>
          </div>

          {/* Column 2: Portals */}
          <div>
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">Portals</h3>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              <li>
                <Link href="/student" className="hover:text-foreground transition-colors">Student Portal</Link>
              </li>
              <li>
                <Link href="/teacher" className="hover:text-foreground transition-colors">Teacher Portal</Link>
              </li>
              <li>
                <Link href="/student/library" className="hover:text-foreground transition-colors">Library Catalog</Link>
              </li>
              <li>
                <Link href="/student/fees" className="hover:text-foreground transition-colors">Fees Desk</Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Academics */}
          <div>
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">Academics</h3>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              <li>
                <Link href="/student/notice" className="hover:text-foreground transition-colors">Circulars & Notices</Link>
              </li>
              <li>
                <Link href="/student/marks" className="hover:text-foreground transition-colors">Curriculum & Exams</Link>
              </li>
              <li>
                <Link href="/docs/admissions" className="hover:text-foreground transition-colors">Admissions Guide</Link>
              </li>
              <li>
                <Link href="/docs/co-curriculars" className="hover:text-foreground transition-colors">Co-Curriculars</Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Information */}
          <div>
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">Information</h3>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              <li>
                <Link href="/student/notice" className="hover:text-foreground transition-colors">Academic Calendar</Link>
              </li>
              <li>
                <Link href="/support" className="hover:text-foreground transition-colors">Help & Support</Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Giant Footer Watermark */}
        <div className="mt-16 md:mt-24 select-none">
          <h2 className="text-center font-bold tracking-tighter text-foreground/20 dark:text-foreground/10 text-4xl sm:text-6xl md:text-[8rem] lg:text-[10rem] xl:text-[12rem] leading-none">
            Vidya School
          </h2>
        </div>

        {/* Bottom copyright section */}
        <div className="border-t border-border mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-[11px] text-muted-foreground">
            &copy; {new Date().getFullYear()} VidyaSchool. All rights reserved.
          </div>
          <div className="flex gap-4 text-[11px] text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
