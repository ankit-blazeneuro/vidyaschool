"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  BookOpen,
  NotebookPen,
  Calendar,
  User,
  ArrowRight,
  FileText,
  Sparkles,
  Clock,
  CheckCircle2,
} from "lucide-react"

export interface NotebookCardData {
  id: string
  notebookLabel: string
  notebookSubject: string
  timestamp: string
  title: string
  bullets: string[]
  previewText: string
  teacherName: string
  className?: string
  sectionName?: string
  pdfUrl?: string | null
  rawContent?: string
  isSuggested?: boolean
}

// Fallback high-quality notebook dataset matching reference layout
const FALLBACK_NOTEBOOKS: NotebookCardData[] = [
  {
    id: "sample-1",
    notebookLabel: "Notebook",
    notebookSubject: "Mathematics",
    timestamp: "3h ago",
    title: "Quadratic Functions & Parabola Vertex Forms",
    bullets: [
      "Standard form f(x) = ax² + bx + c vs Vertex form f(x) = a(x-h)² + k",
      "Discriminant analysis (Δ = b² - 4ac) for real vs complex roots",
      "Review textbook chapter 4 exercises 12 to 28 for upcoming test"
    ],
    previewText: "Remember to complete section 4.2 practice problems before Friday's quiz...",
    teacherName: "Dr. A. Sharma",
    className: "10",
    sectionName: "A",
    isSuggested: false,
  },
  {
    id: "sample-2",
    notebookLabel: "Notebook",
    notebookSubject: "Physics",
    timestamp: "5h ago",
    title: "Kinematics & Newton's Second Law Applications",
    bullets: [
      "Derivation of v² = u² + 2as using calculus integral methods",
      "Free body diagrams for inclined plane friction calculations",
      "Lab report setup for air resistance velocity experiment"
    ],
    previewText: "Verify force vectors and tension calculations in problem set #3...",
    teacherName: "Prof. R. Verma",
    className: "10",
    sectionName: "A",
    isSuggested: true,
  },
  {
    id: "sample-3",
    notebookLabel: "Notebook",
    notebookSubject: "Chemistry",
    timestamp: "1d ago",
    title: "Chemical Bonding & Molecular Orbital Theory",
    bullets: [
      "Ionic vs covalent lattice energy comparison and Born-Haber cycle",
      "Lewis dot structures for resonance hybrids (NO₃⁻ and CO₃²⁻)",
      "Valence shell electron pair repulsion (VSEPR) geometry rules"
    ],
    previewText: "Draw molecular orbital diagrams for O₂ and N₂ diatomic molecules...",
    teacherName: "Dr. P. Nair",
    className: "10",
    sectionName: "B",
    isSuggested: true,
  },
  {
    id: "sample-4",
    notebookLabel: "Notebook",
    notebookSubject: "English Literature",
    timestamp: "2d ago",
    title: "Shakespeare's Hamlet: Soliloquy & Theme Analysis",
    bullets: [
      "Act III Scene 1 'To be or not to be' tragic irony breakdown",
      "Symbolism of Yorick's skull and mortality themes in Elizabethan drama",
      "Essay draft outline: Action vs Hesitation in Hamlet's character arc"
    ],
    previewText: "Prepare thesis statement and 3 supporting primary text quotes for peer review...",
    teacherName: "Ms. S. Gupta",
    className: "10",
    sectionName: "A",
    isSuggested: false,
  },
]

function formatTimeAgo(dateStr: string): string {
  if (!dateStr) return "3h ago"
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d === 1) return "1d ago"
  return `${d}d ago`
}

export function StudentNotes() {
  const router = useRouter()
  const params = useParams<{ username: string }>()
  const username = params?.username || ""

  const [activeTab, setActiveTab] = React.useState<"recents" | "suggested">("recents")
  const [notebooks, setNotebooks] = React.useState<NotebookCardData[]>(FALLBACK_NOTEBOOKS)
  const [loading, setLoading] = React.useState(true)
  const [selectedNote, setSelectedNote] = React.useState<NotebookCardData | null>(null)

  // Fetch real student notes from backend API
  React.useEffect(() => {
    fetch("/api/backend/api/student/notes")
      .then(res => {
        if (!res.ok) throw new Error("Backend endpoint failed")
        return res.json()
      })
      .then(data => {
        if (data.notes && Array.isArray(data.notes) && data.notes.length > 0) {
          const parsed = parseApiNotes(data.notes)
          setNotebooks(parsed)
        } else {
          return fetch("/api/student/notes")
            .then(res => res.json())
            .then(fallbackData => {
              if (fallbackData.notes && Array.isArray(fallbackData.notes) && fallbackData.notes.length > 0) {
                setNotebooks(parseApiNotes(fallbackData.notes))
              }
            })
        }
      })
      .catch(() => {
        fetch("/api/student/notes")
          .then(res => res.json())
          .then(data => {
            if (data.notes && Array.isArray(data.notes) && data.notes.length > 0) {
              setNotebooks(parseApiNotes(data.notes))
            }
          })
          .catch(() => {})
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const parseApiNotes = (apiNotes: any[]): NotebookCardData[] => {
    return apiNotes.map((note: any, idx: number) => {
      let bullets: string[] = []
      let previewText = ""
      let fullText = ""

      if (note.content) {
        if (typeof note.content === "string" && note.content.startsWith("{")) {
          try {
            const parsed = JSON.parse(note.content)
            if (parsed && Array.isArray(parsed.pages)) {
              const lines: string[] = []
              parsed.pages.forEach((p: any) => {
                if (Array.isArray(p.texts)) {
                  p.texts.forEach((t: any) => {
                    if (t?.text) lines.push(t.text.trim())
                  })
                }
              })
              fullText = lines.join("\n")
              bullets = lines.filter(l => l.length > 5).slice(0, 3)
              previewText = lines.slice(3).join(" ") || "Click to view full interactive note contents..."
            }
          } catch (e) {
            fullText = note.content
          }
        } else {
          fullText = String(note.content)
          const lines = fullText.split("\n").map(l => l.trim()).filter(Boolean)
          bullets = lines.slice(0, 3)
          previewText = lines.slice(3).join(" ") || "Open note to read complete lesson notes..."
        }
      }

      if (bullets.length === 0) {
        bullets = ["Lesson outline & key concepts", "Study guide summary", "Exam prep highlights"]
      }

      return {
        id: note.id || `note-${idx}`,
        notebookLabel: "Notebook",
        notebookSubject: note.subject || "General",
        timestamp: formatTimeAgo(note.updated_at || note.created_at),
        title: note.title || "Untitled Lesson Note",
        bullets,
        previewText: previewText.length > 80 ? previewText.substring(0, 77) + "..." : (previewText || "Read full note content..."),
        teacherName: note.teacher_name || note.teacherName || "Class Teacher",
        className: note.class || note.targetClass || "10",
        sectionName: note.section || note.targetSection || "A",
        pdfUrl: note.pdf_url || note.pdfUrl || null,
        rawContent: fullText || note.content,
        isSuggested: idx % 2 === 1,
      }
    })
  }

  // Filter notebooks by active tab
  const displayedNotebooks = React.useMemo(() => {
    if (activeTab === "suggested") {
      const filtered = notebooks.filter(n => n.isSuggested)
      return filtered.length > 0 ? filtered : notebooks
    }
    return notebooks
  }, [notebooks, activeTab])

  // Framer Motion Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.05,
      },
    },
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.35,
        ease: "easeOut",
      },
    },
  }

  return (
    <section className="w-full px-4 lg:px-6 py-2">
      {/* Section Outer Container */}
      <div className="rounded-2xl border border-border/60 bg-background/50 p-4 sm:p-6 shadow-sm backdrop-blur-sm transition-all duration-300">
        
        {/* Header Layout: Title on Left, Tabs on Right */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-3 border-b border-border/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
              <NotebookPen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                Notes
              </h2>
              <p className="text-xs text-muted-foreground">Classroom notebooks & lesson summaries</p>
            </div>
          </div>

          {/* Right Controls: Tabs + View All */}
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <Tabs
              value={activeTab}
              onValueChange={(val) => setActiveTab(val as "recents" | "suggested")}
              className="w-auto"
            >
              <TabsList className="bg-muted/70 p-1 rounded-xl border border-border/40 h-9">
                <TabsTrigger
                  value="recents"
                  className="rounded-lg text-xs font-semibold px-3 py-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
                >
                  <Clock className="h-3.5 w-3.5 mr-1.5 opacity-70" />
                  Recents
                </TabsTrigger>
                <TabsTrigger
                  value="suggested"
                  className="rounded-lg text-xs font-semibold px-3 py-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1.5 text-amber-500 opacity-90" />
                  Suggested
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <button
              onClick={() => router.push(username ? `/student/${username}/notes` : "/student")}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-accent/50 cursor-pointer"
            >
              All Notes <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Horizontally Scrollable Cards Container */}
        {loading ? (
          <div className="flex gap-5 overflow-x-auto pb-4 pt-2 scrollbar-none">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="min-w-[290px] max-w-[290px] sm:min-w-[320px] sm:max-w-[320px] shrink-0 rounded-2xl border border-border/50 bg-card p-5 space-y-4 animate-pulse"
              >
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                </div>
                <div className="h-6 bg-muted rounded w-4/5" />
                <div className="space-y-2 pt-2">
                  <div className="h-3.5 bg-muted rounded w-full" />
                  <div className="h-3.5 bg-muted rounded w-5/6" />
                  <div className="h-3.5 bg-muted rounded w-4/6" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <motion.div
            key={activeTab}
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="flex gap-5 overflow-x-auto pb-4 pt-2 scrollbar-none snap-x snap-mandatory focus:outline-none"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <AnimatePresence mode="popLayout">
              {displayedNotebooks.map((nb) => (
                <motion.div
                  key={nb.id}
                  variants={cardVariants}
                  whileHover={{ y: -6, scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  onClick={() => {
                    if (username) {
                      router.push(`/student/${username}/notes/${nb.id}`)
                    } else {
                      setSelectedNote(nb)
                    }
                  }}
                  className="min-w-[285px] max-w-[285px] sm:min-w-[320px] sm:max-w-[320px] shrink-0 snap-start cursor-pointer"
                >
                  <Card className="h-full border border-border/70 bg-card text-card-foreground shadow-xs hover:shadow-xl hover:border-primary/40 transition-all duration-300 rounded-2xl flex flex-col justify-between overflow-hidden group">
                    <CardHeader className="pb-3 pt-5 px-5 space-y-2.5">
                      
                      {/* Row 1: Notebook Icon + "Notebook" Label + Subject Badge + Relative Timestamp */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
                            <BookOpen className="h-3.5 w-3.5" />
                          </div>
                          <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[11px] truncate">
                            {nb.notebookLabel}
                          </span>
                          <span className="text-muted-foreground/40">•</span>
                          <Badge variant="outline" className="text-[10px] font-semibold px-2 py-0.2 bg-muted/50 border-border/60 shrink-0">
                            {nb.notebookSubject}
                          </Badge>
                        </div>
                        <span className="text-[11px] font-medium text-muted-foreground/70 shrink-0 ml-2">
                          {nb.timestamp}
                        </span>
                      </div>

                      {/* Row 2: Large Notebook Title */}
                      <h3 className="text-base sm:text-lg font-bold tracking-tight text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors pt-1">
                        {nb.title}
                      </h3>
                    </CardHeader>

                    <CardContent className="px-5 pb-5 pt-0 flex flex-col justify-between flex-1 gap-4">
                      {/* Bullet list of tasks / highlights */}
                      <ul className="space-y-2 flex-1">
                        {nb.bullets.map((bullet, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground/80 leading-snug">
                            <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-primary/70 shrink-0" />
                            <span className="line-clamp-2">{bullet}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Bottom Footer: Small faded preview text & Teacher attribution */}
                      <div className="pt-3 border-t border-border/50 flex flex-col gap-1">
                        <p className="text-[11px] text-muted-foreground/70 line-clamp-1 italic">
                          "{nb.previewText}"
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                          <span className="flex items-center gap-1 font-medium truncate">
                            <User className="h-3 w-3 text-primary/80 shrink-0" />
                            <span className="truncate">{nb.teacherName}</span>
                          </span>
                          {nb.className && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                              Class {nb.className}{nb.sectionName ? `-${nb.sectionName}` : ""}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Note Preview Dialog */}
      <Dialog open={!!selectedNote} onOpenChange={(open) => !open && setSelectedNote(null)}>
        {selectedNote && (
          <DialogContent className="sm:max-w-lg rounded-2xl border-border bg-background shadow-2xl">
            <DialogHeader className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs font-semibold">
                  {selectedNote.notebookSubject}
                </Badge>
                <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> {selectedNote.timestamp}
                </span>
              </div>
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                {selectedNote.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-primary" /> Teacher: <span className="font-semibold text-foreground">{selectedNote.teacherName}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              <div className="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Notebook Highlights</h4>
                <ul className="space-y-2">
                  {selectedNote.bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground/90">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {selectedNote.rawContent && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Content Preview</h4>
                  <div className="p-3.5 rounded-xl border border-border/50 bg-card text-xs leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap font-mono text-foreground/80">
                    {selectedNote.rawContent}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedNote(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-border bg-background hover:bg-accent transition-colors"
              >
                Close
              </button>
              {username && (
                <button
                  onClick={() => {
                    const id = selectedNote.id
                    setSelectedNote(null)
                    router.push(`/student/${username}/notes/${id}`)
                  }}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1.5"
                >
                  Open Full Note <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </section>
  )
}

export { StudentNotes as NotesSection }
