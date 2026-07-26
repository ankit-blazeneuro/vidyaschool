"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
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
import { NotebookPen, Calendar, User, BookOpen, ArrowRight, Tag } from "lucide-react"

interface NoteItem {
  id: string
  notebook: string // Subject / Topic
  timestamp: string
  title: string
  bullets: string[]
  body: string
  teacherName: string
  rawContent?: string
  className?: string
  sectionName?: string
  color?: string
}

const COLOR_MAP: Record<string, { cardBg: string; border: string }> = {
  default: { cardBg: "bg-white dark:bg-[#1e1e1e]",          border: "border-border/60" },
  yellow:  { cardBg: "bg-amber-50/70 dark:bg-amber-950/20", border: "border-amber-200/80 dark:border-amber-800/40" },
  blue:    { cardBg: "bg-sky-50/70 dark:bg-sky-950/20",     border: "border-sky-200/80 dark:border-sky-800/40" },
  green:   { cardBg: "bg-emerald-50/70 dark:bg-emerald-950/20", border: "border-emerald-200/80 dark:border-emerald-800/40" },
  pink:    { cardBg: "bg-rose-50/70 dark:bg-rose-950/20",   border: "border-rose-200/80 dark:border-rose-800/40" },
  purple:  { cardBg: "bg-violet-50/70 dark:bg-violet-950/20", border: "border-violet-200/80 dark:border-violet-800/40" },
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
  const router = useRouter()
  const params = useParams<{ username: string }>()
  const username = params?.username || ""

  const [notes, setNotes] = React.useState<NoteItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedNote, setSelectedNote] = React.useState<NoteItem | null>(null)
  const [selectedTopic, setSelectedTopic] = React.useState<string>("All")
  const [showAllNotesModal, setShowAllNotesModal] = React.useState(false)

  const parseNotes = (dataNotes: any[]) => {
    return dataNotes.map((note: any) => {
      let bullets: string[] = []
      let body = ""
      let fullText = ""

      if (note.content) {
        if (note.content.startsWith("{")) {
          try {
            const parsed = JSON.parse(note.content)
            if (parsed && Array.isArray(parsed.pages)) {
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

      if (bullets.length === 0) {
        bullets = ["No text highlights found in this note", "Click to open full note content"]
      }
      if (!body) {
        body = "Interactive canvas note. Open to view text content details."
      }

      if (body.length > 100) {
        body = body.substring(0, 97) + "..."
      }

      return {
        id: note.id,
        notebook: note.subject || "General",
        timestamp: timeAgo(note.updated_at || note.created_at),
        title: note.title || "Untitled Note",
        bullets,
        body,
        teacherName: note.teacher_name || note.teacherName || "Unknown Teacher",
        rawContent: fullText || note.content,
        className: note.class || note.targetClass,
        sectionName: note.section || note.targetSection,
        color: note.color || "default",
      }
    })
  }

  React.useEffect(() => {
    fetch("/api/backend/api/student/notes")
      .then(res => {
        if (!res.ok) throw new Error("Backend notes endpoint failed")
        return res.json()
      })
      .then(data => {
        if (data.notes && Array.isArray(data.notes) && data.notes.length > 0) {
          setNotes(parseNotes(data.notes))
        } else {
          return fetch("/api/student/notes")
            .then(res => res.json())
            .then(fallbackData => {
              if (fallbackData.notes && Array.isArray(fallbackData.notes)) {
                setNotes(parseNotes(fallbackData.notes))
              }
            })
        }
      })
      .catch(() => {
        fetch("/api/student/notes")
          .then(res => res.json())
          .then(data => {
            if (data.notes && Array.isArray(data.notes)) {
              setNotes(parseNotes(data.notes))
            }
          })
          .catch(() => {})
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  // Extract unique topics / subjects
  const topics = React.useMemo(() => {
    const set = new Set<string>()
    notes.forEach(n => {
      if (n.notebook) set.add(n.notebook)
    })
    return ["All", ...Array.from(set)]
  }, [notes])

  // Filter notes by topic
  const filteredNotes = React.useMemo(() => {
    return notes.filter(note => {
      return selectedTopic === "All" || note.notebook.toLowerCase() === selectedTopic.toLowerCase()
    })
  }, [notes, selectedTopic])

  return (
    <section className="rounded-2xl bg-zinc-100 dark:bg-[#121212] mx-4 lg:mx-6 overflow-hidden transition-all duration-300 border border-border/40">
      {/* Header */}
      <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-border/40">
        <h2 className="font-heading text-base leading-snug font-semibold text-foreground flex items-center gap-2">
          <BookOpen className="size-4.5 text-primary" /> Notes
        </h2>

        {/* All Notes Link */}
        <button
          onClick={() => router.push(username ? `/student/${username}/notes` : "/student")}
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 transition-colors cursor-pointer"
        >
          All Notes <ArrowRight className="size-3" />
        </button>
      </div>

      {/* Topic Filter Pills */}
      {topics.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto px-6 py-2.5 border-b border-border/30 scrollbar-none">
          <Tag className="size-3.5 text-muted-foreground shrink-0 mr-1" />
          {topics.map(topic => (
            <button
              key={topic}
              onClick={() => setSelectedTopic(topic)}
              className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 transition-all cursor-pointer ${
                selectedTopic === topic
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {topic}
            </button>
          ))}
        </div>
      )}

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
      ) : filteredNotes.length === 0 ? (
        <div className="px-6 py-10 text-center flex flex-col items-center justify-center">
          <NotebookPen className="size-10 text-muted-foreground/40 mb-2" />
          <p className="text-sm font-semibold text-foreground">No notes found</p>
        </div>
      ) : (
        /* Horizontal scroll for notes */
        <div className="flex gap-4 overflow-x-auto px-6 pb-6 pt-4 scrollbar-none">
          {filteredNotes.map(note => {
            const colorStyle = COLOR_MAP[note.color || "default"] || COLOR_MAP.default
            return (
              <Card
                key={note.id}
                onClick={() => router.push(username ? `/student/${username}/notes/${note.id}` : "#")}
                className={`relative min-w-[285px] max-w-[285px] shrink-0 ${colorStyle.cardBg} ${colorStyle.border}
                           rounded-xl shadow-xs hover:shadow-md flex flex-col transition-all duration-200 cursor-pointer active:scale-98 overflow-hidden group`}
              >
                <CardHeader className="pb-2 pt-4 px-5 relative z-10">
                  {/* Top row: Topic badge + timestamp */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <NotebookPen className="size-3.5 text-primary shrink-0" />
                      <span className="text-xs font-bold text-primary truncate max-w-[130px]">
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

                <CardContent className="px-5 pb-4 flex flex-col gap-2 flex-1 relative z-10">
                  {/* Bullet list highlights */}
                  <ul className="space-y-1.5 flex-1">
                    {note.bullets.map((b, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs text-foreground/80 leading-normal">
                        <span className="mt-[6px] size-1.5 rounded-full bg-primary/60 shrink-0" />
                        <span className="line-clamp-2">{b}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Footer info: Teacher + Class */}
                  <div className="mt-3 pt-2 border-t border-muted/30 flex items-center justify-between text-[10px] text-muted-foreground relative z-10">
                    <span className="flex items-center gap-1 truncate">
                      <User className="size-3 text-primary shrink-0" />
                      <span className="truncate">{note.teacherName}</span>
                    </span>
                    {note.className && (
                      <span className="px-1.5 py-0.5 rounded bg-muted/80 font-semibold text-[9px]">
                        Class {note.className}{note.sectionName ? `-${note.sectionName}` : ""}
                      </span>
                    )}
                  </div>
                </CardContent>

                {/* Dark Linear Gradient Overlay at Bottom (constantly decreasing opacity upward) */}
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none rounded-b-xl z-0 transition-opacity opacity-75 group-hover:opacity-90" />
              </Card>
            )
          })}
        </div>
      )}

      {/* Note Detail Dialog */}
      <Dialog open={!!selectedNote} onOpenChange={open => !open && setSelectedNote(null)}>
        {selectedNote && (
          <DialogContent className="sm:max-w-md md:max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                  {selectedNote.notebook}
                </span>
                {selectedNote.className && (
                  <span className="px-2 py-0.5 rounded-full bg-muted text-foreground text-[10px] font-semibold">
                    Class {selectedNote.className}{selectedNote.sectionName ? `-${selectedNote.sectionName}` : ""}
                  </span>
                )}
                <span className="text-[11px] text-muted-foreground flex items-center gap-1 ml-auto">
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
                <div className="rounded-xl border border-muted bg-muted/20 p-4 max-h-[280px] overflow-y-auto text-sm leading-relaxed whitespace-pre-wrap font-mono text-foreground/80 scrollbar-thin">
                  {selectedNote.rawContent || selectedNote.body}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedNote(null)}
                className="px-4 py-2 text-sm font-semibold rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* All Notes Modal */}
      <Dialog open={showAllNotesModal} onOpenChange={setShowAllNotesModal}>
        <DialogContent className="sm:max-w-2xl md:max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <BookOpen className="size-5 text-primary" /> All Notes ({notes.length})
            </DialogTitle>
            <DialogDescription className="text-xs">
              All lesson notes published by your class teachers.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            {notes.map(note => {
              const colorStyle = COLOR_MAP[note.color || "default"] || COLOR_MAP.default
              return (
                <Card
                  key={note.id}
                  onClick={() => {
                    setShowAllNotesModal(false)
                    setSelectedNote(note)
                  }}
                  className={`relative ${colorStyle.cardBg} ${colorStyle.border} rounded-xl p-4 flex flex-col gap-2 shadow-xs hover:shadow-md cursor-pointer transition-all overflow-hidden group`}
                >
                  <div className="flex items-center justify-between relative z-10">
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                      {note.notebook}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{note.timestamp}</span>
                  </div>
                  <h4 className="font-bold text-sm text-foreground line-clamp-1 relative z-10">{note.title}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed relative z-10">{note.body}</p>
                  <div className="mt-auto pt-2 border-t border-muted/30 flex items-center justify-between text-[10px] text-muted-foreground relative z-10">
                    <span>By {note.teacherName}</span>
                    {note.className && <span>Class {note.className}</span>}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none rounded-b-xl z-0 opacity-70 group-hover:opacity-90" />
                </Card>
              )
            })}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setShowAllNotesModal(false)}
              className="px-4 py-2 text-sm font-semibold rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}

