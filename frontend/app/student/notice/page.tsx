"use client"

import * as React from "react"
import { Megaphone, Search, Calendar, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Notice {
  id: string
  title: string
  date: string
  sender: string
  category: "Academic" | "Exams" | "Events" | "General"
  content: string
  isUrgent: boolean
}

const mockNotices: Notice[] = [
  { id: "N-01", title: "Final Semester Examination Timetable Released", date: "June 24, 2026", sender: "Controller of Examinations", category: "Exams", content: "The examination schedule for the upcoming final semester examinations is now officially published. Students can view the dates on the register page or download the PDF copy from the school notices board portal. Examinations begin July 10, 2026.", isUrgent: true },
  { id: "N-02", title: "Independence Day Celebration Rehearsals", date: "June 22, 2026", sender: "Dean of Student Affairs", category: "Events", content: "Rehearsals for the dance, choir, and parade teams for the Independence Day event will start from tomorrow. Students who signed up must report to the school main auditorium by 03:00 PM everyday after regular classes.", isUrgent: false },
  { id: "N-03", title: "Upgrade of Digital Library Systems", date: "June 20, 2026", sender: "Chief Librarian", category: "Academic", content: "The digital library portal will undergo scheduled database maintenance and server upgrade on June 28, 2026. Online access to e-books, registers, and research papers will be unavailable from 09:00 AM to 05:00 PM.", isUrgent: false },
  { id: "N-04", title: "Monsoon Health Advisory and Precautions", date: "June 18, 2026", sender: "School Medical Officer", category: "General", content: "In view of the monsoon season, students are advised to carry umbrellas, maintain proper sanitation, and drink filtered water. Health center is stocked with essential medicines in case of cold, seasonal flu, or allergies.", isUrgent: false }
]

export default function StudentNoticePage() {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedCategory, setSelectedCategory] = React.useState<string>("All")

  const filteredNotices = mockNotices.filter(notice => {
    const matchesSearch = notice.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          notice.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "All" || notice.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="flex flex-col gap-6 py-6 min-h-screen bg-background font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 lg:px-8">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Megaphone className="h-8 w-8 text-primary" />
            Notice Board
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
            Stay updated with official notifications, exam announcements, holidays, and extracurricular events.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-6 lg:px-8">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/75" />
          <Input 
            type="text"
            placeholder="Search notices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9.5 rounded-lg border-border focus:ring-1 focus:ring-primary w-full bg-card/40 text-xs"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {["All", "Academic", "Exams", "Events", "General"].map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              onClick={() => setSelectedCategory(cat)}
              size="sm"
              className="text-xs rounded-lg cursor-pointer shrink-0"
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Notices List */}
      <div className="grid gap-6 px-6 lg:px-8">
        {filteredNotices.length > 0 ? (
          filteredNotices.map((notice) => (
            <div key={notice.id} className={`rounded-xl border p-6 bg-card/30 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden ${
              notice.isUrgent ? "border-amber-500/30 bg-amber-500/[0.01]" : "border-border"
            }`}>
              {/* Urgent Left Stripe Accent */}
              {notice.isUrgent && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
              )}

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    notice.category === "Exams" ? "bg-red-500/10 text-red-600 dark:text-red-400" :
                    notice.category === "Academic" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" :
                    notice.category === "Events" ? "bg-purple-500/10 text-purple-600 dark:text-purple-400" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {notice.category}
                  </span>
                  {notice.isUrgent && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="h-3 w-3 mr-0.5" /> Urgent Notice
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                  <Calendar className="h-3.5 w-3.5" />
                  {notice.date}
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-foreground leading-tight tracking-tight">{notice.title}</h3>
                <p className="text-xs text-muted-foreground font-semibold">Posted by: {notice.sender}</p>
              </div>

              <p className="text-sm text-foreground/80 leading-relaxed font-normal whitespace-pre-wrap">{notice.content}</p>
            </div>
          ))
        ) : (
          <div className="py-16 text-center text-muted-foreground text-sm border border-dashed border-border rounded-xl bg-card/10">
            No notices found matching your criteria.
          </div>
        )}
      </div>
    </div>
  )
}
