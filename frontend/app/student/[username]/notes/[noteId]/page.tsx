"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import "katex/dist/katex.min.css"

import {
  ArrowLeftIcon,
  BookOpenIcon,
  CalendarIcon,
  UserIcon,
  GraduationCapIcon,
  PrinterIcon,
  CopyIcon,
  CheckIcon,
  TagIcon,
  FileTextIcon,
  Share2Icon,
  ClockIcon,
  SparklesIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface NoteDetail {
  id: string
  title: string
  content: string
  color?: string
  class?: string
  section?: string
  subject?: string
  teacher_name?: string
  created_at?: string
  updated_at?: string
}

function getInitials(name: string) {
  const parts = name.split(" ").filter(Boolean)
  if (parts.length === 0) return "T"
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

function calculateReadingTime(text: string): string {
  const wordsPerMinute = 200
  const words = text.trim().split(/\s+/).length
  const minutes = Math.ceil(words / wordsPerMinute)
  return `${minutes} min read`
}

function MarkdownMathRenderer({ content }: { content: string }) {
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      if ((window as any).MathJax && (window as any).MathJax.typesetPromise) {
        (window as any).MathJax.typesetPromise([containerRef.current]).catch(() => {})
      }
    }
  }, [content])

  return (
    <div
      ref={containerRef}
      className="prose prose-slate dark:prose-invert max-w-none text-foreground text-sm sm:text-base leading-relaxed"
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

export default function StudentNoteDetailPage() {
  const router = useRouter()
  const params = useParams<{ username: string; noteId: string }>()
  const username = params?.username || ""
  const noteId = params?.noteId || ""

  const [note, setNote] = React.useState<NoteDetail | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [copied, setCopied] = React.useState(false)

  // Dynamically load MathJax v3 script for MathJax rendering support
  React.useEffect(() => {
    if (typeof window === "undefined") return
    if (!(window as any).MathJax) {
      ;(window as any).MathJax = {
        tex: {
          inlineMath: [
            ["$", "$"],
            ["\\(", "\\)"],
          ],
          displayMath: [
            ["$$", "$$"],
            ["\\[", "\\]"],
          ],
          processEscapes: true,
        },
        options: {
          ignoreHtmlClass: "tex2jax_ignore",
          processHtmlClass: "tex2jax_process",
        },
      }
      const script = document.createElement("script")
      script.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"
      script.async = true
      document.head.appendChild(script)
    }
  }, [])

  React.useEffect(() => {
    if (!noteId) return

    fetch(`/api/backend/api/student/notes`)
      .then((r) => r.json())
      .then((data) => {
        const found = data.notes?.find((n: any) => n.id === noteId)
        if (found) {
          setNote(found)
        } else {
          return fetch(`/api/student/notes`)
            .then((r) => r.json())
            .then((fallbackData) => {
              const fbFound = fallbackData.notes?.find((n: any) => n.id === noteId)
              if (fbFound) setNote(fbFound)
            })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [noteId])

  const handleCopy = () => {
    if (!note) return
    let textToCopy = note.content
    if (note.content.startsWith("{")) {
      try {
        const parsed = JSON.parse(note.content)
        if (parsed?.pages) {
          const lines: string[] = []
          parsed.pages.forEach((p: any, idx: number) => {
            lines.push(`--- Page ${idx + 1} ---`)
            p.texts?.forEach((t: any) => {
              if (t?.text) lines.push(t.text)
            })
          })
          textToCopy = lines.join("\n")
        }
      } catch (e) {}
    }

    navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    toast.success("Note copied to clipboard!")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href)
      toast.success("Note link copied to clipboard!")
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const renderNoteBody = () => {
    if (!note?.content) {
      return (
        <Card className="rounded-3xl border-border/60 p-8 text-center bg-card">
          <p className="text-sm text-muted-foreground italic">Empty note content.</p>
        </Card>
      )
    }

    if (note.content.startsWith("{")) {
      try {
        const parsed = JSON.parse(note.content)
        if (parsed && Array.isArray(parsed.pages)) {
          return (
            <div className="space-y-6">
              {parsed.pages.map((page: any, idx: number) => (
                <Card
                  key={idx}
                  className="rounded-3xl border border-border/60 bg-card p-6 sm:p-8 shadow-xs relative overflow-hidden"
                >
                  <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-4">
                    <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                      <FileTextIcon className="size-4" /> Page {idx + 1}
                    </span>
                    {page.backgroundType && (
                      <Badge variant="secondary" className="text-[10px] uppercase font-semibold">
                        {page.backgroundType} background
                      </Badge>
                    )}
                  </div>

                  {Array.isArray(page.texts) && page.texts.length > 0 ? (
                    <div className="space-y-4">
                      {page.texts.map((txt: any, tIdx: number) => (
                        <div key={tIdx} className="bg-muted/20 p-4 rounded-2xl border border-border/40">
                          <MarkdownMathRenderer content={txt.text || ""} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No text content on this page.</p>
                  )}
                </Card>
              ))}
            </div>
          )
        }
      } catch (e) {}
    }

    return (
      <Card className="rounded-3xl border border-border/60 bg-card p-6 sm:p-10 shadow-xs">
        <MarkdownMathRenderer content={note.content} />
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6 py-6 px-4 lg:px-8 max-w-4xl mx-auto min-h-screen font-sans">
      {/* Navigation & Action Bar */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/student/${username}/notes`)}
          className="gap-2 text-xs rounded-xl hover:bg-muted cursor-pointer"
        >
          <ArrowLeftIcon className="size-4" /> Back to Notes
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="gap-1.5 text-xs rounded-xl cursor-pointer"
          >
            {copied ? <CheckIcon className="size-3.5 text-emerald-500" /> : <CopyIcon className="size-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="gap-1.5 text-xs rounded-xl cursor-pointer"
          >
            <Share2Icon className="size-3.5" /> Share
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-1.5 text-xs rounded-xl cursor-pointer"
          >
            <PrinterIcon className="size-3.5" /> Print
          </Button>
        </div>
      </div>

      {loading ? (
        <Card className="rounded-3xl p-8 animate-pulse border-border/60">
          <div className="h-6 bg-muted rounded w-1/3 mb-4" />
          <div className="h-8 bg-muted rounded w-2/3 mb-6" />
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-4/5" />
            <div className="h-4 bg-muted rounded w-3/4" />
          </div>
        </Card>
      ) : !note ? (
        <Card className="rounded-3xl p-12 text-center border-border/60">
          <BookOpenIcon className="size-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-base font-semibold text-foreground">Note not found</p>
          <p className="text-xs text-muted-foreground mt-1">This note may have been removed or is no longer published.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Minimal Note Header Banner */}
          <Card className="rounded-3xl border-border/60 shadow-xs overflow-hidden bg-gradient-to-b from-card to-muted/20">
            <CardHeader className="p-6 sm:p-8 pb-4">
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <Badge variant="outline" className="px-3 py-1 rounded-full text-xs font-bold gap-1.5 bg-primary/10 text-primary border-primary/20">
                  <TagIcon className="size-3" /> {note.subject || "General"}
                </Badge>
                {note.class && (
                  <Badge variant="secondary" className="px-2.5 py-1 rounded-full text-xs font-semibold gap-1">
                    <GraduationCapIcon className="size-3.5 text-primary" />
                    Class {note.class}{note.section ? `-${note.section}` : ""}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
                  <ClockIcon className="size-3.5" /> {calculateReadingTime(note.content)}
                </span>
              </div>

              <CardTitle className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground leading-tight">
                {note.title || "Untitled Note"}
              </CardTitle>
            </CardHeader>

            <CardContent className="px-6 sm:px-8 pb-6 pt-0 border-t border-border/40 mt-2 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-3 pt-3">
                <Avatar className="h-8 w-8 rounded-lg shrink-0">
                  <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold text-xs">
                    {getInitials(note.teacher_name || "Teacher")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground text-xs">
                    {note.teacher_name || "Teacher"}
                  </span>
                  <span className="text-[11px] text-muted-foreground">Author & Educator</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 pt-3">
                <CalendarIcon className="size-3.5 text-muted-foreground shrink-0" />
                <span>Updated {note.updated_at ? new Date(note.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Recently"}</span>
              </div>
            </CardContent>
          </Card>

          {/* Note Body with Markdown & MathJax support */}
          {renderNoteBody()}
        </div>
      )}
    </div>
  )
}
