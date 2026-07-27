"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  ArrowLeft,
  Save,
  Eye,
  GripVertical,
  Trash2,
  Plus,
  Type,
  Image as ImageIcon,
  Square,
  Minus,
  Monitor,
  Smartphone,
  Tablet,
  Sparkles,
  Loader2,
  Video,
  List,
  Quote,
  AlertCircle,
  Badge as BadgeIcon,
  Copy,
  ChevronUp,
  ChevronDown,
  LayoutGrid,
  Layers,
  Search,
  Settings,
  ChevronLeft,
  ChevronRight,
  Code2,
  Check,
  PanelLeftClose,
  PanelLeftOpen,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkle,
  SlidersHorizontal,
  X,
  FileText,
  MousePointer,
  HelpCircle,
  Share2,
  Download,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const STORAGE_KEY = "vidya_pages"

function getPages(): any[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
  } catch {
    return []
  }
}

function savePages(pages: any[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pages))
}

// ── Block Types ───────────────────────────────────────────────────────────────

type BlockType =
  | "heading"
  | "paragraph"
  | "image"
  | "button"
  | "divider"
  | "spacer"
  | "video"
  | "list"
  | "quote"
  | "alert"
  | "card"
  | "badge"

type PrimaryTab = "layers" | "components" | "typography" | "elements" | "media" | "ai" | "settings"
type ViewportMode = "desktop" | "tablet" | "mobile"

interface Block {
  id: string
  type: BlockType
  props: Record<string, string>
}

// Default properties generator
function createDefaultBlock(type: BlockType): Block {
  const id = `block-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  switch (type) {
    case "heading":
      return { id, type, props: { text: "Heading Title", level: "h2", align: "left", color: "#09090b" } }
    case "paragraph":
      return { id, type, props: { text: "Write your text content here. You can customize fonts, colors, and margins in the inspector panel.", align: "left" } }
    case "image":
      return { id, type, props: { src: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60", alt: "Sample Image", caption: "", width: "100%", borderRadius: "12px" } }
    case "button":
      return { id, type, props: { label: "Click Here", link: "#", variant: "default", size: "default" } }
    case "divider":
      return { id, type, props: { style: "solid", color: "#e4e4e7", margin: "24px" } }
    case "spacer":
      return { id, type, props: { height: "40px" } }
    case "video":
      return { id, type, props: { url: "https://www.youtube.com/embed/dQw4w9WgXcQ", title: "Sample Video" } }
    case "list":
      return { id, type, props: { items: "First item\nSecond item\nThird item", style: "disc" } }
    case "quote":
      return { id, type, props: { quote: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" } }
    case "alert":
      return { id, type, props: { title: "Important Announcement", description: "Classes will resume as scheduled tomorrow morning.", variant: "info" } }
    case "card":
      return { id, type, props: { title: "Feature Card", description: "Interactive learning tools designed for modern classrooms.", buttonText: "Learn More" } }
    case "badge":
      return { id, type, props: { label: "NEW FEATURE", variant: "primary" } }
    default:
      return { id, type: "paragraph", props: { text: "Content block" } }
  }
}

// Catalog of available items for left sidebar panels
const COMPONENT_CATALOG: { type: BlockType; name: string; category: "basic" | "layout" | "media" | "interactive"; icon: any; description: string }[] = [
  { type: "heading", name: "Heading", category: "basic", icon: Type, description: "H1, H2, or H3 Title" },
  { type: "paragraph", name: "Paragraph", category: "basic", icon: FileText, description: "Body text paragraph" },
  { type: "button", name: "Button", category: "interactive", icon: MousePointer, description: "Action call-to-action button" },
  { type: "image", name: "Image", category: "media", icon: ImageIcon, description: "Responsive image block" },
  { type: "card", name: "Card Box", category: "layout", icon: Square, description: "Container card with header & text" },
  { type: "badge", name: "Badge Pill", category: "basic", icon: BadgeIcon, description: "Status label pill" },
  { type: "alert", name: "Alert Callout", category: "layout", icon: AlertCircle, description: "Notice callout box" },
  { type: "quote", name: "Quote", category: "basic", icon: Quote, description: "Blockquote with attribution" },
  { type: "list", name: "Bullet List", category: "basic", icon: List, description: "Unordered / ordered list" },
  { type: "video", name: "Video Embed", category: "media", icon: Video, description: "YouTube / Vimeo embed" },
  { type: "divider", name: "Divider Line", category: "layout", icon: Minus, description: "Horizontal rule separator" },
  { type: "spacer", name: "Spacer", category: "layout", icon: SlidersHorizontal, description: "Vertical spacing gap" },
]

// ── Sortable Canvas Block Wrapper ──────────────────────────────────────────────

function SortableBlockWrapper({
  block,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  block: Block
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
  onDuplicate: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  isFirst: boolean
  isLast: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
      className={cn(
        "group relative rounded-xl transition-all duration-150 cursor-pointer p-3 sm:p-4 my-2 border border-transparent",
        isSelected
          ? "ring-2 ring-primary ring-offset-2 bg-primary/[0.02] border-primary/30"
          : "hover:border-border/60 hover:bg-muted/30"
      )}
    >
      {/* Figma Selection Label & Quick Actions Floating Toolbar */}
      {isSelected && (
        <div className="absolute -top-3.5 right-3 z-30 flex items-center gap-1 rounded-lg bg-primary text-primary-foreground text-[10px] font-semibold px-2 py-0.5 shadow-md">
          <span className="capitalize">{block.type}</span>
          <div className="h-3 w-[1px] bg-primary-foreground/30 mx-1" />
          <button
            onClick={(e) => {
              e.stopPropagation()
              onMoveUp()
            }}
            disabled={isFirst}
            className="hover:opacity-80 disabled:opacity-30 cursor-pointer"
            title="Move Up"
          >
            <ChevronUp className="size-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onMoveDown()
            }}
            disabled={isLast}
            className="hover:opacity-80 disabled:opacity-30 cursor-pointer"
            title="Move Down"
          >
            <ChevronDown className="size-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDuplicate()
            }}
            className="hover:opacity-80 cursor-pointer ml-1"
            title="Duplicate"
          >
            <Copy className="size-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="hover:opacity-80 text-rose-200 cursor-pointer ml-1"
            title="Delete"
          >
            <Trash2 className="size-3" />
          </button>
        </div>
      )}

      {/* Drag Grip Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-1"
      >
        <GripVertical className="size-4" />
      </div>

      {/* Block Preview Content */}
      <div className="pl-4">
        {block.type === "heading" && (
          <h2
            className={cn(
              "font-extrabold tracking-tight text-foreground",
              block.props.level === "h1" && "text-3xl sm:text-4xl",
              block.props.level === "h2" && "text-2xl sm:text-3xl",
              block.props.level === "h3" && "text-xl sm:text-2xl"
            )}
            style={{ textAlign: (block.props.align as any) || "left", color: block.props.color }}
          >
            {block.props.text || "Untitled Heading"}
          </h2>
        )}

        {block.type === "paragraph" && (
          <p
            className="text-sm sm:text-base text-foreground/80 leading-relaxed"
            style={{ textAlign: (block.props.align as any) || "left" }}
          >
            {block.props.text || "Empty paragraph"}
          </p>
        )}

        {block.type === "button" && (
          <div className="py-1">
            <Button
              variant={block.props.variant as any || "default"}
              size={block.props.size as any || "default"}
              className="rounded-xl shadow-xs pointer-events-none"
            >
              {block.props.label || "Button"}
            </Button>
          </div>
        )}

        {block.type === "image" && (
          <div className="py-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={block.props.src}
              alt={block.props.alt || ""}
              className="max-w-full h-auto object-cover shadow-sm"
              style={{ borderRadius: block.props.borderRadius || "12px", width: block.props.width || "100%" }}
            />
            {block.props.caption && (
              <p className="text-xs text-center text-muted-foreground mt-1.5 italic">{block.props.caption}</p>
            )}
          </div>
        )}

        {block.type === "divider" && (
          <div className="py-2">
            <Separator style={{ backgroundColor: block.props.color || undefined }} />
          </div>
        )}

        {block.type === "spacer" && (
          <div
            className="w-full bg-muted/20 border border-dashed border-muted-foreground/20 rounded-lg flex items-center justify-center text-[10px] text-muted-foreground font-mono"
            style={{ height: block.props.height || "40px" }}
          >
            Spacer ({block.props.height || "40px"})
          </div>
        )}

        {block.type === "card" && (
          <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs space-y-2">
            <h3 className="font-bold text-base text-foreground">{block.props.title || "Card Title"}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{block.props.description}</p>
            {block.props.buttonText && (
              <Button size="sm" variant="outline" className="mt-2 text-xs rounded-lg pointer-events-none">
                {block.props.buttonText}
              </Button>
            )}
          </div>
        )}

        {block.type === "badge" && (
          <div className="py-1">
            <Badge variant="secondary" className="px-3 py-1 rounded-full text-xs font-bold">
              {block.props.label || "BADGE"}
            </Badge>
          </div>
        )}

        {block.type === "alert" && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-1">
            <h4 className="font-bold text-xs text-primary flex items-center gap-1.5">
              <AlertCircle className="size-3.5" /> {block.props.title || "Notice"}
            </h4>
            <p className="text-xs text-foreground/80 leading-relaxed">{block.props.description}</p>
          </div>
        )}

        {block.type === "quote" && (
          <blockquote className="border-l-4 border-primary pl-4 py-1 my-1 italic text-sm text-foreground/90 font-serif">
            &quot;{block.props.quote}&quot;
            {block.props.author && (
              <footer className="text-xs text-muted-foreground font-sans not-italic mt-1 font-semibold">
                — {block.props.author}
              </footer>
            )}
          </blockquote>
        )}

        {block.type === "list" && (
          <ul className="list-disc list-inside text-sm space-y-1 text-foreground/90">
            {(block.props.items || "").split("\n").map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        )}

        {block.type === "video" && (
          <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black/90 flex items-center justify-center text-white">
            <iframe
              src={block.props.url}
              title={block.props.title || "Video"}
              className="w-full h-full pointer-events-none"
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Figma-Style Page Builder Component ───────────────────────────────────

export default function FigmaPageBuilderPage() {
  const router = useRouter()
  const { username, uid } = useParams<{ username: string; uid: string }>()

  // Canvas & Page States
  const [pageTitle, setPageTitle] = React.useState("Untitled Page")
  const [pageSlug, setPageSlug] = React.useState("untitled")
  const [blocks, setBlocks] = React.useState<Block[]>([])
  const [selectedBlockId, setSelectedBlockId] = React.useState<string | null>(null)

  // Figma Sidebar States
  const [activePrimaryTab, setActivePrimaryTab] = React.useState<PrimaryTab | null>("components")
  const [isSecondaryOpen, setIsSecondaryOpen] = React.useState(true)

  // Viewport & Zoom States
  const [viewportMode, setViewportMode] = React.useState<ViewportMode>("desktop")
  const [zoomLevel, setZoomLevel] = React.useState(100)
  const [isPreview, setIsPreview] = React.useState(false)

  // Modals & AI States
  const [isCodeModalOpen, setIsCodeModalOpen] = React.useState(false)
  const [aiPrompt, setAiPrompt] = React.useState("")
  const [aiLoading, setAiLoading] = React.useState(false)
  const [componentSearch, setComponentSearch] = React.useState("")
  const [layerSearch, setLayerSearch] = React.useState("")

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  // Load Page Data from LocalStorage / DB
  React.useEffect(() => {
    if (!uid) return
    const allPages = getPages()
    const found = allPages.find((p) => p.uid === uid || p.id === uid)
    if (found) {
      setPageTitle(found.title || "Untitled Page")
      setPageSlug(found.slug || "untitled")
      if (Array.isArray(found.blocks)) {
        setBlocks(found.blocks)
      } else {
        // Initial sample blocks if brand new
        setBlocks([
          createDefaultBlock("heading"),
          createDefaultBlock("paragraph"),
          createDefaultBlock("button"),
        ])
      }
    } else {
      // Default initial layout
      setBlocks([
        createDefaultBlock("heading"),
        createDefaultBlock("paragraph"),
        createDefaultBlock("button"),
      ])
    }
  }, [uid])

  // Save Page
  const handleSave = () => {
    const allPages = getPages()
    const now = new Date().toISOString()
    const updatedPages = allPages.map((p) => {
      if (p.uid === uid || p.id === uid) {
        return { ...p, title: pageTitle, slug: pageSlug, blocks, updatedAt: now }
      }
      return p
    })
    savePages(updatedPages)
    toast.success("Page saved successfully!")
  }

  // Add block to canvas
  const handleAddBlock = (type: BlockType) => {
    const newBlock = createDefaultBlock(type)
    setBlocks((prev) => [...prev, newBlock])
    setSelectedBlockId(newBlock.id)
    toast.success(`Added ${type} component`)
  }

  // Block management functions
  const handleDeleteBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id))
    if (selectedBlockId === id) setSelectedBlockId(null)
    toast.success("Component deleted")
  }

  const handleDuplicateBlock = (id: string) => {
    const target = blocks.find((b) => b.id === id)
    if (!target) return
    const dup: Block = {
      ...JSON.parse(JSON.stringify(target)),
      id: `block-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    }
    const idx = blocks.findIndex((b) => b.id === id)
    const next = [...blocks]
    next.splice(idx + 1, 0, dup)
    setBlocks(next)
    setSelectedBlockId(dup.id)
    toast.success("Component duplicated")
  }

  const handleMoveBlock = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return
    if (direction === "down" && index === blocks.length - 1) return
    const targetIndex = direction === "up" ? index - 1 : index + 1
    setBlocks((prev) => arrayMove(prev, index, targetIndex))
  }

  // Drag and Drop End Handler
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setBlocks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  // Selected Block object
  const selectedBlock = React.useMemo(
    () => blocks.find((b) => b.id === selectedBlockId) || null,
    [blocks, selectedBlockId]
  )

  // Filtered Component Catalog
  const filteredCatalog = React.useMemo(() => {
    if (!componentSearch.trim()) return COMPONENT_CATALOG
    const q = componentSearch.toLowerCase()
    return COMPONENT_CATALOG.filter(
      (c) => c.name.toLowerCase().includes(q) || c.type.toLowerCase().includes(q)
    )
  }, [componentSearch])

  // AI Layout Generator
  const handleGenerateAi = async () => {
    if (!aiPrompt.trim()) return
    setAiLoading(true)
    try {
      // Generate sample blocks based on prompt
      const generated: Block[] = [
        { id: `ai-${Date.now()}-1`, type: "heading", props: { text: `Welcome to ${aiPrompt}`, level: "h1", align: "center", color: "#18181b" } },
        { id: `ai-${Date.now()}-2`, type: "paragraph", props: { text: "Custom page generated automatically by Vidya AI Page Builder assistant.", align: "center" } },
        { id: `ai-${Date.now()}-3`, type: "card", props: { title: "Explore Features", description: "Interactive educational modules built for seamless learning.", buttonText: "Get Started" } },
        { id: `ai-${Date.now()}-4`, type: "button", props: { label: "Join Now", link: "#", variant: "default", size: "default" } },
      ]
      setBlocks(generated)
      toast.success("AI layout generated!")
    } catch (err) {
      toast.error("Failed to generate layout")
    } finally {
      setAiLoading(false)
    }
  }

  // Primary Tab Click Handler (Figma style dual sidebar logic)
  const handlePrimaryTabClick = (tab: PrimaryTab) => {
    if (activePrimaryTab === tab) {
      setIsSecondaryOpen(!isSecondaryOpen)
    } else {
      setActivePrimaryTab(tab)
      setIsSecondaryOpen(true)
    }
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen w-screen bg-background overflow-hidden font-sans select-none">
        {/* ── Figma Top Header Bar ────────────────────────────────────────── */}
        <header className="h-12 border-b border-border bg-card px-4 flex items-center justify-between z-40 shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg cursor-pointer text-muted-foreground hover:text-foreground"
              onClick={() => router.push(`/admin/${username}/page-builder`)}
              title="Back to Pages"
            >
              <ArrowLeft className="size-4" />
            </Button>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-2">
              <Input
                value={pageTitle}
                onChange={(e) => setPageTitle(e.target.value)}
                className="h-7 text-xs font-bold w-44 bg-transparent border-transparent hover:border-border focus:border-primary"
              />
              <Badge variant="outline" className="text-[10px] uppercase font-mono px-1.5 h-4">
                {pageSlug}
              </Badge>
            </div>
          </div>

          {/* Viewport Switcher Controls */}
          <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/50">
            <button
              onClick={() => setViewportMode("desktop")}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                viewportMode === "desktop" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Monitor className="size-3.5" /> <span className="hidden sm:inline">Desktop</span>
            </button>
            <button
              onClick={() => setViewportMode("tablet")}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                viewportMode === "tablet" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Tablet className="size-3.5" /> <span className="hidden sm:inline">Tablet</span>
            </button>
            <button
              onClick={() => setViewportMode("mobile")}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                viewportMode === "mobile" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Smartphone className="size-3.5" /> <span className="hidden sm:inline">Mobile</span>
            </button>
          </div>

          {/* Zoom & Action Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-muted/20 px-2 py-1 rounded-lg text-xs font-mono">
              <button
                onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
                className="hover:text-foreground text-muted-foreground cursor-pointer"
              >
                <ZoomOut className="size-3" />
              </button>
              <span className="px-1 text-[11px] font-semibold">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
                className="hover:text-foreground text-muted-foreground cursor-pointer"
              >
                <ZoomIn className="size-3" />
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPreview(!isPreview)}
              className="h-8 text-xs gap-1.5 rounded-xl cursor-pointer"
            >
              <Eye className="size-3.5" /> {isPreview ? "Edit" : "Preview"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCodeModalOpen(true)}
              className="h-8 text-xs gap-1.5 rounded-xl cursor-pointer"
            >
              <Code2 className="size-3.5" /> Code
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              className="h-8 text-xs gap-1.5 rounded-xl cursor-pointer shadow-xs"
            >
              <Save className="size-3.5" /> Save
            </Button>
          </div>
        </header>

        {/* ── Main Figma Builder Layout ──────────────────────────────────── */}
        <div className="flex-1 flex min-h-0 relative overflow-hidden">
          {/* 1. PRIMARY ICON SIDEBAR (Leftmost - Narrow 56px Bar) */}
          <aside className="w-14 bg-card border-r border-border flex flex-col items-center py-3 gap-2.5 z-30 shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handlePrimaryTabClick("layers")}
                  className={cn(
                    "h-9 w-9 rounded-xl flex items-center justify-center transition-all cursor-pointer",
                    activePrimaryTab === "layers" && isSecondaryOpen
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Layers className="size-4.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Layers & Tree</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handlePrimaryTabClick("components")}
                  className={cn(
                    "h-9 w-9 rounded-xl flex items-center justify-center transition-all cursor-pointer",
                    activePrimaryTab === "components" && isSecondaryOpen
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Plus className="size-4.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Add Components</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handlePrimaryTabClick("typography")}
                  className={cn(
                    "h-9 w-9 rounded-xl flex items-center justify-center transition-all cursor-pointer",
                    activePrimaryTab === "typography" && isSecondaryOpen
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Type className="size-4.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Text & Typography</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handlePrimaryTabClick("elements")}
                  className={cn(
                    "h-9 w-9 rounded-xl flex items-center justify-center transition-all cursor-pointer",
                    activePrimaryTab === "elements" && isSecondaryOpen
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Square className="size-4.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Shapes & Containers</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handlePrimaryTabClick("media")}
                  className={cn(
                    "h-9 w-9 rounded-xl flex items-center justify-center transition-all cursor-pointer",
                    activePrimaryTab === "media" && isSecondaryOpen
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <ImageIcon className="size-4.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Media & Images</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handlePrimaryTabClick("ai")}
                  className={cn(
                    "h-9 w-9 rounded-xl flex items-center justify-center transition-all cursor-pointer",
                    activePrimaryTab === "ai" && isSecondaryOpen
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-amber-500 hover:bg-amber-500/10 hover:text-amber-600"
                  )}
                >
                  <Sparkles className="size-4.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">AI Generator</TooltipContent>
            </Tooltip>

            <div className="mt-auto flex flex-col gap-2.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handlePrimaryTabClick("settings")}
                    className={cn(
                      "h-9 w-9 rounded-xl flex items-center justify-center transition-all cursor-pointer",
                      activePrimaryTab === "settings" && isSecondaryOpen
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Settings className="size-4.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Page Settings</TooltipContent>
              </Tooltip>
            </div>
          </aside>

          {/* 2. SECONDARY SIDEBAR PANEL (Figma-Style Expandable Left Panel 280px) */}
          {isSecondaryOpen && (
            <aside className="w-72 bg-card border-r border-border flex flex-col z-20 shrink-0 transition-all duration-200">
              {/* Secondary Header */}
              <div className="h-10 px-3 border-b border-border flex items-center justify-between shrink-0 bg-muted/20">
                <span className="text-xs font-bold text-foreground capitalize flex items-center gap-1.5">
                  {activePrimaryTab === "layers" && <Layers className="size-3.5 text-primary" />}
                  {activePrimaryTab === "components" && <Plus className="size-3.5 text-primary" />}
                  {activePrimaryTab === "typography" && <Type className="size-3.5 text-primary" />}
                  {activePrimaryTab === "elements" && <Square className="size-3.5 text-primary" />}
                  {activePrimaryTab === "media" && <ImageIcon className="size-3.5 text-primary" />}
                  {activePrimaryTab === "ai" && <Sparkles className="size-3.5 text-amber-500" />}
                  {activePrimaryTab === "settings" && <Settings className="size-3.5 text-primary" />}
                  {activePrimaryTab}
                </span>
                <button
                  onClick={() => setIsSecondaryOpen(false)}
                  className="h-6 w-6 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <PanelLeftClose className="size-3.5" />
                </button>
              </div>

              <ScrollArea className="flex-1 p-3" viewportClassName="w-full">
                {/* TAB 1: LAYERS TREE */}
                {activePrimaryTab === "layers" && (
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Search layers..."
                        value={layerSearch}
                        onChange={(e) => setLayerSearch(e.target.value)}
                        className="pl-8 h-8 text-xs rounded-xl bg-muted/30"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                        Page Structure ({blocks.length})
                      </span>
                      {blocks.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic px-1 py-2">No blocks added yet.</p>
                      ) : (
                        blocks
                          .filter((b) => !layerSearch || b.type.includes(layerSearch.toLowerCase()))
                          .map((b, idx) => (
                            <div
                              key={b.id}
                              onClick={() => setSelectedBlockId(b.id)}
                              className={cn(
                                "flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer group",
                                selectedBlockId === b.id
                                  ? "bg-primary/10 text-primary font-semibold"
                                  : "hover:bg-muted text-foreground/80"
                              )}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span className="text-[10px] text-muted-foreground font-mono">#{idx + 1}</span>
                                <span className="capitalize truncate">{b.type}</span>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteBlock(b.id)
                                  }}
                                  className="text-muted-foreground hover:text-destructive p-0.5 cursor-pointer"
                                >
                                  <Trash2 className="size-3" />
                                </button>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: COMPONENTS CATALOG */}
                {activePrimaryTab === "components" && (
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Search components..."
                        value={componentSearch}
                        onChange={(e) => setComponentSearch(e.target.value)}
                        className="pl-8 h-8 text-xs rounded-xl bg-muted/30"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {filteredCatalog.map((item) => (
                        <button
                          key={item.type}
                          onClick={() => handleAddBlock(item.type)}
                          className="flex flex-col items-start gap-1.5 p-3 rounded-xl border border-border/60 bg-card hover:bg-primary/5 hover:border-primary/40 transition-all text-left cursor-pointer group shadow-2xs"
                        >
                          <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            <item.icon className="size-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-foreground block">{item.name}</span>
                            <span className="text-[10px] text-muted-foreground leading-tight line-clamp-1">
                              {item.description}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 3: TYPOGRAPHY PRESETS */}
                {activePrimaryTab === "typography" && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                      Text Presets
                    </span>
                    <button
                      onClick={() => handleAddBlock("heading")}
                      className="w-full text-left p-3 rounded-xl border border-border/60 bg-card hover:bg-muted transition-colors cursor-pointer space-y-1"
                    >
                      <h2 className="font-extrabold text-lg text-foreground">Heading H1/H2</h2>
                      <p className="text-[10px] text-muted-foreground">Add title heading block</p>
                    </button>
                    <button
                      onClick={() => handleAddBlock("paragraph")}
                      className="w-full text-left p-3 rounded-xl border border-border/60 bg-card hover:bg-muted transition-colors cursor-pointer space-y-1"
                    >
                      <p className="text-xs text-foreground/80 leading-relaxed">Paragraph Body Text</p>
                      <p className="text-[10px] text-muted-foreground">Add body text block</p>
                    </button>
                    <button
                      onClick={() => handleAddBlock("quote")}
                      className="w-full text-left p-3 rounded-xl border border-border/60 bg-card hover:bg-muted transition-colors cursor-pointer space-y-1"
                    >
                      <blockquote className="border-l-2 border-primary pl-2 italic text-xs text-foreground/90">
                        &quot;Blockquote phrase...&quot;
                      </blockquote>
                      <p className="text-[10px] text-muted-foreground">Add quote block</p>
                    </button>
                  </div>
                )}

                {/* TAB 4: SHAPES & CONTAINERS */}
                {activePrimaryTab === "elements" && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                      Containers & Elements
                    </span>
                    <button
                      onClick={() => handleAddBlock("card")}
                      className="w-full text-left p-3 rounded-xl border border-border/60 bg-card hover:bg-muted transition-colors cursor-pointer space-y-1"
                    >
                      <div className="font-bold text-xs">Card Container</div>
                      <p className="text-[10px] text-muted-foreground">Box container for features</p>
                    </button>
                    <button
                      onClick={() => handleAddBlock("badge")}
                      className="w-full text-left p-3 rounded-xl border border-border/60 bg-card hover:bg-muted transition-colors cursor-pointer space-y-1"
                    >
                      <Badge variant="secondary" className="text-[10px]">BADGE</Badge>
                      <p className="text-[10px] text-muted-foreground">Pill status badge</p>
                    </button>
                    <button
                      onClick={() => handleAddBlock("divider")}
                      className="w-full text-left p-3 rounded-xl border border-border/60 bg-card hover:bg-muted transition-colors cursor-pointer space-y-1"
                    >
                      <Separator />
                      <p className="text-[10px] text-muted-foreground">Horizontal line separator</p>
                    </button>
                  </div>
                )}

                {/* TAB 5: MEDIA & IMAGES */}
                {activePrimaryTab === "media" && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                      Media Blocks
                    </span>
                    <button
                      onClick={() => handleAddBlock("image")}
                      className="w-full text-left p-3 rounded-xl border border-border/60 bg-card hover:bg-muted transition-colors cursor-pointer flex items-center gap-3"
                    >
                      <ImageIcon className="size-5 text-primary" />
                      <div>
                        <span className="text-xs font-bold text-foreground block">Image Block</span>
                        <span className="text-[10px] text-muted-foreground">Responsive image URL</span>
                      </div>
                    </button>
                    <button
                      onClick={() => handleAddBlock("video")}
                      className="w-full text-left p-3 rounded-xl border border-border/60 bg-card hover:bg-muted transition-colors cursor-pointer flex items-center gap-3"
                    >
                      <Video className="size-5 text-rose-500" />
                      <div>
                        <span className="text-xs font-bold text-foreground block">Video Embed</span>
                        <span className="text-[10px] text-muted-foreground">YouTube or Vimeo</span>
                      </div>
                    </button>
                  </div>
                )}

                {/* TAB 6: AI GENERATOR */}
                {activePrimaryTab === "ai" && (
                  <div className="space-y-3">
                    <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-3 space-y-1">
                      <span className="font-bold text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                        <Sparkles className="size-3.5" /> AI Page Assistant
                      </span>
                      <p className="text-[10px] text-muted-foreground">
                        Describe the page or section you want to generate.
                      </p>
                    </div>

                    <Textarea
                      placeholder="e.g. Science Fair Event Landing Page with hero heading, features, and registration button..."
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      className="text-xs rounded-xl min-h-[90px] resize-none"
                    />

                    <Button
                      onClick={handleGenerateAi}
                      disabled={aiLoading || !aiPrompt.trim()}
                      className="w-full h-8 text-xs rounded-xl gap-1.5 bg-amber-500 hover:bg-amber-600 text-white cursor-pointer"
                    >
                      {aiLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                      Generate Layout
                    </Button>
                  </div>
                )}

                {/* TAB 7: SETTINGS */}
                {activePrimaryTab === "settings" && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Page Title</Label>
                      <Input
                        value={pageTitle}
                        onChange={(e) => setPageTitle(e.target.value)}
                        className="h-8 text-xs rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Page URL Slug</Label>
                      <Input
                        value={pageSlug}
                        onChange={(e) => setPageSlug(e.target.value)}
                        className="h-8 text-xs rounded-xl font-mono"
                      />
                    </div>
                  </div>
                )}
              </ScrollArea>
            </aside>
          )}

          {/* 3. CENTER WORKSPACE CANVAS (Figma Artboard Viewport) */}
          <main
            className="flex-1 bg-muted/30 overflow-auto flex flex-col items-center py-8 px-4 relative"
            onClick={() => setSelectedBlockId(null)}
          >
            {/* Viewport Artboard Frame */}
            <div
              className={cn(
                "bg-card rounded-3xl border border-border shadow-xl transition-all duration-300 min-h-[600px] flex flex-col relative p-6 sm:p-8",
                viewportMode === "desktop" && "w-full max-w-[1000px]",
                viewportMode === "tablet" && "w-[768px]",
                viewportMode === "mobile" && "w-[375px]"
              )}
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "top center" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Artboard Frame Header Badge */}
              <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-4 shrink-0 text-xs text-muted-foreground font-mono">
                <span className="flex items-center gap-1.5 font-bold text-foreground">
                  {viewportMode === "desktop" && <Monitor className="size-3.5 text-primary" />}
                  {viewportMode === "tablet" && <Tablet className="size-3.5 text-primary" />}
                  {viewportMode === "mobile" && <Smartphone className="size-3.5 text-primary" />}
                  {viewportMode.toUpperCase()} VIEWPORT
                </span>
                <span>{blocks.length} Blocks</span>
              </div>

              {/* DndContext Canvas Dropzone */}
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                  {blocks.length === 0 ? (
                    <div className="flex-1 min-h-[300px] border-2 border-dashed border-border/60 rounded-2xl flex flex-col items-center justify-center p-8 text-center space-y-3">
                      <LayoutGrid className="size-10 text-muted-foreground/40" />
                      <div>
                        <h3 className="font-bold text-base text-foreground">Canvas is empty</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          Click any component from the left sidebar to add elements to your page.
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          setActivePrimaryTab("components")
                          setIsSecondaryOpen(true)
                        }}
                        className="rounded-xl text-xs gap-1.5 cursor-pointer"
                      >
                        <Plus className="size-3.5" /> Add Component
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {blocks.map((block, idx) => (
                        <SortableBlockWrapper
                          key={block.id}
                          block={block}
                          isSelected={selectedBlockId === block.id}
                          onSelect={() => setSelectedBlockId(block.id)}
                          onDelete={() => handleDeleteBlock(block.id)}
                          onDuplicate={() => handleDuplicateBlock(block.id)}
                          onMoveUp={() => handleMoveBlock(idx, "up")}
                          onMoveDown={() => handleMoveBlock(idx, "down")}
                          isFirst={idx === 0}
                          isLast={idx === blocks.length - 1}
                        />
                      ))}
                    </div>
                  )}
                </SortableContext>
              </DndContext>
            </div>
          </main>

          {/* 4. RIGHT PROPERTIES INSPECTOR (Figma Inspector Panel ~280px) */}
          <aside className="w-72 bg-card border-l border-border flex flex-col z-20 shrink-0">
            <div className="h-10 px-3 border-b border-border flex items-center justify-between shrink-0 bg-muted/20">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <SlidersHorizontal className="size-3.5 text-primary" /> Inspector
              </span>
              {selectedBlock && (
                <Badge variant="outline" className="text-[10px] capitalize">
                  {selectedBlock.type}
                </Badge>
              )}
            </div>

            <ScrollArea className="flex-1 p-4" viewportClassName="w-full">
              {selectedBlock ? (
                <div className="space-y-4">
                  {/* Props editor according to block type */}
                  {selectedBlock.props.text !== undefined && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Text Content</Label>
                      <Textarea
                        value={selectedBlock.props.text}
                        onChange={(e) => {
                          const val = e.target.value
                          setBlocks((prev) =>
                            prev.map((b) => (b.id === selectedBlock.id ? { ...b, props: { ...b.props, text: val } } : b))
                          )
                        }}
                        className="text-xs rounded-xl resize-none min-h-[80px]"
                      />
                    </div>
                  )}

                  {selectedBlock.props.label !== undefined && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Button Label</Label>
                      <Input
                        value={selectedBlock.props.label}
                        onChange={(e) => {
                          const val = e.target.value
                          setBlocks((prev) =>
                            prev.map((b) => (b.id === selectedBlock.id ? { ...b, props: { ...b.props, label: val } } : b))
                          )
                        }}
                        className="h-8 text-xs rounded-xl"
                      />
                    </div>
                  )}

                  {selectedBlock.props.title !== undefined && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Title</Label>
                      <Input
                        value={selectedBlock.props.title}
                        onChange={(e) => {
                          const val = e.target.value
                          setBlocks((prev) =>
                            prev.map((b) => (b.id === selectedBlock.id ? { ...b, props: { ...b.props, title: val } } : b))
                          )
                        }}
                        className="h-8 text-xs rounded-xl"
                      />
                    </div>
                  )}

                  {selectedBlock.props.description !== undefined && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Description</Label>
                      <Textarea
                        value={selectedBlock.props.description}
                        onChange={(e) => {
                          const val = e.target.value
                          setBlocks((prev) =>
                            prev.map((b) => (b.id === selectedBlock.id ? { ...b, props: { ...b.props, description: val } } : b))
                          )
                        }}
                        className="text-xs rounded-xl resize-none"
                      />
                    </div>
                  )}

                  {selectedBlock.props.src !== undefined && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Image URL</Label>
                      <Input
                        value={selectedBlock.props.src}
                        onChange={(e) => {
                          const val = e.target.value
                          setBlocks((prev) =>
                            prev.map((b) => (b.id === selectedBlock.id ? { ...b, props: { ...b.props, src: val } } : b))
                          )
                        }}
                        className="h-8 text-xs rounded-xl font-mono text-[11px]"
                      />
                    </div>
                  )}

                  {selectedBlock.type === "heading" && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Heading Level</Label>
                      <Select
                        value={selectedBlock.props.level || "h2"}
                        onValueChange={(val) => {
                          setBlocks((prev) =>
                            prev.map((b) => (b.id === selectedBlock.id ? { ...b, props: { ...b.props, level: val } } : b))
                          )
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs rounded-xl">
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent side="top">
                          <SelectItem value="h1" className="text-xs">H1 - Large</SelectItem>
                          <SelectItem value="h2" className="text-xs">H2 - Medium</SelectItem>
                          <SelectItem value="h3" className="text-xs">H3 - Small</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <Separator />

                  <div className="pt-2 flex justify-between items-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicateBlock(selectedBlock.id)}
                      className="text-xs rounded-xl gap-1 cursor-pointer"
                    >
                      <Copy className="size-3" /> Duplicate
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteBlock(selectedBlock.id)}
                      className="text-xs rounded-xl gap-1 cursor-pointer"
                    >
                      <Trash2 className="size-3" /> Delete
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-muted-foreground">
                  <MousePointer className="size-8 opacity-30" />
                  <p className="text-xs font-semibold">No block selected</p>
                  <p className="text-[11px]">
                    Click any component on the canvas to inspect and edit its properties.
                  </p>
                </div>
              )}
            </ScrollArea>
          </aside>
        </div>

        {/* ── Generated Code Modal ───────────────────────────────────────── */}
        <Dialog open={isCodeModalOpen} onOpenChange={setIsCodeModalOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold">
                <Code2 className="size-4 text-primary" /> Generated Page Code
              </DialogTitle>
              <DialogDescription className="text-xs">
                Copy and export the React JSX structure for this page.
              </DialogDescription>
            </DialogHeader>

            <div className="bg-zinc-950 text-zinc-100 p-4 rounded-2xl font-mono text-xs overflow-auto max-h-[350px] leading-relaxed">
              <pre>{JSON.stringify({ title: pageTitle, slug: pageSlug, blocks }, null, 2)}</pre>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(blocks, null, 2))
                  toast.success("Code copied to clipboard!")
                }}
                className="rounded-xl text-xs gap-1 cursor-pointer"
              >
                <Copy className="size-3.5" /> Copy Code
              </Button>
              <Button
                size="sm"
                onClick={() => setIsCodeModalOpen(false)}
                className="rounded-xl text-xs cursor-pointer"
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
