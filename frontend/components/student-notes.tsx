"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { NotebookPen, Loader2, Calendar, User, BookOpen } from "lucide-react"

interface NoteItem {
  id: string
  notebook: string
  timestamp: string
  title: string
  bullets: string[]
  body: string
  teacherName: string
  rawContent?: string
}

function timeAgo(dateStr: string) {
  if (!dateStr) return "recently"
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d === 1) return "yesterday"
  return `${d}d ago`
}

export function StudentNotes() {
  const [notes, setNotes] = React.useState<NoteItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedNote, setSelectedNote] = React.useState<NoteItem | null>(null)

  React.useEffect(() => {
    fetch("/api/backend/api/student/notes")
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch")
        return res.json()
      })
      .then(data => {
        if (data.notes && Array.isArray(data.notes)) {
          const formatted = data.notes.map((note: any) => {
            let bullets: string[] = []
            let body = ""
            let fullText = ""

            // Parse content
            if (note.content) {
              if (note.content.startsWith("{")) {
                try {
                  const parsed = JSON.parse(note.content)
                  if (parsed && Array.isArray(parsed.pages)) {
                    // Extract text elements from all pages
                    const allTexts: string[] = []
                    parsed.pages.forEach((page: any, pageIdx: number) => {
                      if (Array.isArray(page.texts) && page.texts.length > 0) {
                        allTexts.push(`--- Page ${pageIdx + 1} ---`)
                        page.texts.forEach((txt: any) => {
                          if (txt && typeof txt.text === "string" && txt.text.trim()) {
                            txt.text.split("\n").forEach((line: string) => {
                              if (line.trim()) allTexts.push(line.trim())
                            })
                          }
                        })
                      }
                    })

                    fullText = allTexts.join("\n")

                    // Clean for preview bullets and body
                    const previewTexts = allTexts.filter(line => !line.startsWith("--- Page"))
                    const bulletLines = previewTexts.filter(line => 
                      line.startsWith("•") || line.startsWith("-") || line.startsWith("*") || /^\d+\./.test(line)
                    )
                    
                    if (bulletLines.length > 0) {
                      bullets = bulletLines.map(line => line.replace(/^[•\-\*\s]+|^\d+\.\s*/, "").trim()).slice(0, 3)
                      body = previewTexts.filter(line => !bulletLines.includes(line)).join(" ")
                    } else {
                      const shortLines = previewTexts.filter(line => line.length < 60)
                      bullets = shortLines.slice(0, 3)
                      body = previewTexts.filter(line => !bullets.includes(line)).join(" ")
                    }
                  }
                } catch (e) {
                  body = note.content
                  fullText = note.content
                }
              } else {
                // Plain text note
                fullText = note.content
                const lines = note.content.split("\n").map((l: string) => l.trim()).filter(Boolean)
                const bulletLines = lines.filter((line: string) => 
                  line.startsWith("•") || line.startsWith("-") || line.startsWith("*") || /^\d+\./.test(line)
                )
                if (bulletLines.length > 0) {
                  bullets = bulletLines.map((line: string) => line.replace(/^[•\-\*\s]+|^\d+\.\s*/, "").trim()).slice(0, 3)
                  body = lines.filter((line: string) => !bulletLines.includes(line)).join(" ")
                } else {
                  bullets = lines.slice(0, 2)
                  body = lines.slice(2).join(" ")
                }
              }
            }

            // Fallbacks
            if (bullets.length === 0) {
              bullets = ["No text highlights found in this note", "Click to open full note content"]
            }
            if (!body) {
              body = "Interactive canvas note. Open to view text content details."
            }

            // Shorten body if too long for card preview
            if (body.length > 100) {
              body = body.substring(0, 97) + "..."
            }

            return {
              id: note.id,
              notebook: note.subject || "General",
              timestamp: timeAgo(note.updated_at),
              title: note.title || "Untitled Note",
              bullets,
              body,
              teacherName: note.teacher_name || "Unknown Teacher",
              rawContent: fullText || note.content
            }
          })
          setNotes(formatted)
        }
      })
      .catch(err => {
        console.error("Error fetching notes:", err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  return (
    <section className="rounded-2xl bg-zinc-100 dark:bg-[#121212] mx-4 lg:mx-6 overflow-hidden transition-all duration-300">
      {/* Heading row */}
      <div className="px-6 pt-5 pb-2">
        <h2 className="font-heading text-base leading-snug font-semibold text-foreground flex items-center gap-2">
          <BookOpen className="size-4.5 text-primary" /> Notes
        </h2>
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-x-auto px-6 py-4 scrollbar-none">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="min-w-[280px] max-w-[280px] shrink-0 bg-white dark:bg-[#1e1e1e] rounded-xl p-5 flex flex-col gap-3 animate-pulse shadow-sm"
            >
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="h-6 bg-muted rounded w-3/4" />
              <div className="space-y-2 mt-2">
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-5/6" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="px-6 py-8 text-center flex flex-col items-center justify-center">
          <NotebookPen className="size-10 text-muted-foreground/40 mb-2" />
          <p className="text-sm font-medium text-foreground">No notes available yet</p>
        </div>
      ) : (
        /* Horizontal scroll — bleeds off right edge */
        <div className="flex gap-4 overflow-x-auto px-6 pb-6 pt-3 -mr-6 scrollbar-none">
          {notes.map((note) => (
            <Card
              key={note.id}
              onClick={() => setSelectedNote(note)}
              className="relative min-w-[280px] max-w-[280px] shrink-0 bg-white dark:bg-[#1e1e1e] border border-transparent hover:border-primary/20 dark:hover:border-primary/30
                         rounded-xl shadow-xs hover:shadow-md flex flex-col transition-all duration-200 cursor-pointer last:mr-6 active:scale-98"
            >
              <CardHeader className="pb-2 pt-4 px-5">
                {/* Top row: icon + notebook label + timestamp */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <NotebookPen className="size-3.5 text-primary shrink-0" />
                    <span className="text-xs font-semibold text-primary truncate max-w-[120px]">
                      {note.notebook}
                    </span>
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground/70 shrink-0">{note.timestamp}</span>
                </div>

                {/* Title */}
                <p className="text-sm font-bold text-foreground leading-snug line-clamp-2">
                  {note.title}
                </p>
              </CardHeader>

              <CardContent className="px-5 pb-4 flex flex-col gap-2 flex-1">
                {/* Bullet list */}
                <ul className="space-y-1.5 flex-1">
                  {note.bullets.map((b, j) => (
                    <li key={j} className="flex items-start gap-2 text-xs text-foreground/80 leading-normal">
                      <span className="mt-[6px] size-1.5 rounded-full bg-primary/60 shrink-0" />
                      <span className="line-clamp-2">{b}</span>
                    </li>
                  ))}
                </ul>

                {/* Bottom line: Teacher Info */}
                <div className="mt-3 pt-2 border-t border-muted/50 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <User className="size-3" />
                  <span className="truncate">By {note.teacherName}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Note Detail Dialog */}
      <Dialog open={!!selectedNote} onOpenChange={(open) => !open && setSelectedNote(null)}>
        {selectedNote && (
          <DialogContent className="sm:max-w-md md:max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                  {selectedNote.notebook}
                </span>
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Calendar className="size-3" /> {selectedNote.timestamp}
                </span>
              </div>
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                {selectedNote.title}
              </DialogTitle>
              <DialogDescription className="text-xs flex items-center gap-1 mt-1">
                <User className="size-3 text-primary" /> Published by <span className="font-semibold text-foreground/90">{selectedNote.teacherName}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              {/* Highlights Section */}
              <div className="rounded-xl bg-primary/5 p-4 border border-primary/10">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Key Highlights</h4>
                <ul className="space-y-2">
                  {selectedNote.bullets.map((b, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-foreground/90 leading-relaxed">
                      <span className="mt-[7px] size-1.5 rounded-full bg-primary shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Full Content Section */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Note Content</h4>
                <div className="rounded-xl border border-muted bg-muted/20 p-4 max-h-[250px] overflow-y-auto text-sm leading-relaxed whitespace-pre-wrap font-mono text-foreground/80 scrollbar-thin">
                  {selectedNote.rawContent || selectedNote.body}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedNote(null)}
                className="px-4 py-2 text-sm font-semibold rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors"
              >
                Close
              </button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </section>
  )
}
