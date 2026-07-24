"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent,
  DragOverlay, DragStartEvent, useDraggable, DragOverEvent,
} from "@dnd-kit/core"
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ArrowLeft, Save, Eye, EyeOff, GripVertical, Trash2, Plus, Type, AlignLeft, Image, Square, Minus, Columns2, Monitor, Smartphone, Sparkles, Loader2, Video, List, Quote, AlertCircle, Badge, SeparatorHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Panel as ResizablePanel, Group as ResizablePanelGroup, Separator as ResizableHandle } from "react-resizable-panels"

const PANEL_SIZE_KEY = "vidya_pb_panel_size"

// ── Types ─────────────────────────────────────────────────────────────────────

type BlockType = "heading" | "paragraph" | "image" | "button" | "divider" | "columns" | "spacer" | "video" | "list" | "quote" | "alert" | "card"

interface Block {
  id: string
  type: BlockType
  props: Record<string, string>
}

// ── Block definitions ─────────────────────────────────────────────────────────

const BLOCK_DEFS: {
  type: BlockType
  label: string
  icon: React.ElementType
  defaultProps: Record<string, string>
  fields: { key: string; label: string; type: "text" | "textarea" | "select"; options?: string[] }[]
  render: (props: Record<string, string>) => React.ReactNode
}[] = [
  {
    type: "heading", label: "Heading", icon: Type,
    defaultProps: { text: "New Heading", level: "h2", align: "left" },
    fields: [
      { key: "text", label: "Text", type: "text" },
      { key: "level", label: "Level", type: "select", options: ["h1", "h2", "h3"] },
      { key: "align", label: "Align", type: "select", options: ["left", "center", "right"] },
    ],
    render: ({ text, level, align }) => {
      const Tag = (level || "h2") as keyof JSX.IntrinsicElements
      const sizes: Record<string, string> = { h1: "text-4xl", h2: "text-2xl", h3: "text-xl" }
      return <Tag className={cn("font-bold leading-tight", sizes[level] ?? "text-2xl", `text-${align ?? "left"}`)}>{text}</Tag>
    },
  },
  {
    type: "paragraph", label: "Paragraph", icon: AlignLeft,
    defaultProps: { text: "Start writing here...", align: "left" },
    fields: [
      { key: "text", label: "Text", type: "textarea" },
      { key: "align", label: "Align", type: "select", options: ["left", "center", "right"] },
    ],
    render: ({ text, align }) => (
      <p className={cn("leading-relaxed text-muted-foreground", `text-${align ?? "left"}`)}>{text}</p>
    ),
  },
  {
    type: "image", label: "Image", icon: Image,
    defaultProps: { src: "https://placehold.co/800x300", alt: "", rounded: "lg" },
    fields: [
      { key: "src", label: "URL", type: "text" },
      { key: "alt", label: "Alt text", type: "text" },
      { key: "rounded", label: "Rounded", type: "select", options: ["none", "md", "lg", "full"] },
    ],
    render: ({ src, alt, rounded }) => (
      <img src={src} alt={alt} className={cn("w-full object-cover max-h-72", `rounded-${rounded ?? "lg"}`)}
        onError={e => (e.currentTarget.src = "https://placehold.co/800x300")} />
    ),
  },
  {
    type: "button", label: "Button", icon: Square,
    defaultProps: { label: "Click Me", variant: "default", align: "left" },
    fields: [
      { key: "label", label: "Label", type: "text" },
      { key: "variant", label: "Variant", type: "select", options: ["default", "outline", "ghost"] },
      { key: "align", label: "Align", type: "select", options: ["left", "center", "right"] },
    ],
    render: ({ label, variant, align }) => {
      const styles: Record<string, string> = {
        default: "bg-foreground text-background hover:bg-foreground/90",
        outline: "border border-border text-foreground hover:bg-muted",
        ghost: "text-foreground hover:bg-muted",
      }
      const alignClass: Record<string, string> = { left: "justify-start", center: "justify-center", right: "justify-end" }
      return (
        <div className={cn("flex", alignClass[align ?? "left"])}>
          <button className={cn("px-5 py-2 rounded-lg text-sm font-medium transition-colors", styles[variant ?? "default"])}>{label}</button>
        </div>
      )
    },
  },
  {
    type: "divider", label: "Divider", icon: Minus,
    defaultProps: { spacing: "md" },
    fields: [
      { key: "spacing", label: "Spacing", type: "select", options: ["sm", "md", "lg"] },
    ],
    render: ({ spacing }) => {
      const py: Record<string, string> = { sm: "py-2", md: "py-4", lg: "py-8" }
      return <div className={py[spacing ?? "md"]}><Separator /></div>
    },
  },
  {
    type: "columns", label: "2 Columns", icon: Columns2,
    defaultProps: { left: "Left column content", right: "Right column content", gap: "6" },
    fields: [
      { key: "left", label: "Left", type: "textarea" },
      { key: "right", label: "Right", type: "textarea" },
      { key: "gap", label: "Gap", type: "select", options: ["2", "4", "6", "8"] },
    ],
    render: ({ left, right, gap }) => (
      <div className={cn("grid grid-cols-2", `gap-${gap ?? "6"}`)}>
        <p className="text-muted-foreground leading-relaxed">{left}</p>
        <p className="text-muted-foreground leading-relaxed">{right}</p>
      </div>
    ),
  },
  {
    type: "spacer", label: "Spacer", icon: SeparatorHorizontal,
    defaultProps: { height: "40" },
    fields: [{ key: "height", label: "Height (px)", type: "text" }],
    render: ({ height }) => <div style={{ height: `${height ?? 40}px` }} className="w-full" />,
  },
  {
    type: "video", label: "Video", icon: Video,
    defaultProps: { url: "https://www.youtube.com/embed/dQw4w9WgXcQ", rounded: "lg" },
    fields: [
      { key: "url", label: "Embed URL", type: "text" },
      { key: "rounded", label: "Rounded", type: "select", options: ["none", "md", "lg"] },
    ],
    render: ({ url, rounded }) => (
      <div className={cn("overflow-hidden aspect-video w-full", `rounded-${rounded ?? "lg"}`)}>
        <iframe src={url} className="w-full h-full" allowFullScreen />
      </div>
    ),
  },
  {
    type: "list", label: "List", icon: List,
    defaultProps: { items: "Item one\nItem two\nItem three", style: "bullet" },
    fields: [
      { key: "items", label: "Items (one per line)", type: "textarea" },
      { key: "style", label: "Style", type: "select", options: ["bullet", "numbered"] },
    ],
    render: ({ items, style }) => {
      const lines = (items ?? "").split("\n").filter(Boolean)
      const Tag = style === "numbered" ? "ol" : "ul"
      return (
        <Tag className={cn("pl-5 space-y-1 text-muted-foreground text-sm", style === "numbered" ? "list-decimal" : "list-disc")}>
          {lines.map((l, i) => <li key={i}>{l}</li>)}
        </Tag>
      )
    },
  },
  {
    type: "quote", label: "Quote", icon: Quote,
    defaultProps: { text: "An inspiring quote goes here.", author: "Author Name" },
    fields: [
      { key: "text", label: "Quote", type: "textarea" },
      { key: "author", label: "Author", type: "text" },
    ],
    render: ({ text, author }) => (
      <blockquote className="border-l-4 border-foreground/20 pl-4 py-1">
        <p className="text-base italic text-muted-foreground">"{text}"</p>
        {author && <cite className="text-xs text-muted-foreground/60 mt-1 block not-italic">— {author}</cite>}
      </blockquote>
    ),
  },
  {
    type: "alert", label: "Alert", icon: AlertCircle,
    defaultProps: { text: "This is an important notice.", variant: "info" },
    fields: [
      { key: "text", label: "Message", type: "textarea" },
      { key: "variant", label: "Variant", type: "select", options: ["info", "success", "warning", "error"] },
    ],
    render: ({ text, variant }) => {
      const styles: Record<string, string> = {
        info: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-300",
        success: "bg-green-50 border-green-200 text-green-800 dark:bg-green-950/30 dark:border-green-800 dark:text-green-300",
        warning: "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950/30 dark:border-yellow-800 dark:text-yellow-300",
        error: "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/30 dark:border-red-800 dark:text-red-300",
      }
      return <div className={cn("border rounded-lg px-4 py-3 text-sm", styles[variant ?? "info"])}>{text}</div>
    },
  },
  {
    type: "card", label: "Card", icon: Badge,
    defaultProps: { title: "Card Title", body: "Card description goes here.", footer: "Footer text" },
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "body", label: "Body", type: "textarea" },
      { key: "footer", label: "Footer", type: "text" },
    ],
    render: ({ title, body, footer }) => (
      <div className="border rounded-xl overflow-hidden">
        <div className="p-4 space-y-1">
          <p className="font-semibold text-sm">{title}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
        </div>
        {footer && <div className="border-t px-4 py-2 text-xs text-muted-foreground bg-muted/30">{footer}</div>}
      </div>
    ),
  },
]

// ── Storage ───────────────────────────────────────────────────────────────────

const STORAGE_KEY = "vidya_pages"
function getPages(): any[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") } catch { return [] }
}

// ── Draggable palette item ────────────────────────────────────────────────────

function DraggablePaletteItem({ type, label, icon: Icon, onClick }: {
  type: BlockType; label: string; icon: React.ElementType; onClick: () => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `palette:${type}`, data: { type, source: "palette" } })
  return (
    <button
      ref={setNodeRef} {...listeners} {...attributes}
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-grab active:cursor-grabbing",
        isDragging && "opacity-40"
      )}
    >
      <Icon className="size-3.5 shrink-0" />{label}
      <Plus className="size-3 ml-auto" />
    </button>
  )
}

// ── Sortable block ────────────────────────────────────────────────────────────

function SortableBlock({ block, isSelected, isDropTarget, onSelect, onDelete, onPropChange }: {
  block: Block; isSelected: boolean; isDropTarget?: boolean; onSelect: () => void; onDelete: () => void
  onPropChange: (key: string, val: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id })
  const def = BLOCK_DEFS.find(d => d.type === block.type)!
  const [editing, setEditing] = React.useState(false)

  // Primary editable field (first text/textarea field)
  const primaryField = def.fields.find(f => f.type === "text" || f.type === "textarea")

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onClick={onSelect}
      onDoubleClick={e => { e.stopPropagation(); if (primaryField) setEditing(true) }}
      className={cn(
        "group relative rounded-xl border bg-background transition-all cursor-pointer",
        isSelected ? "border-foreground/40 ring-1 ring-foreground/10 shadow-sm" : "border-border hover:border-foreground/20",
        isDragging && "opacity-50 z-50",
        isDropTarget && "ring-2 ring-primary ring-offset-1"
      )}
    >
      <div
        {...attributes} {...listeners}
        onClick={e => e.stopPropagation()}
        className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-30 cursor-grab active:cursor-grabbing p-1"
      >
        <GripVertical className="size-4" />
      </div>

      <button
        onClick={e => { e.stopPropagation(); onDelete() }}
        className="absolute right-2 top-2 opacity-0 group-hover:opacity-50 hover:!opacity-100 p-1 rounded-md hover:bg-destructive/10 hover:text-destructive transition-all cursor-pointer"
      >
        <Trash2 className="size-3.5" />
      </button>

      <div className="px-8 py-4">
        {editing && primaryField ? (
          primaryField.type === "textarea" ? (
            <textarea
              autoFocus
              value={block.props[primaryField.key] ?? ""}
              onChange={e => onPropChange(primaryField.key, e.target.value)}
              onBlur={() => setEditing(false)}
              onClick={e => e.stopPropagation()}
              className="w-full bg-transparent border-none outline-none resize-none text-sm leading-relaxed text-muted-foreground"
              rows={3}
            />
          ) : (
            <input
              autoFocus
              value={block.props[primaryField.key] ?? ""}
              onChange={e => onPropChange(primaryField.key, e.target.value)}
              onBlur={() => setEditing(false)}
              onClick={e => e.stopPropagation()}
              className="w-full bg-transparent border-none outline-none text-sm font-bold"
            />
          )
        ) : (
          def.render(block.props)
        )}
      </div>

      {isSelected && (
        <span className="absolute -top-2.5 left-3 px-1.5 py-0.5 rounded text-[10px] font-medium bg-foreground text-background">
          {def.label}
        </span>
      )}
    </div>
  )
}

// ── Props panel ───────────────────────────────────────────────────────────────

function PropsPanel({ block, onChange }: { block: Block; onChange: (key: string, val: string) => void }) {
  const def = BLOCK_DEFS.find(d => d.type === block.type)!
  return (
    <div className="space-y-4 p-4">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{def.label} Properties</p>
      {def.fields.map(field => (
        <div key={field.key} className="space-y-1.5">
          <Label className="text-xs">{field.label}</Label>
          {field.type === "textarea" ? (
            <Textarea value={block.props[field.key] ?? ""} onChange={e => onChange(field.key, e.target.value)} className="text-xs min-h-[80px] resize-none" />
          ) : field.type === "select" ? (
            <Select value={block.props[field.key] ?? ""} onValueChange={v => onChange(field.key, v)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {field.options!.map(o => <SelectItem key={o} value={o} className="text-xs">{o}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : (
            <Input value={block.props[field.key] ?? ""} onChange={e => onChange(field.key, e.target.value)} className="h-8 text-xs" />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function PageEditorPage() {
  const params = useParams()
  const router = useRouter()
  const username = params?.username as string
  const uid = params?.uid as string

  const [blocks, setBlocks] = React.useState<Block[]>([])
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [preview, setPreview] = React.useState(false)
  const [viewport, setViewport] = React.useState<"desktop" | "mobile">("desktop")
  const [pageName, setPageName] = React.useState("Untitled Page")
  const [slug, setSlug] = React.useState("")
  const [saved, setSaved] = React.useState(false)

  React.useEffect(() => {
    const page = getPages().find((p: any) => p.uid === uid)
    if (page) {
      setPageName(page.name ?? "Untitled Page")
      setSlug(page.slug ?? "")
      if (page.blocks) setBlocks(page.blocks)
    }
  }, [uid])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const [activeDragType, setActiveDragType] = React.useState<BlockType | null>(null)
  const [overBlockId, setOverBlockId] = React.useState<string | null>(null)

  const handleDragStart = (e: DragStartEvent) => {
    if (e.active.data.current?.source === "palette") {
      setActiveDragType(e.active.data.current.type as BlockType)
    }
  }

  const handleDragOver = (e: DragOverEvent) => {
    if (e.over && e.active.data.current?.source === "palette") {
      setOverBlockId(e.over.id as string)
    }
  }

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    setActiveDragType(null)
    setOverBlockId(null)

    if (active.data.current?.source === "palette") {
      // Drop from palette onto canvas
      const type = active.data.current.type as BlockType
      const def = BLOCK_DEFS.find(d => d.type === type)!
      const block: Block = { id: crypto.randomUUID(), type, props: { ...def.defaultProps } }
      if (over && over.id !== "canvas-drop") {
        // Insert after the block being hovered
        setBlocks(prev => {
          const idx = prev.findIndex(b => b.id === over.id)
          const next = [...prev]
          next.splice(idx + 1, 0, block)
          return next
        })
      } else {
        setBlocks(prev => [...prev, block])
      }
      setSelectedId(block.id)
    } else if (over && active.id !== over.id) {
      // Reorder existing blocks
      setBlocks(prev => arrayMove(prev, prev.findIndex(b => b.id === active.id), prev.findIndex(b => b.id === over.id)))
    }
  }

  const addBlock = (type: BlockType) => {
    const def = BLOCK_DEFS.find(d => d.type === type)!
    const block: Block = { id: crypto.randomUUID(), type, props: { ...def.defaultProps } }
    setBlocks(prev => [...prev, block])
    setSelectedId(block.id)
  }

  const handleSave = () => {
    const pages = getPages()
    const idx = pages.findIndex((p: any) => p.uid === uid)
    const entry = { uid, name: pageName, slug: slug || `page-${uid.slice(0, 6)}`, blocks, updatedAt: new Date().toISOString() }
    if (idx >= 0) pages[idx] = entry; else pages.push(entry)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pages))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const selectedBlock = blocks.find(b => b.id === selectedId) ?? null

  const [leftSize, setLeftSize] = React.useState<number>(() => {
    if (typeof window === "undefined") return 18
    return Number(localStorage.getItem(PANEL_SIZE_KEY) ?? 18)
  })

  const handleLeftResize = (size: number) => {
    setLeftSize(size)
    localStorage.setItem(PANEL_SIZE_KEY, String(size))
  }

  const [aiPrompt, setAiPrompt] = React.useState("")
  const [aiLoading, setAiLoading] = React.useState(false)
  const [aiMessages, setAiMessages] = React.useState<{ role: "user" | "assistant"; text: string }[]>([])
  const aiBottomRef = React.useRef<HTMLDivElement>(null)

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim() || aiLoading) return
    const prompt = aiPrompt.trim()
    setAiMessages(prev => [...prev, { role: "user", text: prompt }])
    setAiPrompt("")
    setAiLoading(true)
    await new Promise(r => setTimeout(r, 1200))
    const generated: Block[] = [
      { id: crypto.randomUUID(), type: "heading", props: { text: prompt, level: "h2", align: "center" } },
      { id: crypto.randomUUID(), type: "paragraph", props: { text: `This section is about: ${prompt}. Edit this content to match your needs.`, align: "left" } },
      { id: crypto.randomUUID(), type: "button", props: { label: "Learn More", variant: "default", align: "center" } },
    ]
    setBlocks(prev => [...prev, ...generated])
    setAiMessages(prev => [...prev, { role: "assistant", text: `Added ${generated.length} blocks for "${prompt}".` }])
    setAiLoading(false)
    setTimeout(() => aiBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50)
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">

      {/* Top bar */}
      <div className="flex items-center gap-2 px-4 h-12 border-b shrink-0">
        <Button variant="ghost" size="icon" className="size-7" onClick={() => router.push(`/admin/${username}/page-builder`)}>
          <ArrowLeft className="size-4" />
        </Button>
        <Separator orientation="vertical" className="h-4 mx-1" />
        <Input value={pageName} onChange={e => setPageName(e.target.value)} className="h-7 text-sm font-medium border-0 shadow-none px-1 w-40 focus-visible:ring-0" />
        <span className="text-muted-foreground/40 text-xs">/</span>
        <Input value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))} placeholder="slug" className="h-7 text-xs font-mono border-0 shadow-none px-1 w-28 focus-visible:ring-0 text-muted-foreground" />
        <div className="flex-1" />
        {preview && (
          <div className="flex items-center border rounded-lg p-0.5 gap-0.5">
            <button onClick={() => setViewport("desktop")} className={cn("p-1.5 rounded-md transition-colors cursor-pointer", viewport === "desktop" ? "bg-muted" : "hover:bg-muted/50")}><Monitor className="size-3.5" /></button>
            <button onClick={() => setViewport("mobile")} className={cn("p-1.5 rounded-md transition-colors cursor-pointer", viewport === "mobile" ? "bg-muted" : "hover:bg-muted/50")}><Smartphone className="size-3.5" /></button>
          </div>
        )}
        <Button variant="outline" size="sm" onClick={() => setPreview(p => !p)} className="h-7 text-xs gap-1.5">
          {preview ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
          {preview ? "Edit" : "Preview"}
        </Button>
        <Button size="sm" onClick={handleSave} className="h-7 text-xs gap-1.5">
          <Save className="size-3" />
          {saved ? "Saved!" : "Save"}
        </Button>
      </div>

      {/* Body */}
      {preview ? (
        <div className="flex-1 overflow-y-auto bg-muted/20">
          <div className={cn("mx-auto my-8 bg-background rounded-xl border shadow-sm p-10 space-y-6 transition-all",
            viewport === "mobile" ? "max-w-sm" : "max-w-3xl")}>
            {blocks.map(b => {
              const def = BLOCK_DEFS.find(d => d.type === b.type)!
              return <div key={b.id}>{def.render(b.props)}</div>
            })}
            {blocks.length === 0 && <p className="text-center text-muted-foreground text-sm py-10">No blocks yet</p>}
          </div>
        </div>
      ) : (
        <ResizablePanelGroup orientation="horizontal" className="flex-1 min-h-0 h-full">

          {/* Left: palette */}
          <ResizablePanel defaultSize={`${leftSize}%`} minSize="12%" maxSize="30%" onResize={handleLeftResize} className="border-r overflow-hidden flex flex-col">
            <Tabs defaultValue="blocks" className="flex flex-col flex-1 overflow-hidden">
              <TabsList className="w-full rounded-none shrink-0 bg-transparent">
                <TabsTrigger value="blocks" className="flex-1 text-xs">Blocks</TabsTrigger>
                <TabsTrigger value="ai" className="flex-1 text-xs">AI</TabsTrigger>
              </TabsList>
              <TabsContent value="blocks" className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5 mt-0">
                {BLOCK_DEFS.map(({ type, label, icon: Icon }) => (
                  <DraggablePaletteItem key={type} type={type} label={label} icon={Icon} onClick={() => addBlock(type)} />
                ))}
              </TabsContent>
              <TabsContent value="ai" className="flex-1 overflow-hidden mt-0 flex flex-col">
                <ScrollArea className="flex-1 px-3 py-2">
                  <div className="space-y-2">
                  {aiMessages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground/40 py-8">
                      <Sparkles className="size-6" />
                      <p className="text-xs text-center">Describe a section and AI will add blocks for you.</p>
                    </div>
                  )}
                  {aiMessages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] rounded-xl px-3 py-1.5 text-xs ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                  {aiLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-xl px-3 py-1.5 text-xs flex items-center gap-1.5 text-muted-foreground">
                        <Loader2 className="size-3 animate-spin" /> Generating...
                      </div>
                    </div>
                  )}
                  <div ref={aiBottomRef} />
                  </div>
                </ScrollArea>
                <div className="border-t px-2 py-2 flex gap-1.5 items-end shrink-0">
                  <Textarea
                    placeholder="Ask AI to build a section..."
                    className="text-xs resize-none min-h-[36px] max-h-[100px] flex-1"
                    rows={1}
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAiGenerate() } }}
                  />
                  <Button size="icon" className="size-8 shrink-0" onClick={handleAiGenerate} disabled={aiLoading}>
                    <Sparkles className="size-3.5" />
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Center: canvas */}
          <ResizablePanel defaultSize={`${100 - leftSize - 18}%`} minSize="40%" className="overflow-y-auto bg-muted/20" onClick={() => setSelectedId(null)}>
            <div className="max-w-3xl mx-auto my-8 space-y-2 px-4" onClick={e => e.stopPropagation()}>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
                <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                  {blocks.map(block => (
                    <React.Fragment key={block.id}>
                      <SortableBlock block={block}
                        isSelected={selectedId === block.id}
                        isDropTarget={overBlockId === block.id && activeDragType !== null}
                        onSelect={() => setSelectedId(block.id)}
                        onPropChange={(key, val) => setBlocks(prev => prev.map(b => b.id === block.id ? { ...b, props: { ...b.props, [key]: val } } : b))}
                        onDelete={() => { setBlocks(p => p.filter(b => b.id !== block.id)); if (selectedId === block.id) setSelectedId(null) }}
                      />
                    </React.Fragment>
                  ))}
                </SortableContext>
                <DragOverlay dropAnimation={null}>
                  {activeDragType && (() => {
                    const def = BLOCK_DEFS.find(d => d.type === activeDragType)!
                    return (
                      <div className="rounded-xl border border-dashed border-foreground/30 bg-background/80 backdrop-blur px-8 py-4 shadow-lg opacity-90 pointer-events-none">
                        {def.render(def.defaultProps)}
                      </div>
                    )
                  })()}
                </DragOverlay>
              </DndContext>
              {blocks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 text-muted-foreground/30 gap-3 border-2 border-dashed rounded-xl">
                  <Type className="size-10" />
                  <p className="text-sm">Pick a block from the left or drag it here</p>
                </div>
              )}
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right: props */}
          <ResizablePanel defaultSize="18%" minSize="14%" maxSize="30%" className="border-l overflow-y-auto">
            {selectedBlock ? (
              <PropsPanel block={selectedBlock} onChange={(key, val) => setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? { ...b, props: { ...b.props, [key]: val } } : b))} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground/30 gap-2 p-4 text-center">
                <Square className="size-8" />
                <p className="text-xs">Select a block to edit its properties</p>
              </div>
            )}
          </ResizablePanel>

        </ResizablePanelGroup>
      )}
    </div>
  )
}
