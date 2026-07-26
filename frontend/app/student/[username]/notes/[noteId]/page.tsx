"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
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
  FileTextIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

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

export default function StudentNoteDetailPage() {
  const router = useRouter()
  const params = useParams<{ username: string; noteId: string }>()
  const username = params?.username || ""
  const noteId = params?.noteId || ""

  const [note, setNote] = React.useState<NoteDetail | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    if (!noteId) return

    fetch(`/api/backend/api/student/notes`)
      .then(r => r.json())
      .then(data => {
        const found = data.notes?.find((n: any) => n.id === noteId)
        if (found) {
          setNote(found)
        } else {
          return fetch(`/api/student/notes`)
            .then(r => r.json())
            .then(fallbackData => {
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
    toast.success("Note content copied to clipboard!")
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePrint = () => {
    window.print()
  }

  // Render canvas or plain text pages
  const renderNoteBody = () => {
    if (!note?.content) return <p className="text-muted-foreground">Empty note content.</p>

    if (note.content.startsWith("{")) {
      try {
        const parsed = JSON.parse(note.content)
        if (parsed && Array.isArray(parsed.pages)) {
          return (
            <div className="space-y-6">
              {parsed.pages.map((page: any, idx: number) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-border/60 bg-card p-6 shadow-xs relative overflow-hidden"
                >
                  <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-4">
                    <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                      <FileTextIcon className="size-4" /> Page {idx + 1}
                    </span>
                    {page.backgroundType && (
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground/70 bg-muted px-2 py-0.5 rounded">
                        {page.backgroundType} background
                      </span>
                    )}
                  </div>

                  {/* Texts list */}
                  {Array.isArray(page.texts) && page.texts.length > 0 ? (
                    <div className="space-y-3 font-mono text-sm leading-relaxed whitespace-pre-wrap">
                      {page.texts.map((txt: any, tIdx: number) => (
                        <div key={tIdx} className="bg-muted/30 p-3 rounded-xl border border-muted/50">
                          {txt.text}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No text content on this page.</p>
                  )}
                </div>
              ))}
            </div>
          )
        }
      } catch (e) {}
    }

    return (
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-xs leading-relaxed whitespace-pre-wrap font-sans text-foreground text-sm sm:text-base">
        {note.content}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 py-6 px-4 lg:px-8 max-w-4xl mx-auto min-h-screen">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/student/${username}/notes`)}
          className="gap-2 text-xs rounded-xl"
        >
          <ArrowLeftIcon className="size-4" /> Back to Notes
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="gap-1.5 text-xs rounded-xl"
          >
            {copied ? <CheckIcon className="size-3.5 text-emerald-500" /> : <CopyIcon className="size-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-1.5 text-xs rounded-xl"
          >
            <PrinterIcon className="size-3.5" /> Print
          </Button>
        </div>
      </div>

      {loading ? (
        <Card className="rounded-3xl p-8 animate-pulse">
          <div className="h-6 bg-muted rounded w-1/3 mb-4" />
          <div className="h-8 bg-muted rounded w-2/3 mb-6" />
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-4/5" />
            <div className="h-4 bg-muted rounded w-3/4" />
          </div>
        </Card>
      ) : !note ? (
        <Card className="rounded-3xl p-12 text-center">
          <p className="text-base font-semibold text-foreground">Note not found</p>
          <p className="text-xs text-muted-foreground mt-1">This note may have been removed or is no longer published.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Note Metadata Banner */}
          <Card className="rounded-3xl border-border/60 shadow-xs overflow-hidden">
            <CardHeader className="p-6 pb-4">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center gap-1.5">
                  <TagIcon className="size-3.5" /> {note.subject || "General"}
                </span>
                {note.class && (
                  <span className="px-2.5 py-1 rounded-full bg-muted text-foreground text-xs font-semibold flex items-center gap-1">
                    <GraduationCapIcon className="size-3.5 text-primary" />
                    Class {note.class}{note.section ? `-${note.section}` : ""}
                  </span>
                )}
              </div>

              <CardTitle className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground leading-tight">
                {note.title || "Untitled Note"}
              </CardTitle>
            </CardHeader>

            <CardContent className="px-6 pb-6 pt-0 border-t border-border/40 mt-2 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2 pt-3">
                <UserIcon className="size-4 text-primary shrink-0" />
                <span>Published by <strong className="text-foreground">{note.teacher_name || "Teacher"}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 pt-3">
                <CalendarIcon className="size-4 text-muted-foreground shrink-0" />
                <span>Updated {note.updated_at ? new Date(note.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "recently"}</span>
              </div>
            </CardContent>
          </Card>

          {/* Main Body */}
          {renderNoteBody()}
        </div>
      )}
    </div>
  )
}
