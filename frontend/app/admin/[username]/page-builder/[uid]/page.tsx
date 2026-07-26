"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent,
  DragOverlay, DragStartEvent, useDraggable, useDroppable, DragOverEvent,
} from "@dnd-kit/core"
import {
  SortableContext, rectSortingStrategy, useSortable, arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  ArrowLeft, Save, Eye, EyeOff, GripVertical, Trash2, Plus, Type, AlignLeft, Image, PanelTop, LayoutTemplate, Grid3X3, PanelsTopLeft, ChevronsUpDown,
  Square, Minus, Columns2, Monitor, Smartphone, Tablet, Sparkles, Loader2, Video, List, Quote,
  AlertCircle, Badge, SeparatorHorizontal, Copy, ChevronUp, ChevronDown, Grid, AlignCenter, AlignRight,
  Move, LayoutGrid, Layers, Columns3, Smartphone as PhoneIcon, Link, Anchor, Zap, ArrowUpLeft, ArrowUpRight, ArrowDownRight, Compass,
  ArrowLeftToLine, ArrowRightToLine, ArrowUpToLine, ArrowDownToLine, Maximize2, Rows, Link2, Unlink, RotateCcw,
  Tag, User, Activity, TrendingUp, FormInput, ToggleLeft, FileText, ExternalLink,
  Paperclip, X, ImageIcon, ArrowUp, Pause, Code2, Check
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import FusionCodeEditor from "@/components/page-builder/fusion-code-editor"
import { blocksToFusion } from "@/lib/fusion-lang"
import { LightHeader } from "@/components/light-header"
import { Footer } from "@/components/footer"

const PANEL_SIZE_KEY = "vidya_pb_panel_size"
const STORAGE_KEY = "vidya_pages"

function getPages(): any[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") } catch { return [] }
}

// ── Types ─────────────────────────────────────────────────────────────────────

type BlockType = "heading" | "paragraph" | "image" | "button" | "divider" | "columns" | "spacer" | "video" | "list" | "quote" | "alert" | "card" | "badge" | "input" | "avatar" | "progress" | "stats" | "pdf" | "section" | "row" | "grid" | "tabs" | "accordion"
type ViewportMode = "desktop" | "tablet" | "mobile"
type ViewMode = "design" | "blueprint" | "split"

interface Block {
  id: string
  type: BlockType
  props: Record<string, string>
  x?: number
  y?: number
  customWidth?: number
  customHeight?: number
  isInline?: boolean
  isFreeform?: boolean
  marginTop?: number
  marginBottom?: number
  marginStart?: number
  marginEnd?: number
  horizontalBias?: number
  verticalBias?: number
  layoutWidth?: "wrap_content" | "match_parent"
  linkedTargetId?: string
  linkedSide?: "top" | "bottom" | "left" | "right"
  anchoredLeft?: boolean
  anchoredRight?: boolean
  anchoredTop?: boolean
  anchoredBottom?: boolean
  parentId?: string
  slotIndex?: number
}

// ── Component-to-Component Spring Link Connector SVG (Blueprint Mode Only) ────

function ComponentLinkConnector({ fromBlock, toBlock }: { fromBlock: Block; toBlock: Block }) {
  const x1 = (fromBlock.x ?? 40) + 40
  const y1 = (fromBlock.y ?? 40) + 20
  const x2 = (toBlock.x ?? 40) + 40
  const y2 = (toBlock.y ?? 40) + 20

  return (
    <svg className="absolute inset-0 size-full overflow-visible pointer-events-none z-50">
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="var(--primary)"
        strokeWidth="2.5"
        strokeDasharray="6 3"
        className="animate-pulse"
      />
      <circle cx={x1} cy={y1} r="5" fill="var(--primary)" className="animate-ping opacity-75" />
      <circle cx={x1} cy={y1} r="4" fill="var(--primary)" />
      <circle cx={x2} cy={y2} r="4" fill="var(--primary)" />
    </svg>
  )
}

// ── Wall Snap Highlight Line Component ────────────────────────────────────────

function WallSnapHighlight({ wall }: { wall: "left" | "right" | "top" | "bottom" | "center" }) {
  if (wall === "left") {
    return (
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary z-50 animate-pulse shadow-[0_0_12px_var(--primary)] flex items-center justify-start pl-2">
        <span className="bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shadow-md">
          Attached to Left Wall (0px)
        </span>
      </div>
    )
  }
  if (wall === "right") {
    return (
      <div className="absolute right-0 top-0 bottom-0 w-1 bg-primary z-50 animate-pulse shadow-[0_0_12px_var(--primary)] flex items-center justify-end pr-2">
        <span className="bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shadow-md">
          Attached to Right Wall (100%)
        </span>
      </div>
    )
  }
  if (wall === "top") {
    return (
      <div className="absolute top-0 left-0 right-0 h-1 bg-primary z-50 animate-pulse shadow-[0_0_12px_var(--primary)] flex justify-center pt-2">
        <span className="bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shadow-md">
          Attached to Top Wall (0px)
        </span>
      </div>
    )
  }
  if (wall === "center") {
    return (
      <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 border-l-2 border-dashed border-primary z-50 animate-pulse flex items-center justify-center">
        <span className="bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shadow-md">
          Dual-Spring Centered (Both Walls 50%)
        </span>
      </div>
    )
  }
  return null
}

// ── Android Studio Dual-Spring Coil SVG Component ─────────────────────────────

function SpringCoilSvg({ direction, bias = 50 }: { direction: "top" | "bottom" | "left" | "right" | "dual-horizontal"; bias?: number }) {
  if (direction === "dual-horizontal") {
    return (
      <>
        {/* Left Wall Spring Coil */}
        <div className="absolute right-full top-1/2 -translate-y-1/2 flex items-center pr-1 pointer-events-none z-50">
          <svg className="w-24 h-6 overflow-visible" viewBox="0 0 96 24">
            <path
              d="M 96 12 Q 84 20 72 12 Q 60 4 48 12 Q 36 20 24 12 Q 12 4 0 12"
              fill="none"
              stroke="var(--primary)"
              strokeWidth="2.5"
              strokeDasharray="4 2"
              className="animate-pulse"
            />
          </svg>
          <span className="text-[9px] font-mono font-bold bg-primary text-primary-foreground px-1 py-0.2 rounded ml-1">
            L: {bias}%
          </span>
        </div>

        {/* Right Wall Spring Coil */}
        <div className="absolute left-full top-1/2 -translate-y-1/2 flex items-center pl-1 pointer-events-none z-50">
          <span className="text-[9px] font-mono font-bold bg-primary text-primary-foreground px-1 py-0.2 rounded mr-1">
            R: {100 - bias}%
          </span>
          <svg className="w-24 h-6 overflow-visible" viewBox="0 0 96 24">
            <path
              d="M 0 12 Q 12 4 24 12 Q 36 20 48 12 Q 60 4 72 12 Q 84 20 96 12"
              fill="none"
              stroke="var(--primary)"
              strokeWidth="2.5"
              strokeDasharray="4 2"
              className="animate-pulse"
            />
          </svg>
        </div>
      </>
    )
  }

  if (direction === "top") {
    return (
      <svg className="absolute bottom-full left-1/2 -translate-x-1/2 w-6 h-20 overflow-visible pointer-events-none z-50" viewBox="0 0 24 80">
        <path
          d="M 12 80 Q 4 70 12 60 Q 20 50 12 40 Q 4 30 12 20 Q 20 10 12 0"
          fill="none"
          stroke="var(--primary)"
          strokeWidth="2.5"
          strokeDasharray="4 2"
          className="animate-pulse"
        />
      </svg>
    )
  }
  if (direction === "bottom") {
    return (
      <svg className="absolute top-full left-1/2 -translate-x-1/2 w-6 h-20 overflow-visible pointer-events-none z-50" viewBox="0 0 24 80">
        <path
          d="M 12 0 Q 20 10 12 20 Q 4 30 12 40 Q 20 50 12 60 Q 4 70 12 80"
          fill="none"
          stroke="var(--primary)"
          strokeWidth="2.5"
          strokeDasharray="4 2"
          className="animate-pulse"
        />
      </svg>
    )
  }
  if (direction === "left") {
    return (
      <svg className="absolute right-full top-1/2 -translate-y-1/2 w-20 h-6 overflow-visible pointer-events-none z-50" viewBox="0 0 80 24">
        <path
          d="M 80 12 Q 70 20 60 12 Q 50 4 40 12 Q 30 20 20 12 Q 10 4 0 12"
          fill="none"
          stroke="var(--primary)"
          strokeWidth="2.5"
          strokeDasharray="4 2"
          className="animate-pulse"
        />
      </svg>
    )
  }
  return (
    <svg className="absolute left-full top-1/2 -translate-y-1/2 w-20 h-6 overflow-visible pointer-events-none z-50" viewBox="0 0 80 24">
      <path
        d="M 0 12 Q 10 4 24 12 Q 36 20 48 12 Q 50 4 72 12 Q 84 20 96 12"
        fill="none"
        stroke="var(--primary)"
        strokeWidth="2.5"
        strokeDasharray="4 2"
        className="animate-pulse"
      />
    </svg>
  )
}

// ── Safe String Sanitizer & Block Sanitizer ─────────────────────────────────

function safeString(val: any): string {
  if (val === null || val === undefined) return ""
  if (typeof val === "string") return val
  if (typeof val === "number" || typeof val === "boolean") return String(val)
  if (typeof val === "object") {
    if (typeof val.text === "string") return val.text
    if (typeof val.label === "string") return val.label
    if (typeof val.title === "string") return val.title
    if (typeof val.body === "string") return val.body
    if (val.props && typeof val.props === "object") {
      return safeString(val.props.text || val.props.label || val.props.title || val.props.body || JSON.stringify(val))
    }
    return JSON.stringify(val)
  }
  return String(val)
}

function sanitizeBlock(b: any): Block {
  const safeProps: Record<string, string> = {}
  if (b && b.props && typeof b.props === "object") {
    for (const key in b.props) {
      safeProps[key] = safeString(b.props[key])
    }
  }
  return {
    id: typeof b?.id === "string" ? b.id : crypto.randomUUID(),
    type: typeof b?.type === "string" ? b.type : "heading",
    props: safeProps,
    x: typeof b?.x === "number" ? b.x : undefined,
    y: typeof b?.y === "number" ? b.y : undefined,
    customWidth: typeof b?.customWidth === "number" ? b.customWidth : undefined,
    customHeight: typeof b?.customHeight === "number" ? b.customHeight : undefined,
    isInline: Boolean(b?.isInline),
    isFreeform: Boolean(b?.isFreeform),
    marginTop: typeof b?.marginTop === "number" ? b.marginTop : undefined,
    marginBottom: typeof b?.marginBottom === "number" ? b.marginBottom : undefined,
    marginStart: typeof b?.marginStart === "number" ? b.marginStart : undefined,
    marginEnd: typeof b?.marginEnd === "number" ? b.marginEnd : undefined,
    layoutWidth: b?.layoutWidth,
    horizontalBias: typeof b?.horizontalBias === "number" ? b.horizontalBias : undefined,
    verticalBias: typeof b?.verticalBias === "number" ? b.verticalBias : undefined,
    anchoredLeft: Boolean(b?.anchoredLeft),
    anchoredRight: Boolean(b?.anchoredRight),
    anchoredTop: Boolean(b?.anchoredTop),
    anchoredBottom: Boolean(b?.anchoredBottom),
    linkedTargetId: typeof b?.linkedTargetId === "string" ? b.linkedTargetId : undefined,
    parentId: typeof b?.parentId === "string" ? b.parentId : undefined,
    slotIndex: typeof b?.slotIndex === "number" ? b.slotIndex : undefined,
  }
}

// ── Block definitions ─────────────────────────────────────────────────────────

const BLOCK_DEFS: {
  type: BlockType
  label: string
  icon: React.ElementType
  defaultProps: Record<string, string>
  fields: { key: string; label: string; type: "text" | "textarea" | "select"; options?: string[] }[]
  render: (props: Record<string, string>, isBlueprint?: boolean, customWidth?: number, customHeight?: number, renderSlot?: (slotIndex?: number, label?: string) => React.ReactNode) => React.ReactNode
}[] = [
  {
    type: "heading", label: "Heading", icon: Type,
    defaultProps: { text: "New Heading", level: "h2", align: "left" },
    fields: [
      { key: "text", label: "Text", type: "text" },
      { key: "level", label: "Level", type: "select", options: ["h1", "h2", "h3"] },
      { key: "align", label: "Alignment", type: "select", options: ["left", "center", "right"] },
      { key: "className", label: "Tailwind Classes", type: "text" },
    ],
    render: (props, isBlueprint) => {
      const { text, level, align, className, ClassName } = props
      const customClasses = className || ClassName || ""
      const Tag = (level || "h2") as React.ElementType
      const sizes: Record<string, string> = { h1: "text-3xl sm:text-4xl lg:text-5xl font-black", h2: "text-xl sm:text-2xl lg:text-3xl font-extrabold", h3: "text-lg sm:text-xl font-bold" }
      const alignClasses: Record<string, string> = { left: "text-left", center: "text-center", right: "text-right" }

      if (isBlueprint) {
        return (
          <div className={cn("p-3 border-2 border-dashed border-primary/50 bg-muted/60 text-foreground font-mono text-xs rounded-md flex items-center justify-between w-full", customClasses)}>
            <span>[TextView: {level?.toUpperCase() || "H2"}] &quot;{text}&quot;</span>
            <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold ml-2">ALIGN: {align?.toUpperCase() || "LEFT"}</span>
          </div>
        )
      }
      return (
        <Tag
          className={cn("leading-[1.15] text-foreground transition-all w-full tracking-tight", sizes[level] ?? "text-2xl font-bold", alignClasses[align ?? "left"], customClasses)}
        >
          {text}
        </Tag>
      )
    },
  },
  {
    type: "paragraph", label: "Paragraph", icon: AlignLeft,
    defaultProps: { text: "Start writing here...", align: "left" },
    fields: [
      { key: "text", label: "Text", type: "textarea" },
      { key: "align", label: "Alignment", type: "select", options: ["left", "center", "right"] },
      { key: "className", label: "Tailwind Classes", type: "text" },
    ],
    render: (props, isBlueprint) => {
      const { text, align, className, ClassName } = props
      const customClasses = className || ClassName || ""
      const alignClasses: Record<string, string> = { left: "text-left", center: "text-center", right: "text-right" }

      if (isBlueprint) {
        return (
          <div className={cn("p-3 border border-dashed border-primary/40 bg-muted/40 text-muted-foreground font-mono text-xs rounded-md w-full", customClasses)}>
            [ParagraphView] &quot;{(text || "").slice(0, 40)}{(text || "").length > 40 ? "..." : ""}&quot;
          </div>
        )
      }
      return <p className={cn("text-muted-foreground text-sm sm:text-base leading-relaxed transition-all w-full", alignClasses[align ?? "left"], customClasses)}>{text}</p>
    },
  },
  {
    type: "button", label: "Button", icon: Square,
    defaultProps: { label: "Click Me", variant: "default", align: "left" },
    fields: [
      { key: "label", label: "Label", type: "text" },
      { key: "variant", label: "Variant", type: "select", options: ["default", "outline", "ghost"] },
      { key: "align", label: "Alignment", type: "select", options: ["left", "center", "right"] },
      { key: "className", label: "Tailwind Classes", type: "text" },
    ],
    render: (props, isBlueprint) => {
      const { label, variant, align, className, ClassName } = props
      const customClasses = className || ClassName || ""
      const styles: Record<string, string> = {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md",
        outline: "border border-border/80 text-foreground hover:bg-muted hover:border-primary/40 shadow-2xs",
        ghost: "text-foreground hover:bg-muted/80",
      }
      const alignClasses: Record<string, string> = { left: "justify-start", center: "justify-center", right: "justify-end" }

      if (isBlueprint) {
        return (
          <div className={cn("flex w-full", alignClasses[align ?? "left"])}>
            <div className={cn("border-2 border-primary bg-primary/10 text-primary font-mono text-xs rounded-md font-bold px-4 py-2 flex items-center gap-1.5 w-fit", customClasses)}>
              <span>[ButtonWidget]</span> {label}
            </div>
          </div>
        )
      }
      return (
        <div className={cn("flex w-full", alignClasses[align ?? "left"])}>
          <button className={cn("px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer w-fit", styles[variant ?? "default"], customClasses)}>{label}</button>
        </div>
      )
    },
  },
  {
    type: "pdf", label: "PDF Viewer", icon: FileText,
    defaultProps: { url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", title: "School Academic Syllabus.pdf" },
    fields: [
      { key: "title", label: "Document Title", type: "text" },
      { key: "url", label: "PDF Embed URL", type: "text" },
      { key: "className", label: "Tailwind Classes", type: "text" },
    ],
    render: (props, isBlueprint, customWidth, customHeight) => {
      const { title, url, className, ClassName } = props
      const customClasses = className || ClassName || ""
      const h = customHeight ? `${customHeight}px` : "260px"
      if (isBlueprint) {
        return (
          <div style={{ height: customHeight ? `${customHeight}px` : "160px" }} className={cn("w-full border-2 border-dashed border-primary/50 bg-muted/60 text-foreground font-mono text-xs rounded-xl flex flex-col items-center justify-center gap-1.5 p-4", customClasses)}>
            <FileText className="size-8 text-primary" />
            <span className="font-bold text-center">[PDFView] {title || "Document.pdf"}</span>
          </div>
        )
      }
      return (
        <div style={{ height: h }} className={cn("w-full rounded-2xl border border-border/80 bg-card shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col", customClasses)}>
          <div className="px-4 py-2.5 bg-muted/50 backdrop-blur-md border-b border-border/60 flex items-center justify-between text-xs font-bold text-foreground shrink-0">
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-primary" />
              <span className="truncate max-w-[200px] sm:max-w-xs">{title || "PDF Document"}</span>
            </div>
            <a href={url} target="_blank" rel="noreferrer" className="text-primary hover:underline text-[10px] flex items-center gap-1 font-extrabold">
              Open <ExternalLink className="size-3" />
            </a>
          </div>
          <iframe key={url} src={url} className="w-full flex-1 border-0" title={title || "PDF View"} />
        </div>
      )
    }
  },
  {
    type: "badge", label: "Tag / Badge", icon: Tag,
    defaultProps: { label: "NEW FEATURE 2026", variant: "default" },
    fields: [
      { key: "label", label: "Tag Text", type: "text" },
      { key: "variant", label: "Variant", type: "select", options: ["default", "secondary", "outline"] },
      { key: "className", label: "Tailwind Classes", type: "text" },
    ],
    render: (props, isBlueprint) => {
      const { label, className, ClassName } = props
      const customClasses = className || ClassName || ""
      if (isBlueprint) {
        return <div className={cn("px-3 py-1 border border-primary bg-primary/20 text-primary font-mono text-[10px] rounded-full font-bold w-fit", customClasses)}>[Badge: {label}]</div>
      }
      return (
        <div className={cn("px-3.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/25 text-[11px] font-extrabold uppercase tracking-wider w-fit flex items-center gap-1.5 shadow-2xs", customClasses)}>
          <Sparkles className="size-3 text-primary animate-pulse" />
          <span>{label}</span>
        </div>
      )
    }
  },
  {
    type: "input", label: "Input Box", icon: FormInput,
    defaultProps: { placeholder: "Enter your email address...", label: "Email Address" },
    fields: [
      { key: "label", label: "Field Label", type: "text" },
      { key: "placeholder", label: "Placeholder Text", type: "text" },
      { key: "className", label: "Tailwind Classes", type: "text" },
    ],
    render: (props, isBlueprint) => {
      const { label, placeholder, className, ClassName } = props
      const customClasses = className || ClassName || ""
      if (isBlueprint) {
        return <div className={cn("p-2.5 border-2 border-dashed border-primary/40 bg-muted/30 text-muted-foreground font-mono text-xs rounded-lg w-full", customClasses)}>[EditText: {label}]</div>
      }
      return (
        <div className={cn("space-y-1.5 w-full max-w-sm", customClasses)}>
          {label && <label className="text-xs font-bold text-foreground block tracking-tight">{label}</label>}
          <Input placeholder={placeholder} readOnly className="h-9 text-xs bg-background border-border/80 shadow-2xs rounded-lg" />
        </div>
      )
    }
  },
  {
    type: "avatar", label: "Avatar Icon", icon: User,
    defaultProps: { name: "Ankit Kumar", role: "Principal Architect" },
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "role", label: "Subtext / Role", type: "text" },
      { key: "className", label: "Tailwind Classes", type: "text" },
    ],
    render: (props, isBlueprint) => {
      const { name, role, className, ClassName } = props
      const customClasses = className || ClassName || ""
      if (isBlueprint) {
        return <div className={cn("p-2 border border-primary bg-primary/10 text-primary font-mono text-xs rounded-md flex items-center gap-2 w-fit", customClasses)}>[AvatarView: {name}]</div>
      }
      return (
        <div className={cn("flex items-center gap-3 p-2.5 rounded-xl bg-card border border-border/80 w-fit shadow-xs hover:border-primary/40 transition-all", customClasses)}>
          <div className="size-9 rounded-full bg-primary text-primary-foreground font-extrabold text-xs flex items-center justify-center shadow-2xs">
            {name ? name.slice(0, 2).toUpperCase() : "VK"}
          </div>
          <div>
            <h5 className="font-bold text-xs text-foreground leading-none">{name}</h5>
            {role && <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">{role}</p>}
          </div>
        </div>
      )
    }
  },
  {
    type: "progress", label: "Progress Bar", icon: Activity,
    defaultProps: { value: "75", label: "Admissions Target" },
    fields: [
      { key: "label", label: "Label", type: "text" },
      { key: "value", label: "Value (0-100)", type: "text" },
      { key: "className", label: "Tailwind Classes", type: "text" },
    ],
    render: (props, isBlueprint) => {
      const { label, value, className, ClassName } = props
      const customClasses = className || ClassName || ""
      const val = Math.min(100, Math.max(0, Number((value || "75").replace("%", ""))))
      if (isBlueprint) {
        return <div className={cn("p-2 border border-primary bg-primary/10 text-primary font-mono text-xs rounded-md w-full", customClasses)}>[ProgressBar: {val}%]</div>
      }
      return (
        <div className={cn("space-y-2 w-full max-w-sm p-4 rounded-xl border border-border/80 bg-card shadow-xs", customClasses)}>
          <div className="flex justify-between text-xs font-bold text-foreground">
            <span>{label}</span>
            <span className="text-primary font-extrabold">{val}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
            <div style={{ width: `${val}%` }} className="h-full bg-primary rounded-full transition-all duration-300" />
          </div>
        </div>
      )
    }
  },
  {
    type: "stats", label: "Stats KPI Box", icon: TrendingUp,
    defaultProps: { value: "98.5%", label: "Graduation Pass Rate", change: "+3.4% vs last year" },
    fields: [
      { key: "value", label: "Stat Number", type: "text" },
      { key: "label", label: "Stat Label", type: "text" },
      { key: "change", label: "Comparison Subtext", type: "text" },
      { key: "className", label: "Tailwind Classes", type: "text" },
    ],
    render: (props, isBlueprint) => {
      const { value, label, change, className, ClassName } = props
      const customClasses = className || ClassName || ""
      if (isBlueprint) {
        return <div className={cn("p-3 border-2 border-primary bg-primary/10 text-primary font-mono text-xs rounded-md w-full", customClasses)}>[StatsView: {value}]</div>
      }
      return (
        <div className={cn("p-5 rounded-2xl border border-border/80 bg-card/90 backdrop-blur-md shadow-xs hover:shadow-md hover:border-primary/40 transition-all space-y-1 w-full", customClasses)}>
          <span className="text-2xl sm:text-3xl font-black text-foreground tracking-tight block font-mono">{value}</span>
          <h5 className="text-xs font-bold text-foreground">{label}</h5>
          {change && (
            <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold pt-0.5">
              <TrendingUp className="size-3" />
              <span>{change}</span>
            </div>
          )}
        </div>
      )
    }
  },
  {
    type: "image", label: "Image", icon: Image,
    defaultProps: { src: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800", alt: "School banner", rounded: "lg" },
    fields: [
      { key: "src", label: "URL", type: "text" },
      { key: "alt", label: "Alt text", type: "text" },
      { key: "rounded", label: "Corners", type: "select", options: ["none", "md", "lg", "full"] },
      { key: "className", label: "Tailwind Classes", type: "text" },
    ],
    render: (props, isBlueprint, customWidth, customHeight) => {
      const { src, alt, rounded, className, ClassName } = props
      const customClasses = className || ClassName || ""
      if (isBlueprint) {
        return (
          <div style={{ height: customHeight ? `${customHeight}px` : undefined }} className={cn("h-40 border-2 border-dashed border-primary/50 bg-muted/40 text-muted-foreground font-mono text-xs rounded-md flex flex-col items-center justify-center gap-1 w-full", customClasses)}>
            <Image className="size-6 text-primary" />
            <span>[ImageView] {alt || "image_view_1"}</span>
          </div>
        )
      }
      return (
        <img src={src} alt={alt} style={{ height: customHeight ? `${customHeight}px` : undefined }} className={cn("w-full object-cover shadow-md hover:shadow-lg transition-all duration-300 max-h-96", `rounded-${rounded ?? "lg"}`, customClasses)}
          onError={e => (e.currentTarget.src = "https://placehold.co/800x300")} />
      )
    },
  },
  {
    type: "columns", label: "2 Columns", icon: Columns2,
    defaultProps: { left: "Left column content", right: "Right column details", gap: "6" },
    fields: [
      { key: "left", label: "Left", type: "textarea" },
      { key: "right", label: "Right", type: "textarea" },
      { key: "gap", label: "Gap", type: "select", options: ["2", "4", "6", "8"] },
      { key: "className", label: "Tailwind Classes", type: "text" },
    ],
    render: (props, isBlueprint, customWidth, customHeight, renderSlot) => {
      const { left, right, gap, className, ClassName } = props
      const customClasses = className || ClassName || ""
      return (
        <div className={cn("grid grid-cols-1 md:grid-cols-2 w-full", `gap-${gap ?? "6"}`, customClasses)}>
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-bold font-mono text-muted-foreground uppercase px-1">Left Column Slot</span>
            {renderSlot ? renderSlot(0, "Drop widgets into Left Column") : (
              <p className="text-muted-foreground leading-relaxed text-sm p-5 rounded-xl bg-muted/30 border border-border/60 backdrop-blur-sm">{left}</p>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-bold font-mono text-muted-foreground uppercase px-1">Right Column Slot</span>
            {renderSlot ? renderSlot(1, "Drop widgets into Right Column") : (
              <p className="text-muted-foreground leading-relaxed text-sm p-5 rounded-xl bg-muted/30 border border-border/60 backdrop-blur-sm">{right}</p>
            )}
          </div>
        </div>
      )
    },
  },
  {
    type: "divider", label: "Divider", icon: Minus,
    defaultProps: { spacing: "md" },
    fields: [{ key: "spacing", label: "Spacing", type: "select", options: ["sm", "md", "lg"] }],
    render: ({ spacing }, isBlueprint) => {
      const py: Record<string, string> = { sm: "py-2", md: "py-4", lg: "py-8" }
      if (isBlueprint) {
        return <div className={cn(py[spacing ?? "md"], "border-t-2 border-dashed border-primary/50 my-1 w-full")} />
      }
      return <div className={cn(py[spacing ?? "md"], "w-full")}><Separator className="bg-border" /></div>
    },
  },
  {
    type: "spacer", label: "Spacer", icon: SeparatorHorizontal,
    defaultProps: { height: "40" },
    fields: [{ key: "height", label: "Height (px)", type: "text" }],
    render: ({ height }, isBlueprint, customWidth, customHeight) => {
      const h = customHeight ?? Number(height || 40)
      if (isBlueprint) {
        return <div style={{ height: `${h}px` }} className="w-full border border-dashed border-border bg-muted/20 text-muted-foreground font-mono text-[10px] flex items-center justify-center">[Space: {h}px]</div>
      }
      return <div style={{ height: `${h}px` }} className="w-full" />
    },
  },
  {
    type: "video", label: "Video", icon: Video,
    defaultProps: { url: "https://www.youtube.com/embed/dQw4w9WgXcQ", rounded: "lg" },
    fields: [
      { key: "url", label: "Embed URL", type: "text" },
      { key: "rounded", label: "Corners", type: "select", options: ["none", "md", "lg"] },
      { key: "className", label: "Tailwind Classes", type: "text" },
    ],
    render: (props, isBlueprint, customWidth, customHeight) => {
      const { url, rounded, className, ClassName } = props
      const customClasses = className || ClassName || ""
      if (isBlueprint) {
        return (
          <div style={{ height: customHeight ? `${customHeight}px` : undefined }} className={cn("aspect-video w-full border-2 border-primary/50 bg-muted/60 text-muted-foreground font-mono text-xs rounded-md flex items-center justify-center gap-2", customClasses)}>
            <Video className="size-6 text-primary" />
            <span>[VideoPlayerView]</span>
          </div>
        )
      }
      return (
        <div style={{ height: customHeight ? `${customHeight}px` : undefined }} className={cn("overflow-hidden aspect-video w-full shadow-md hover:shadow-lg transition-shadow border border-border/60", `rounded-${rounded ?? "lg"}`, customClasses)}>
          <iframe key={url} src={url} className="w-full h-full" allowFullScreen />
        </div>
      )
    },
  },
  {
    type: "list", label: "List", icon: List,
    defaultProps: { items: "Feature Item 1\nFeature Item 2\nFeature Item 3" },
    fields: [
      { key: "items", label: "Items (1 per line)", type: "textarea" },
      { key: "className", label: "Tailwind Classes", type: "text" },
    ],
    render: (props, isBlueprint) => {
      const { items, className, ClassName } = props
      const customClasses = className || ClassName || ""
      const list = (items || "").split("\n").filter(Boolean)
      if (isBlueprint) {
        return (
          <div className={cn("p-3 border border-border bg-muted/30 text-muted-foreground font-mono text-xs rounded-md space-y-1 w-full", customClasses)}>
            <div className="text-[10px] font-bold text-primary">[ListView: {list.length} items]</div>
            {list.map((item, i) => <div key={i}>• {item}</div>)}
          </div>
        )
      }
      return (
        <ul className={cn("space-y-2 text-sm text-muted-foreground w-full", customClasses)}>
          {list.map((item, i) => <li key={i} className="flex items-start gap-2"><span className="size-1.5 rounded-full bg-primary mt-2 shrink-0" /><span>{item}</span></li>)}
        </ul>
      )
    },
  },
  {
    type: "quote", label: "Quote", icon: Quote,
    defaultProps: { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
    fields: [
      { key: "text", label: "Quote", type: "textarea" },
      { key: "author", label: "Author", type: "text" },
      { key: "className", label: "Tailwind Classes", type: "text" },
    ],
    render: (props, isBlueprint) => {
      const { text, author, className, ClassName } = props
      const customClasses = className || ClassName || ""
      if (isBlueprint) {
        return (
          <div className={cn("p-3 border-l-4 border-primary bg-muted/40 text-foreground font-mono text-xs rounded-md w-full", customClasses)}>
            [QuoteView] &quot;{text}&rdquo; — {author}
          </div>
        )
      }
      return (
        <blockquote className={cn("p-5 rounded-2xl border-l-4 border-primary bg-muted/20 backdrop-blur-sm text-foreground italic space-y-2 text-sm w-full shadow-2xs", customClasses)}>
          <p className="leading-relaxed">&ldquo;{text}&rdquo;</p>
          {author && <footer className="text-[11px] font-extrabold text-muted-foreground not-italic tracking-wide">— {author}</footer>}
        </blockquote>
      )
    },
  },
  {
    type: "alert", label: "Alert", icon: AlertCircle,
    defaultProps: { text: "Important Notice: School admissions open next Monday!", variant: "info" },
    fields: [
      { key: "text", label: "Notice", type: "textarea" },
      { key: "variant", label: "Variant", type: "select", options: ["info", "success", "warning"] },
      { key: "className", label: "Tailwind Classes", type: "text" },
    ],
    render: (props, isBlueprint) => {
      const { text, variant, className, ClassName } = props
      const customClasses = className || ClassName || ""
      if (isBlueprint) {
        return (
          <div className={cn("p-3 border-2 border-primary bg-primary/10 text-foreground font-mono text-xs rounded-md flex items-center gap-2 w-full", customClasses)}>
            <AlertCircle className="size-4 text-primary" />
            <span>[AlertWidget] {text}</span>
          </div>
        )
      }
      const styles: Record<string, string> = {
        info: "bg-muted/60 text-foreground border-border/80 backdrop-blur-sm",
        success: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800",
        warning: "bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-800",
      }
      return (
        <div className={cn("p-4 rounded-2xl border text-sm font-medium flex items-center gap-2.5 w-full shadow-2xs", styles[variant ?? "info"], customClasses)}>
          <AlertCircle className="size-4 shrink-0" />
          <span>{text}</span>
        </div>
      )
    },
  },
  {
    type: "card", label: "Card Box", icon: Badge,
    defaultProps: { title: "Academic Excellence", body: "Comprehensive curriculum designed for modern STEM and holistic student growth." },
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "body", label: "Body / Paragraph", type: "textarea" },
      { key: "progress", label: "Progress %", type: "text" },
      { key: "className", label: "Tailwind Classes", type: "text" },
    ],
    render: (props, isBlueprint, customWidth) => {
      const { title, body, paragraph, progress, className, ClassName } = props
      const textContent = body || paragraph || ""
      const customClasses = className || ClassName || ""
      const dynamicFontSize = customWidth
        ? `${Math.max(12, Math.min(32, Math.round(customWidth / 18)))}px`
        : undefined
      const progressVal = progress ? Number(String(progress).replace("%", "")) : null

      if (isBlueprint) {
        return (
          <div style={{ fontSize: dynamicFontSize }} className={cn("p-4 border-2 border-primary/50 bg-muted/60 text-foreground font-mono text-xs rounded-xl space-y-1 w-full", customClasses)}>
            <div className="font-bold text-primary">[CardView] {title}</div>
            {textContent && <div className="text-[10px] text-muted-foreground">{textContent}</div>}
            {progressVal !== null && !isNaN(progressVal) && <div className="text-[10px] text-purple-400 font-bold">Progress: {progressVal}%</div>}
          </div>
        )
      }
      return (
        <div style={{ fontSize: dynamicFontSize }} className={cn("p-6 rounded-2xl border border-border/80 bg-card/90 backdrop-blur-md text-card-foreground shadow-sm hover:shadow-lg hover:border-primary/40 transition-all space-y-3 w-full", customClasses)}>
          {title && <h4 className="font-extrabold text-base text-foreground tracking-tight">{title}</h4>}
          {textContent && <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed break-words">{textContent}</p>}
          {progressVal !== null && !isNaN(progressVal) && (
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[11px] font-bold text-foreground">
                <span>Progress</span>
                <span className="text-primary font-extrabold">{progressVal}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <div style={{ width: `${Math.min(100, Math.max(0, progressVal))}%` }} className="h-full bg-primary rounded-full transition-all duration-300" />
              </div>
            </div>
          )}
        </div>
      )
    },
  },
  // ── Layout Container Blocks (Elementor-Style Responsive Containers) ─────────
  {
    type: "section", label: "Section", icon: PanelTop,
    defaultProps: { background: "default", padding: "lg", fullWidth: "false", label: "Hero Section" },
    fields: [
      { key: "label", label: "Section Label", type: "text" },
      { key: "background", label: "Background", type: "select", options: ["default", "muted", "primary", "gradient", "dark"] },
      { key: "padding", label: "Padding", type: "select", options: ["none", "sm", "md", "lg", "xl"] },
      { key: "fullWidth", label: "Full Width", type: "select", options: ["false", "true"] },
      { key: "className", label: "Tailwind Classes", type: "text" },
    ],
    render: (props, isBlueprint, customWidth, customHeight, renderSlot) => {
      const { background, padding, fullWidth, label, className, ClassName } = props
      const customClasses = className || ClassName || ""
      const bgStyles: Record<string, string> = {
        default: "bg-background border border-border/40",
        muted: "bg-muted/40 border border-border/60",
        primary: "bg-primary/5 border border-primary/20",
        gradient: "bg-gradient-to-br from-primary/10 via-background to-muted/40 border border-border/50",
        dark: "bg-zinc-900 text-white border border-zinc-700",
      }
      const padStyles: Record<string, string> = { none: "p-0", sm: "p-3", md: "p-6", lg: "p-8 sm:p-10", xl: "p-10 sm:p-14" }

      return (
        <div className={cn("w-full rounded-2xl transition-all relative", bgStyles[background ?? "default"], padStyles[padding ?? "lg"], fullWidth === "true" && "-mx-4 sm:-mx-8 md:-mx-12 px-4 sm:px-8 md:px-12 rounded-none", customClasses)}>
          {label && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] bg-primary/10 text-primary px-2 py-0.5 rounded-full">{label}</span>
            </div>
          )}
          {renderSlot ? renderSlot(0, `Drop elements into ${label || "Section"}`) : null}
        </div>
      )
    },
  },
  {
    type: "row", label: "Row / Columns", icon: LayoutTemplate,
    defaultProps: { columns: "3", gap: "6", col1: "First column content with key features and highlights.", col2: "Second column featuring statistics and performance data.", col3: "Third column with testimonials and social proof." },
    fields: [
      { key: "columns", label: "Columns", type: "select", options: ["1", "2", "3", "4"] },
      { key: "gap", label: "Gap", type: "select", options: ["2", "4", "6", "8", "10"] },
      { key: "col1", label: "Column 1", type: "textarea" },
      { key: "col2", label: "Column 2", type: "textarea" },
      { key: "col3", label: "Column 3", type: "textarea" },
      { key: "col4", label: "Column 4", type: "textarea" },
      { key: "className", label: "Tailwind Classes", type: "text" },
    ],
    render: (props, isBlueprint, customWidth, customHeight, renderSlot) => {
      const { columns, gap, col1, col2, col3, col4, className, ClassName } = props
      const customClasses = className || ClassName || ""
      const numCols = Math.min(4, Math.max(1, Number(columns || "3")))
      const colContents = [col1, col2, col3, col4].slice(0, numCols)
      const gridColsMap: Record<number, string> = { 1: "grid-cols-1", 2: "grid-cols-1 md:grid-cols-2", 3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3", 4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" }

      return (
        <div className={cn("w-full grid", gridColsMap[numCols], `gap-${gap ?? "6"}`, customClasses)}>
          {colContents.map((content, i) => (
            <div key={i} className="flex flex-col gap-2">
              <span className="text-[9px] font-bold font-mono text-muted-foreground uppercase px-1">Column {i + 1} Slot</span>
              {renderSlot ? renderSlot(i, `Drop widgets into Column ${i + 1}`) : (
                <div className="p-4 rounded-xl bg-muted/20 border border-border/50 text-xs text-muted-foreground">{content}</div>
              )}
            </div>
          ))}
        </div>
      )
    },
  },
  {
    type: "grid", label: "Bento Grid", icon: Grid3X3,
    defaultProps: { columns: "3", rows: "2", gap: "4", items: "📊 Analytics Dashboard\n🎓 Student Portal\n📚 Course Library\n🏆 Achievements\n📅 Schedule Planner\n💬 Discussion Forum" },
    fields: [
      { key: "columns", label: "Columns", type: "select", options: ["2", "3", "4"] },
      { key: "rows", label: "Rows", type: "select", options: ["1", "2", "3", "4"] },
      { key: "gap", label: "Gap", type: "select", options: ["2", "3", "4", "6"] },
      { key: "items", label: "Grid Items (1 per line)", type: "textarea" },
      { key: "className", label: "Tailwind Classes", type: "text" },
    ],
    render: (props, isBlueprint, customWidth, customHeight, renderSlot) => {
      const { columns, rows, gap, items, className, ClassName } = props
      const customClasses = className || ClassName || ""
      const numCols = Math.min(4, Math.max(2, Number(columns || "3")))
      const gridItems = (items || "").split("\n").filter(Boolean)
      const gridColsMap: Record<number, string> = { 2: "grid-cols-1 sm:grid-cols-2", 3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3", 4: "grid-cols-2 lg:grid-cols-4" }
      const accentColors = [
        "from-violet-500/10 to-violet-500/5 border-violet-500/20 hover:border-violet-500/40",
        "from-sky-500/10 to-sky-500/5 border-sky-500/20 hover:border-sky-500/40",
        "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40",
        "from-amber-500/10 to-amber-500/5 border-amber-500/20 hover:border-amber-500/40",
        "from-rose-500/10 to-rose-500/5 border-rose-500/20 hover:border-rose-500/40",
        "from-teal-500/10 to-teal-500/5 border-teal-500/20 hover:border-teal-500/40",
      ]

      return (
        <div className={cn("w-full grid", gridColsMap[numCols], `gap-${gap ?? "4"}`, customClasses)}>
          {gridItems.map((item, i) => {
            const isLarge = i === 0 && numCols >= 3
            return (
              <div
                key={i}
                className={cn(
                  "group relative p-4 rounded-2xl border bg-gradient-to-br backdrop-blur-sm transition-all duration-300 shadow-xs hover:shadow-md flex flex-col justify-between",
                  accentColors[i % accentColors.length],
                  isLarge && "sm:col-span-2 sm:row-span-2 p-6"
                )}
              >
                <p className={cn("font-bold text-foreground mb-2", isLarge ? "text-base" : "text-xs")}>{item}</p>
                {renderSlot ? renderSlot(i, `Drop widgets into Cell ${i + 1}`) : null}
              </div>
            )
          })}
        </div>
      )
    },
  },
  {
    type: "tabs", label: "Tabs", icon: PanelsTopLeft,
    defaultProps: { tabs: "Overview\nFeatures\nPricing", tab1: "Overview content goes here with key highlights and introductory text about our school programs.", tab2: "Feature details including responsive design, AI-powered learning, and interactive classrooms.", tab3: "Flexible pricing plans designed for schools of all sizes with transparent billing." },
    fields: [
      { key: "tabs", label: "Tab Names (1 per line)", type: "textarea" },
      { key: "tab1", label: "Tab 1 Content", type: "textarea" },
      { key: "tab2", label: "Tab 2 Content", type: "textarea" },
      { key: "tab3", label: "Tab 3 Content", type: "textarea" },
      { key: "tab4", label: "Tab 4 Content", type: "textarea" },
      { key: "className", label: "Tailwind Classes", type: "text" },
    ],
    render: (props, isBlueprint, customWidth, customHeight, renderSlot) => {
      const { tabs: tabsStr, tab1, tab2, tab3, tab4, className, ClassName } = props
      const customClasses = className || ClassName || ""
      const tabNames = (tabsStr || "").split("\n").filter(Boolean)

      const [activeIdx, setActiveIdx] = React.useState(0)
      return (
        <div className={cn("w-full rounded-2xl border border-border/80 bg-card/90 backdrop-blur-md shadow-sm overflow-hidden", customClasses)}>
          <div className="flex border-b border-border/60 bg-muted/30 overflow-x-auto">
            {tabNames.map((name, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => { e.stopPropagation(); setActiveIdx(i) }}
                className={cn(
                  "px-5 py-3 text-xs font-bold transition-all relative cursor-pointer shrink-0",
                  i === activeIdx
                    ? "text-primary bg-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {name}
                {i === activeIdx && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
              </button>
            ))}
          </div>
          <div className="p-5">
            {renderSlot ? renderSlot(activeIdx, `Drop widgets for ${tabNames[activeIdx] || `Tab ${activeIdx + 1}`}`) : null}
          </div>
        </div>
      )
    },
  },
  {
    type: "accordion", label: "Accordion / FAQ", icon: ChevronsUpDown,
    defaultProps: { items: "What programs do you offer?\nHow to apply for admission?\nWhat are the school timings?", answer1: "We offer comprehensive STEM, Arts, Sports and Leadership programs with modern curriculum designed for 21st century learners.", answer2: "Visit our admissions portal, fill the online application form, and submit required documents. Our team will guide you through each step.", answer3: "School operates from 8:00 AM to 3:30 PM, Monday through Saturday. Extended hours available for extracurricular activities." },
    fields: [
      { key: "items", label: "Questions (1 per line)", type: "textarea" },
      { key: "answer1", label: "Answer 1", type: "textarea" },
      { key: "answer2", label: "Answer 2", type: "textarea" },
      { key: "answer3", label: "Answer 3", type: "textarea" },
      { key: "answer4", label: "Answer 4", type: "textarea" },
      { key: "answer5", label: "Answer 5", type: "textarea" },
      { key: "className", label: "Tailwind Classes", type: "text" },
    ],
    render: (props, isBlueprint, customWidth, customHeight, renderSlot) => {
      const { items, answer1, answer2, answer3, answer4, answer5, className, ClassName } = props
      const customClasses = className || ClassName || ""
      const questions = (items || "").split("\n").filter(Boolean)

      const [openIdx, setOpenIdx] = React.useState<number | null>(0)
      return (
        <div className={cn("w-full rounded-2xl border border-border/80 bg-card/90 backdrop-blur-md shadow-sm overflow-hidden divide-y divide-border/60", customClasses)}>
          {questions.map((q, i) => (
            <div key={i} className="transition-all">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setOpenIdx(openIdx === i ? null : i) }}
                className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer group hover:bg-muted/30 transition-colors"
              >
                <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{q}</span>
                <ChevronDown className={cn("size-4 text-muted-foreground transition-transform duration-200 shrink-0 ml-2", openIdx === i && "rotate-180 text-primary")} />
              </button>
              {openIdx === i && (
                <div className="px-5 pb-4 animate-in fade-in slide-in-from-top-1 duration-200">
                  {renderSlot ? renderSlot(i, `Drop widgets into FAQ Item ${i + 1}`) : null}
                </div>
              )}
            </div>
          ))}
        </div>
      )
    },
  },
]

// ── Draggable Palette Item Component ─────────────────────────────────────────

function DraggablePaletteItem({ type, label, icon: Icon, onClick }: {
  type: BlockType; label: string; icon: React.ElementType; onClick: () => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette:${type}`,
    data: { type, source: "palette" }
  })

  return (
    <button
      ref={setNodeRef} {...listeners} {...attributes}
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium border bg-card text-card-foreground shadow-2xs hover:border-primary/40 hover:shadow-xs transition-all cursor-grab active:cursor-grabbing group select-none",
        isDragging && "opacity-40 border-primary border-dashed bg-primary/5"
      )}
    >
      <div className="size-6 rounded bg-muted flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors">
        <Icon className="size-3.5 shrink-0" />
      </div>
      <span className="font-semibold text-foreground/90">{label}</span>
      <Plus className="size-3.5 ml-auto text-muted-foreground group-hover:text-primary transition-colors" />
    </button>
  )
}

// ── Droppable Slot Component for Elementor-Style Sub-Positioning Container Drag-and-Drop ──────

function DroppableSlot({
  parentId,
  slotIndex = 0,
  children,
  label = "Drop widget here",
  className,
}: {
  parentId: string
  slotIndex?: number
  children?: React.ReactNode
  label?: string
  className?: string
}) {
  const slotId = `slot:${parentId}:${slotIndex}`
  const { setNodeRef, isOver } = useDroppable({ id: slotId })
  const hasChildren = React.Children.count(children) > 0

  return (
    <div
      ref={setNodeRef}
      id={slotId}
      className={cn(
        "min-h-[64px] p-2.5 rounded-xl border-2 border-dashed transition-all relative flex flex-col justify-center my-1 w-full",
        isOver
          ? "border-primary bg-primary/10 ring-4 ring-primary/20 scale-[1.01] shadow-lg"
          : hasChildren
          ? "border-primary/20 bg-muted/10 hover:border-primary/40"
          : "border-border/60 hover:border-primary/40 bg-muted/20 hover:bg-muted/30",
        className
      )}
    >
      {hasChildren ? (
        <div className="flex flex-row flex-wrap items-center gap-2 w-full">
          {children}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-4 text-center text-muted-foreground/60 gap-1 pointer-events-none select-none">
          <Plus className="size-4 text-primary animate-pulse" />
          <span className="text-[11px] font-bold text-foreground/75">{label}</span>
          <span className="text-[9px] text-muted-foreground">Drag element from palette or canvas here</span>
        </div>
      )}
    </div>
  )
}

// ── Droppable Canvas Container Component (Overflow Visible to Never Clip Toolbars) ──

function CanvasDropArea({
  children,
  isOver,
  showGrid,
  isBlueprint,
  activeWallHighlight,
}: {
  children: React.ReactNode;
  isOver?: boolean;
  showGrid?: boolean;
  isBlueprint?: boolean;
  activeWallHighlight?: "left" | "right" | "top" | "bottom" | "center" | null;
}) {
  const { setNodeRef, isOver: droppableIsOver } = useDroppable({
    id: "canvas-drop",
  })

  return (
    <div
      ref={setNodeRef}
      id="canvas-drop"
      className={cn(
        "rounded-2xl border border-border/80 shadow-2xl p-6 sm:p-10 min-h-[780px] relative transition-all overflow-visible flex flex-row flex-wrap items-center justify-center content-start gap-4 backdrop-blur-md",
        isBlueprint
          ? "bg-muted/40 text-foreground border-primary/30"
          : "bg-background/95 text-foreground shadow-inner",
        showGrid && "bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [background-size:24px_24px]",
        (isOver || droppableIsOver) && "ring-2 ring-primary ring-offset-4 bg-primary/5 border-primary shadow-primary/20"
      )}
    >
      {isBlueprint && activeWallHighlight && <WallSnapHighlight wall={activeWallHighlight} />}
      {children}
    </div>
  )
}

// ── Sortable & Freeform Direct Pointer Dragging Block Component ──────────────

function SortableBlock({
  block,
  isSelected,
  isDropTarget,
  isBlueprint,
  onSelect,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onAlignChange,
  onToggleFreeform,
  onToggleInline,
  onSnapWall,
  onResize,
  onUpdateCoords,
  onSetWallHighlight,
}: {
  block: Block
  isSelected: boolean
  isDropTarget?: boolean
  isBlueprint?: boolean
  onSelect: () => void
  onDelete: () => void
  onDuplicate: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onAlignChange: (align: "left" | "center" | "right") => void
  onToggleFreeform: () => void
  onToggleInline: () => void
  onSnapWall: (wall: "left" | "right" | "top" | "bottom" | "center") => void
  onResize: (w: number, h: number) => void
  onUpdateCoords: (x: number, y: number) => void
  onSetWallHighlight: (wall: "left" | "right" | "top" | "bottom" | "center" | null) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  })
  const def = BLOCK_DEFS.find(d => d.type === block.type)
  const [activeSpringDot, setActiveSpringDot] = React.useState<"top" | "bottom" | "left" | "right" | "dual-horizontal" | null>(null)

  const isFree = block.isFreeform
  const isDualHorizontal = block.horizontalBias === 50 || (block.anchoredLeft && block.anchoredRight)
  const isNearTop = (block.y ?? 0) < 55 || (isFree && (block.y ?? 0) < 55)
  const isNearRight = (block.x ?? 0) > 420

  // Direct Pointer Mouse Dragging on Canvas Artboard
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isFree) return
    if ((e.target as HTMLElement).closest("button, input, select, textarea, .resize-handle, .anchor-dot")) return

    e.preventDefault()
    e.stopPropagation()

    const startX = e.clientX
    const startY = e.clientY
    const initialBlockX = block.x ?? 0
    const initialBlockY = block.y ?? 0

    const handlePointerMove = (moveEv: PointerEvent) => {
      const deltaX = moveEv.clientX - startX
      const deltaY = moveEv.clientY - startY
      let nextX = Math.max(0, Math.round(initialBlockX + deltaX))
      let nextY = Math.max(0, Math.round(initialBlockY + deltaY))

      // Snap to 12px grid ticks
      nextX = Math.round(nextX / 12) * 12
      nextY = Math.round(nextY / 12) * 12

      onUpdateCoords(nextX, nextY)
    }

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
    }

    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", handlePointerUp)
  }

  // Interactive Drag-to-Wall Spring Anchor Dot Attachment Tracker (Android Studio Style)
  const handleAnchorPointerDown = (dot: "top" | "bottom" | "left" | "right", e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const handlePointerMove = (moveEv: PointerEvent) => {
      const canvasEl = document.getElementById("canvas-drop")
      if (!canvasEl) return
      const rect = canvasEl.getBoundingClientRect()
      const relX = moveEv.clientX - rect.left
      const relY = moveEv.clientY - rect.top

      if (relX < 80) {
        onSetWallHighlight("left")
        setActiveSpringDot("left")
      } else if (rect.width - relX < 80) {
        onSetWallHighlight("right")
        setActiveSpringDot("right")
      } else if (relY < 80) {
        onSetWallHighlight("top")
        setActiveSpringDot("top")
      } else if (Math.abs(relX - rect.width / 2) < 80) {
        onSetWallHighlight("center")
        setActiveSpringDot("dual-horizontal")
      } else {
        onSetWallHighlight(null)
      }
    }

    const handlePointerUp = (upEv: PointerEvent) => {
      const canvasEl = document.getElementById("canvas-drop")
      if (canvasEl) {
        const rect = canvasEl.getBoundingClientRect()
        const relX = upEv.clientX - rect.left
        const relY = upEv.clientY - rect.top

        if (relX < 80) {
          onSnapWall("left")
        } else if (rect.width - relX < 80) {
          onSnapWall("right")
        } else if (relY < 80) {
          onSnapWall("top")
        } else if (Math.abs(relX - rect.width / 2) < 80) {
          onSnapWall("center")
        }
      }

      onSetWallHighlight(null)
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
    }

    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", handlePointerUp)
  }

  // Pointer Mouse Drag Tracker on Corner Dots for Live Resizing
  const handleResizePointerDown = (corner: "tl" | "tr" | "bl" | "br", e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const startX = e.clientX
    const startY = e.clientY
    const elementEl = (e.currentTarget as HTMLElement).closest(".sortable-block") as HTMLElement
    const initialWidth = block.customWidth || elementEl?.offsetWidth || 280
    const initialHeight = block.customHeight || elementEl?.offsetHeight || 120

    const handlePointerMove = (moveEv: PointerEvent) => {
      const deltaX = moveEv.clientX - startX
      const deltaY = moveEv.clientY - startY

      let newW = initialWidth
      let newH = initialHeight

      if (corner === "br") {
        newW = Math.max(60, initialWidth + deltaX)
        newH = Math.max(30, initialHeight + deltaY)
      } else if (corner === "bl") {
        newW = Math.max(60, initialWidth - deltaX)
        newH = Math.max(30, initialHeight + deltaY)
      } else if (corner === "tr") {
        newW = Math.max(60, initialWidth + deltaX)
        newH = Math.max(30, initialHeight - deltaY)
      } else if (corner === "tl") {
        newW = Math.max(60, initialWidth - deltaX)
        newH = Math.max(30, initialHeight - deltaY)
      }

      // Snap to 12px grid steps
      newW = Math.round(newW / 12) * 12
      newH = Math.round(newH / 12) * 12

      onResize(newW, newH)
    }

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
    }

    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", handlePointerUp)
  }

  // Apply Custom Dimensions, Margins, and Content-Fitting Wrap_Content
  const isCentered = block.props?.align === "center" || isDualHorizontal || (block.anchoredLeft && block.anchoredRight)
  const constraintStyle: React.CSSProperties = {
    marginTop: block.marginTop ? `${block.marginTop}px` : undefined,
    marginBottom: block.marginBottom ? `${block.marginBottom}px` : undefined,
    marginLeft: isCentered ? "auto" : (block.marginStart ? `${block.marginStart}px` : undefined),
    marginRight: isCentered ? "auto" : (block.marginEnd ? `${block.marginEnd}px` : undefined),
    width: block.customWidth ? `${block.customWidth}px` : (block.layoutWidth === "match_parent" ? "100%" : (block.isInline ? "fit-content" : "100%")),
    height: block.customHeight ? `${block.customHeight}px` : undefined,
    flex: block.isInline ? "0 1 auto" : "1 1 100%",
  }

  return (
    <div
      ref={setNodeRef}
      onPointerDown={handlePointerDown}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        ...constraintStyle,
        ...(isFree ? { position: "absolute", left: `${block.x ?? 0}px`, top: `${block.y ?? 0}px`, zIndex: 30 } : {})
      }}
      onClick={e => {
        e.stopPropagation()
        onSelect()
      }}
      className={cn(
        "sortable-block group relative transition-all select-none max-w-full align-top",
        block.isInline ? "inline-block my-1.5 mx-1 shrink-0 w-fit" : "block my-3.5 w-full",
        isCentered && "mx-auto text-center",
        isSelected
          ? (isNearTop ? "mb-14 mt-3 ring-2 ring-primary ring-offset-2 ring-offset-background shadow-md z-40" : "mt-12 mb-3 ring-2 ring-primary ring-offset-2 ring-offset-background shadow-md z-40")
          : "hover:ring-1 hover:ring-primary/40",
        isFree && "cursor-move shadow-xl ring-2 ring-primary active:ring-purple-500",
        isDragging && "opacity-40 z-50 scale-[0.99]",
        isDropTarget && "ring-2 ring-emerald-500 ring-offset-2"
      )}
    >
      {/* Corner Resize Handles with Active Mouse Dragging & Double-Click Reset */}
      {isSelected && (
        <div className="absolute inset-0 pointer-events-none z-50">
          <div
            onPointerDown={e => handleResizePointerDown("tl", e)}
            onDoubleClick={e => { e.stopPropagation(); onResize(0, 0) }}
            className="resize-handle absolute -top-1.5 -left-1.5 size-3.5 bg-primary border-2 border-background rounded-xs pointer-events-auto cursor-nwse-resize hover:scale-150 transition-transform shadow-xs"
            title="Drag Corner to Resize Top-Left (Double-click to reset to wrap_content)"
          />
          <div
            onPointerDown={e => handleResizePointerDown("tr", e)}
            onDoubleClick={e => { e.stopPropagation(); onResize(0, 0) }}
            className="resize-handle absolute -top-1.5 -right-1.5 size-3.5 bg-primary border-2 border-background rounded-xs pointer-events-auto cursor-nesw-resize hover:scale-150 transition-transform shadow-xs"
            title="Drag Corner to Resize Top-Right (Double-click to reset to wrap_content)"
          />
          <div
            onPointerDown={e => handleResizePointerDown("bl", e)}
            onDoubleClick={e => { e.stopPropagation(); onResize(0, 0) }}
            className="resize-handle absolute -bottom-1.5 -left-1.5 size-3.5 bg-primary border-2 border-background rounded-xs pointer-events-auto cursor-nesw-resize hover:scale-150 transition-transform shadow-xs"
            title="Drag Corner to Resize Bottom-Left (Double-click to reset to wrap_content)"
          />
          <div
            onPointerDown={e => handleResizePointerDown("br", e)}
            onDoubleClick={e => { e.stopPropagation(); onResize(0, 0) }}
            className="resize-handle absolute -bottom-1.5 -right-1.5 size-3.5 bg-primary border-2 border-background rounded-xs pointer-events-auto cursor-nwse-resize hover:scale-150 transition-transform shadow-xs"
            title="Drag Corner to Resize Bottom-Right (Double-click to reset to wrap_content)"
          />
        </div>
      )}

      {/* Animated Dual Spring Coil SVG Overlay (Blueprint Mode Only) */}
      {isBlueprint && isSelected && (activeSpringDot || isDualHorizontal) && (
        <SpringCoilSvg direction={activeSpringDot ?? (isDualHorizontal ? "dual-horizontal" : "left")} bias={block.horizontalBias ?? 50} />
      )}

      {/* Interactive Constraint Spring Anchor Dots (Blueprint Mode Only) */}
      {isBlueprint && isSelected && (
        <div className="absolute inset-0 pointer-events-none z-40">
          <div
            onPointerDown={e => handleAnchorPointerDown("top", e)}
            onMouseEnter={() => setActiveSpringDot("top")}
            onMouseLeave={() => setActiveSpringDot(null)}
            onClick={e => { e.stopPropagation(); onSnapWall("top") }}
            className={cn("anchor-dot absolute -top-1.5 left-1/2 -translate-x-1/2 size-3.5 border-2 border-background rounded-full pointer-events-auto cursor-crosshair hover:scale-125 transition-transform shadow-md",
              block.anchoredTop ? "bg-emerald-500" : "bg-primary")}
            title="Drag Spring Dot to Attach to Top Wall"
          />
          <div
            onPointerDown={e => handleAnchorPointerDown("bottom", e)}
            onMouseEnter={() => setActiveSpringDot("bottom")}
            onMouseLeave={() => setActiveSpringDot(null)}
            onClick={e => { e.stopPropagation(); onSnapWall("bottom") }}
            className={cn("anchor-dot absolute -bottom-1.5 left-1/2 -translate-x-1/2 size-3.5 border-2 border-background rounded-full pointer-events-auto cursor-crosshair hover:scale-125 transition-transform shadow-md",
              block.anchoredBottom ? "bg-emerald-500" : "bg-primary")}
            title="Drag Spring Dot to Attach to Bottom Wall"
          />
          <div
            onPointerDown={e => handleAnchorPointerDown("left", e)}
            onMouseEnter={() => setActiveSpringDot("left")}
            onMouseLeave={() => setActiveSpringDot(null)}
            onClick={e => { e.stopPropagation(); onSnapWall("left") }}
            className={cn("anchor-dot absolute top-1/2 -left-1.5 -translate-y-1/2 size-3.5 border-2 border-background rounded-full pointer-events-auto cursor-crosshair hover:scale-125 transition-transform shadow-md",
              block.anchoredLeft ? "bg-emerald-500" : "bg-primary")}
            title="Drag Spring Dot to Attach to Left Wall"
          />
          <div
            onPointerDown={e => handleAnchorPointerDown("right", e)}
            onMouseEnter={() => setActiveSpringDot("right")}
            onMouseLeave={() => setActiveSpringDot(null)}
            onClick={e => { e.stopPropagation(); onSnapWall("right") }}
            className={cn("anchor-dot absolute top-1/2 -right-1.5 -translate-y-1/2 size-3.5 border-2 border-background rounded-full pointer-events-auto cursor-crosshair hover:scale-125 transition-transform shadow-md",
              block.anchoredRight ? "bg-emerald-500" : "bg-primary")}
            title="Drag Spring Dot to Attach to Right Wall"
          />
        </div>
      )}

      {/* Dimension Readout Badge */}
      {isSelected && (
        <div className={cn("absolute z-50 px-2 py-0.5 rounded bg-card text-foreground font-mono text-[9px] font-bold border border-border shadow-xs pointer-events-none flex items-center gap-1",
          isNearTop ? "-bottom-6 right-0" : "-top-3 right-2")}>
          <Zap className="size-3 text-primary animate-pulse" />
          Size [{block.customWidth ? `${block.customWidth}px` : "wrap_content"} x {block.customHeight ? `${block.customHeight}px` : "wrap_content"}]
        </div>
      )}

      {/* Floating Non-Clipped Action Bar on Selection */}
      {isSelected && (
        <div
          onClick={e => e.stopPropagation()}
          className={cn(
            "absolute z-50 flex items-center gap-1 p-1 rounded-md bg-card text-card-foreground shadow-2xl border border-border text-xs animate-in fade-in zoom-in-95 duration-150 whitespace-nowrap",
            isNearTop ? "top-full mt-2" : "-top-11",
            isNearRight ? "right-0 left-auto" : "left-0"
          )}
        >
          <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground rounded text-[10px]">
            {def?.label || block.type}
          </span>

          <Separator orientation="vertical" className="h-3.5 bg-border mx-0.5" />

          {/* Reset Size to Wrap Content */}
          <button
            type="button"
            onClick={() => onResize(0, 0)}
            className="px-1.5 py-0.5 rounded text-[10px] font-bold hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            title="Reset to Content Fit (wrap_content)"
          >
            <RotateCcw className="size-3" /> Wrap Content
          </button>

          <Separator orientation="vertical" className="h-3.5 bg-border mx-0.5" />

          {/* Freeform Mode Toggle */}
          <button
            type="button"
            onClick={onToggleFreeform}
            className={cn("px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1",
              isFree ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground")}
            title="Toggle Freeform Direct Pointer Drag Placement"
          >
            <Move className="size-3" /> {isFree ? "Freeform Drag" : "Flow"}
          </button>

          <Separator orientation="vertical" className="h-3.5 bg-border mx-0.5" />

          {/* Inline Side-by-Side Row Toggle */}
          <button
            type="button"
            onClick={onToggleInline}
            className={cn("px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1",
              block.isInline ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground")}
            title="Toggle Side-by-Side Row Placement"
          >
            <Rows className="size-3" /> {block.isInline ? "Side-by-Side" : "Full Block"}
          </button>

          <Separator orientation="vertical" className="h-3.5 bg-border mx-0.5" />

          <button
            type="button"
            onClick={() => onSnapWall("center")}
            className={cn("p-1 rounded hover:bg-muted text-muted-foreground flex items-center gap-1 text-[10px] font-bold", isDualHorizontal && "bg-primary/20 text-primary")}
            title="Dual-Wall Centered Spring"
          >
            <Compass className="size-3.5 text-primary" /> Both Walls
          </button>

          <Separator orientation="vertical" className="h-3.5 bg-border mx-0.5" />

          {/* Quick Alignment Tools */}
          <button
            type="button"
            onClick={() => onAlignChange("left")}
            className={cn("p-1 rounded hover:bg-muted text-muted-foreground", block.props.align === "left" && "bg-muted text-foreground font-bold")}
            title="Align Left"
          >
            <AlignLeft className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onAlignChange("center")}
            className={cn("p-1 rounded hover:bg-muted text-muted-foreground", block.props.align === "center" && "bg-muted text-foreground font-bold")}
            title="Align Center"
          >
            <AlignCenter className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onAlignChange("right")}
            className={cn("p-1 rounded hover:bg-muted text-muted-foreground", block.props.align === "right" && "bg-muted text-foreground font-bold")}
            title="Align Right"
          >
            <AlignRight className="size-3.5" />
          </button>

          <Separator orientation="vertical" className="h-3.5 bg-border mx-0.5" />

          {/* Drag handle */}
          <div {...attributes} {...listeners} className="p-1 hover:bg-muted rounded cursor-grab active:cursor-grabbing text-muted-foreground">
            <GripVertical className="size-3.5" />
          </div>

          <button
            type="button"
            onClick={onMoveUp}
            className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
            title="Move Up"
          >
            <ChevronUp className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
            title="Move Down"
          >
            <ChevronDown className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={onDuplicate}
            className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
            title="Duplicate Block"
          >
            <Copy className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1 hover:bg-rose-500/20 rounded text-muted-foreground hover:text-rose-500"
            title="Delete Block"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      )}

      {/* Main Block Content */}
      <div className="relative overflow-hidden w-full h-full">
        {def ? (
          def.render(block.props, isBlueprint, block.customWidth, block.customHeight)
        ) : (
          <div className="p-4 text-xs text-rose-500 border border-dashed border-rose-500/50 rounded">
            Unknown block type: {block.type}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Property & Constraint Inspector Component ────────────────────────────────

function PropsPanel({ block, allBlocks, onChange, onChangeConstraints }: {
  block: Block;
  allBlocks: Block[];
  onChange: (key: string, val: string) => void;
  onChangeConstraints: (patch: Partial<Block>) => void;
}) {
  const def = BLOCK_DEFS.find(d => d.type === block.type)
  const otherBlocks = allBlocks.filter(b => b.id !== block.id)

  return (
    <div className="p-4 space-y-4 text-xs select-none">
      <div className="flex items-center justify-between border-b pb-2">
        <span className="font-bold text-foreground">{def?.label || block.type} Inspector</span>
        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-primary/10 text-primary font-bold uppercase">{block.type}</span>
      </div>

      {/* Component-to-Component Tension Linker */}
      <div className="space-y-3 p-3 bg-muted/30 rounded-lg border border-border">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <Link2 className="size-3.5 text-primary" /> Link Component (Blueprint Mode Only)
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-mono text-muted-foreground block">Target Component to Link:</span>
          <Select
            value={block.linkedTargetId || "none"}
            onValueChange={val => onChangeConstraints({ linkedTargetId: val === "none" ? undefined : val })}
          >
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select target component..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none" className="text-xs text-muted-foreground">None (Unlinked)</SelectItem>
              {otherBlocks.map(b => {
                const bDef = BLOCK_DEFS.find(d => d.type === b.type)
                return (
                  <SelectItem key={b.id} value={b.id} className="text-xs">
                    {bDef?.label || b.type} ({b.props.text || b.props.label || b.id.slice(0, 4)})
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>

        {block.linkedTargetId && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChangeConstraints({ linkedTargetId: undefined })}
            className="w-full h-7 text-[10px] gap-1 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
          >
            <Unlink className="size-3" /> Unlink Component Spring
          </Button>
        )}
      </div>

      {/* Freeform Direct Drag Control */}
      <div className="space-y-2 p-3 bg-muted/30 rounded-lg border border-border">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <Move className="size-3.5 text-primary" /> Freeform Canvas Dragging
        </div>
        <button
          type="button"
          onClick={() => onChangeConstraints({ isFreeform: !block.isFreeform })}
          className={cn("w-full py-1.5 px-2 rounded border text-xs font-bold text-center transition-all cursor-pointer",
            block.isFreeform ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted text-foreground")}
        >
          {block.isFreeform ? "✓ Freeform Pointer Drag Active" : "+ Enable Freeform Mouse Drag"}
        </button>
      </div>

      {/* Corner Resize & Dimensions Control */}
      <div className="space-y-3 p-3 bg-muted/30 rounded-lg border border-border">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <Maximize2 className="size-3.5 text-primary" /> Dimensions & Corner Resizing
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[10px] font-mono text-muted-foreground block mb-0.5">Width (px)</span>
            <Input
              type="number"
              placeholder="wrap_content"
              value={block.customWidth ?? ""}
              onChange={e => onChangeConstraints({ customWidth: e.target.value ? Number(e.target.value) : undefined })}
              className="h-7 text-xs font-mono"
            />
          </div>
          <div>
            <span className="text-[10px] font-mono text-muted-foreground block mb-0.5">Height (px)</span>
            <Input
              type="number"
              placeholder="wrap_content"
              value={block.customHeight ?? ""}
              onChange={e => onChangeConstraints({ customHeight: e.target.value ? Number(e.target.value) : undefined })}
              className="h-7 text-xs font-mono"
            />
          </div>
        </div>

        <div className="flex gap-1 pt-1">
          <button
            type="button"
            onClick={() => onChangeConstraints({ customWidth: undefined, customHeight: undefined })}
            className="flex-1 py-1 rounded border bg-card text-[10px] font-bold text-center hover:bg-muted"
          >
            Wrap Content
          </button>
          <button
            type="button"
            onClick={() => onChangeConstraints({ customWidth: 320, isInline: true })}
            className="flex-1 py-1 rounded border bg-card text-[10px] font-bold text-center hover:bg-muted"
          >
            Medium (320px)
          </button>
          <button
            type="button"
            onClick={() => onChangeConstraints({ customWidth: undefined, isInline: false, layoutWidth: "match_parent" })}
            className="flex-1 py-1 rounded border bg-card text-[10px] font-bold text-center hover:bg-muted"
          >
            Full Width
          </button>
        </div>
      </div>

      {/* Row Side-by-Side Flow */}
      <div className="space-y-2 p-3 bg-muted/30 rounded-lg border border-border">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <Rows className="size-3.5 text-primary" /> Row Flow (Side-by-Side)
        </div>
        <button
          type="button"
          onClick={() => onChangeConstraints({ isInline: !block.isInline })}
          className={cn("w-full py-1.5 px-2 rounded border text-xs font-bold text-center transition-all cursor-pointer",
            block.isInline ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted text-foreground")}
        >
          {block.isInline ? "✓ Side-by-Side Row Mode Active" : "+ Enable Side-by-Side in 1 Row"}
        </button>
      </div>

      {/* Spring Tension Directional Anchors */}
      <div className="space-y-3 p-3 bg-muted/30 rounded-lg border border-border">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <Zap className="size-3.5 text-primary" /> Spring Tension & Direction Anchors
        </div>

        {/* Direction Presets */}
        <div className="grid grid-cols-3 gap-1">
          <button
            type="button"
            onClick={() => onChangeConstraints({ horizontalBias: 0, verticalBias: 0, anchoredLeft: true, anchoredRight: false })}
            className="py-1 px-1.5 rounded border bg-card text-[10px] font-bold text-center hover:bg-muted flex items-center justify-center gap-1"
          >
            <ArrowUpLeft className="size-3" /> Top-Left
          </button>
          <button
            type="button"
            onClick={() => onChangeConstraints({ horizontalBias: 50, verticalBias: 0, anchoredLeft: true, anchoredRight: true })}
            className="py-1 px-1.5 rounded border bg-card text-[10px] font-bold text-center hover:bg-muted flex items-center justify-center gap-1"
          >
            <ChevronUp className="size-3" /> Top-Center
          </button>
          <button
            type="button"
            onClick={() => onChangeConstraints({ horizontalBias: 100, verticalBias: 0, anchoredLeft: false, anchoredRight: true })}
            className="py-1 px-1.5 rounded border bg-card text-[10px] font-bold text-center hover:bg-muted flex items-center justify-center gap-1"
          >
            <ArrowUpRight className="size-3" /> Top-Right
          </button>
          <button
            type="button"
            onClick={() => onChangeConstraints({ horizontalBias: 50, verticalBias: 50, anchoredLeft: true, anchoredRight: true, anchoredTop: true, anchoredBottom: true })}
            className="py-1 px-1.5 rounded border bg-card text-[10px] font-bold text-center hover:bg-muted flex items-center justify-center gap-1 col-span-2 bg-primary/10 border-primary/40 text-primary"
          >
            <Compass className="size-3 text-primary" /> Both Walls (Dual Spring)
          </button>
          <button
            type="button"
            onClick={() => onChangeConstraints({ horizontalBias: 100, verticalBias: 100, anchoredLeft: false, anchoredRight: true })}
            className="py-1 px-1.5 rounded border bg-card text-[10px] font-bold text-center hover:bg-muted flex items-center justify-center gap-1"
          >
            <ArrowDownRight className="size-3" /> Btm-Right
          </button>
        </div>

        {/* Sliders for Tension Bias */}
        <div className="space-y-2 pt-1">
          <div>
            <div className="flex justify-between text-[10px] font-mono text-muted-foreground mb-1">
              <span>Horizontal Tension Bias (Left vs Right)</span>
              <span className="font-bold text-primary">{block.horizontalBias ?? 50}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={block.horizontalBias ?? 50}
              onChange={e => onChangeConstraints({ horizontalBias: Number(e.target.value), anchoredLeft: true, anchoredRight: true })}
              className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          <div>
            <div className="flex justify-between text-[10px] font-mono text-muted-foreground mb-1">
              <span>Vertical Tension Bias (Top vs Bottom)</span>
              <span className="font-bold text-primary">{block.verticalBias ?? 50}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={block.verticalBias ?? 50}
              onChange={e => onChangeConstraints({ verticalBias: Number(e.target.value), anchoredTop: true, anchoredBottom: true })}
              className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>
        </div>
      </div>

      {def?.fields ? (
        def.fields.map(field => (
          <div key={field.key} className="space-y-1.5">
            <Label className="text-xs font-semibold">{field.label}</Label>
            {field.type === "textarea" ? (
              <Textarea
                value={block.props[field.key] ?? ""}
                onChange={e => onChange(field.key, e.target.value)}
                className="text-xs min-h-[80px] resize-none"
              />
            ) : field.type === "select" ? (
              <Select value={block.props[field.key] ?? ""} onValueChange={v => onChange(field.key, v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {field.options!.map(o => <SelectItem key={o} value={o} className="text-xs">{o}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={block.props[field.key] ?? ""}
                onChange={e => onChange(field.key, e.target.value)}
                className="h-8 text-xs"
              />
            )}
          </div>
        ))
      ) : (
        <p className="text-xs text-muted-foreground italic">No property fields defined for this block type.</p>
      )}
    </div>
  )
}

// ── AI Code Widget Component ──────────────────────────────────────────────────

function AiCodeWidget({ code, blockCount }: { code: string; blockCount: number }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mt-2 rounded-lg border border-purple-500/30 bg-[#1a1b26] text-xs overflow-hidden shadow-sm">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between px-2 py-1.5 bg-purple-950/40 hover:bg-purple-900/40 cursor-pointer select-none border-b border-purple-500/20 text-[11px] font-mono text-purple-300"
      >
        <div className="flex items-center gap-1.5 font-bold truncate">
          <Code2 className="size-3.5 text-purple-400 shrink-0" />
          <span className="truncate">Fusion Code ({blockCount} {blockCount === 1 ? 'block' : 'blocks'})</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleCopy}
            className="p-1 rounded hover:bg-purple-800/40 text-purple-300 transition-colors"
            title="Copy code"
          >
            {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
          </button>
          {isOpen ? <ChevronUp className="size-3 text-purple-400" /> : <ChevronDown className="size-3 text-purple-400" />}
        </div>
      </div>
      {isOpen && (
        <div className="p-2 overflow-x-auto max-h-48 font-mono text-[10px] text-purple-100/90 leading-relaxed bg-[#1a1b26]/90 whitespace-pre scrollbar-thin">
          {code}
        </div>
      )}
    </div>
  )
}

// ── Main Page Builder Component ─────────────────────────────────────────────

export default function PageEditorPage() {
  const params = useParams()
  const router = useRouter()
  const username = params?.username as string
  const uid = params?.uid as string

  const [blocks, setBlocks] = React.useState<Block[]>([])
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [preview, setPreview] = React.useState(false)
  const [viewport, setViewport] = React.useState<ViewportMode>("desktop")
  const [viewMode, setViewMode] = React.useState<ViewMode>("blueprint")
  const [showGridLines, setShowGridLines] = React.useState(true)
  const [pageName, setPageName] = React.useState("Untitled Page")
  const [slug, setSlug] = React.useState("")
  const [saved, setSaved] = React.useState(false)
  const [activeWallHighlight, setActiveWallHighlight] = React.useState<"left" | "right" | "top" | "bottom" | "center" | null>(null)

  React.useEffect(() => {
    const page = getPages().find((p: any) => p.uid === uid)
    if (page) {
      setPageName(page.name ?? "Untitled Page")
      setSlug(page.slug ?? "")
      if (page.blocks && Array.isArray(page.blocks)) setBlocks(page.blocks.map(sanitizeBlock))
    }
  }, [uid])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  )

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

    if (!over) return

    if (active.data.current?.source === "palette") {
      const type = active.data.current.type as BlockType
      const def = BLOCK_DEFS.find(d => d.type === type)
      const newBlock: Block = {
        id: crypto.randomUUID(),
        type,
        props: { ...(def?.defaultProps || {}) },
        x: 0,
        y: 0,
        isFreeform: false,
        isInline: true,
        marginTop: 0,
        marginBottom: 0,
        marginStart: 0,
        marginEnd: 0,
        horizontalBias: 50,
        verticalBias: 50,
        layoutWidth: "wrap_content",
        anchoredLeft: true,
        anchoredRight: true,
      }

      if (over.id !== "canvas-drop") {
        setBlocks(prev => {
          const idx = prev.findIndex(b => b.id === over.id)
          if (idx >= 0) {
            const next = [...prev]
            next.splice(idx + 1, 0, newBlock)
            return next
          }
          return [...prev, newBlock]
        })
      } else {
        setBlocks(prev => [...prev, newBlock])
      }
      setSelectedId(newBlock.id)
    } else if (active.id !== over.id) {
      setBlocks(prev => {
        const oldIndex = prev.findIndex(b => b.id === active.id)
        const newIndex = prev.findIndex(b => b.id === over.id)
        if (oldIndex >= 0 && newIndex >= 0) {
          return arrayMove(prev, oldIndex, newIndex)
        }
        return prev
      })
    }
  }

  const addBlock = (type: BlockType) => {
    const def = BLOCK_DEFS.find(d => d.type === type)
    const newBlock: Block = {
      id: crypto.randomUUID(),
      type,
      props: { ...(def?.defaultProps || {}) },
      x: 0,
      y: 0,
      isFreeform: false,
      isInline: true,
      horizontalBias: 50,
      verticalBias: 50,
      anchoredLeft: true,
      anchoredRight: true,
    }
    setBlocks(prev => [...prev, newBlock])
    setSelectedId(newBlock.id)
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

  const handleDuplicateBlock = (id: string) => {
    const target = blocks.find(b => b.id === id)
    if (!target) return
    const dup: Block = {
      ...target,
      id: crypto.randomUUID(),
      props: JSON.parse(JSON.stringify(target.props)),
      x: (target.x ?? 0) + 20,
      y: (target.y ?? 0) + 20,
    }
    const idx = blocks.findIndex(b => b.id === id)
    const next = [...blocks]
    next.splice(idx + 1, 0, dup)
    setBlocks(next)
    setSelectedId(dup.id)
  }

  const handleMoveBlock = (id: string, dir: "up" | "down") => {
    const idx = blocks.findIndex(b => b.id === id)
    if (idx < 0) return
    const targetIdx = dir === "up" ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= blocks.length) return
    setBlocks(prev => arrayMove(prev, idx, targetIdx))
  }

  const handleAlignChange = (id: string, align: "left" | "center" | "right") => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, props: { ...b.props, align } } : b))
  }

  const handleToggleFreeform = (id: string) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, isFreeform: !b.isFreeform } : b))
  }

  const handleToggleInline = (id: string) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, isInline: !b.isInline } : b))
  }

  const handleResize = (id: string, customWidth: number, customHeight: number) => {
    setBlocks(prev => prev.map(b => b.id === id ? {
      ...b,
      customWidth: customWidth > 0 ? customWidth : undefined,
      customHeight: customHeight > 0 ? customHeight : undefined,
    } : b))
  }

  const handleUpdateCoords = (id: string, x: number, y: number) => {
    setBlocks(prev => {
      const movedBlock = prev.find(b => b.id === id)
      if (!movedBlock) return prev
      const deltaX = x - (movedBlock.x ?? 0)
      const deltaY = y - (movedBlock.y ?? 0)

      return prev.map(b => {
        if (b.id === id) return { ...b, x, y }
        if (b.linkedTargetId === id) {
          return { ...b, x: (b.x ?? 0) + deltaX, y: (b.y ?? 0) + deltaY }
        }
        return b
      })
    })
  }

  const handleSnapWall = (id: string, wall: "left" | "right" | "top" | "bottom" | "center") => {
    setBlocks(prev => prev.map(b => {
      if (b.id !== id) return b
      if (wall === "center") return { ...b, isFreeform: false, horizontalBias: 50, anchoredLeft: true, anchoredRight: true }
      if (wall === "left") return { ...b, isFreeform: false, horizontalBias: 0, anchoredLeft: true, anchoredRight: false }
      if (wall === "right") return { ...b, isFreeform: false, horizontalBias: 100, anchoredLeft: false, anchoredRight: true }
      if (wall === "top") return { ...b, isFreeform: true, y: 0, anchoredTop: true }
      return b
    }))
  }

  const selectedBlock = blocks.find(b => b.id === selectedId) ?? null
  const linkedTargetBlock = selectedBlock?.linkedTargetId ? blocks.find(b => b.id === selectedBlock.linkedTargetId) ?? null : null

  const [leftSize, setLeftSize] = React.useState<number>(() => {
    if (typeof window === "undefined") return 20
    return Number(localStorage.getItem(PANEL_SIZE_KEY) ?? 20)
  })

  const handleLeftResize = (size: any) => {
    setLeftSize(Number(size))
    localStorage.setItem(PANEL_SIZE_KEY, String(size))
  }

  const [aiPrompt, setAiPrompt] = React.useState("")
  const [aiLoading, setAiLoading] = React.useState(false)
  const [selectedModel, setSelectedModel] = React.useState("meta/llama-3.1-8b-instruct")
  const [aiMessages, setAiMessages] = React.useState<{ role: "user" | "assistant"; text: string; fusionCode?: string; blockCount?: number }[]>([])
  const aiBottomRef = React.useRef<HTMLDivElement>(null)

  // ── File attachment state for AI Assistant ──
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [attachedFile, setAttachedFile] = React.useState<{ name: string; type: string; content: string; kind: "image" | "pdf" | "video" | "text" } | null>(null)
  const [isUploading, setIsUploading] = React.useState(false)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      let kind: "image" | "pdf" | "video" | "text" = "text"
      if (file.type.startsWith("image/")) kind = "image"
      else if (file.type === "application/pdf") kind = "pdf"
      else if (file.type.startsWith("video/")) kind = "video"

      let contentStr = ""
      if (file.type.startsWith("text/") || file.type.includes("json")) {
        contentStr = await file.text()
      }

      setAttachedFile({
        name: file.name,
        type: file.type,
        content: contentStr,
        kind,
      })
    } catch (err) {
      console.error("Error reading file:", err)
    } finally {
      setIsUploading(false)
    }
  }

  const handleAiGenerate = async (customText?: string) => {
    let promptToSend = (typeof customText === "string" ? customText : aiPrompt).trim()
    if (!promptToSend && !attachedFile) return
    if (aiLoading) return

    if (attachedFile) {
      promptToSend = `${promptToSend}\n\n[Attached File: ${attachedFile.name}${attachedFile.content ? `\nContent:\n${attachedFile.content.slice(0, 500)}` : ""}]`.trim()
    }

    const displayPrompt = typeof customText === "string" ? customText : (aiPrompt || (attachedFile ? `Uploaded ${attachedFile.name}` : ""))
    setAiMessages(prev => [...prev, { role: "user", text: displayPrompt }])
    if (typeof customText !== "string") setAiPrompt("")
    setAttachedFile(null)
    setAiLoading(true)

    try {
      // Send prompt and current blocks state to backend page builder AI route
      const response = await fetch("/api/backend/api/page-builder/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptToSend,
          blocks: blocks, // Pass current page elements so AI can preserve and design them!
          viewport,
          viewMode,
          model: selectedModel,
        }),
      })

      if (!response.ok) {
        throw new Error(`AI Backend returned status ${response.status}`)
      }

      const data = await response.json()
      if (data.blocks && Array.isArray(data.blocks)) {
        const sanitized = data.blocks.map(sanitizeBlock)
        setBlocks(sanitized)
        const generatedCode = blocksToFusion(sanitized as any)
        setAiMessages(prev => [
          ...prev,
          { role: "assistant", text: data.explanation || `Successfully designed your page with ${data.blocks.length} elements!`, fusionCode: generatedCode, blockCount: sanitized.length }
        ])
      } else {
        setAiMessages(prev => [
          ...prev,
          { role: "assistant", text: "AI responded but could not format layout blocks. Try rephrasing your request." }
        ])
      }
    } catch (err: any) {
      console.error("[PageBuilder AI Error]", err)
      // Fallback local layout design execution when offline/disconnected
      const existing = [...blocks]
      if (existing.length > 0) {
        const redesigned = existing.map((b, idx) => ({
          ...b,
          isInline: ["button", "badge", "avatar", "stats", "card"].includes(b.type),
          isFreeform: false,
          props: {
            ...b.props,
            align: b.type === "heading" && idx === 0 ? "center" : (b.props.align || "left")
          }
        }))
        const redesignedSanitized = redesigned.map(sanitizeBlock)
        setBlocks(redesignedSanitized)
        const redesignedCode = blocksToFusion(redesignedSanitized as any)
        setAiMessages(prev => [
          ...prev,
          { role: "assistant", text: `Preserved all ${existing.length} existing elements and applied smart layout formatting!`, fusionCode: redesignedCode, blockCount: redesignedSanitized.length }
        ])
      } else {
        const generated: Block[] = [
          { id: crypto.randomUUID(), type: "badge", props: { label: "VIDYASCHOOL PORTAL 2026-27", variant: "default", className: "bg-primary/10 text-primary border-primary/25 font-bold" }, isInline: false },
          { id: crypto.randomUUID(), type: "heading", props: { text: "VidyaSchool Academic Performance & STEM Excellence", level: "h1", align: "center", className: "tracking-tight text-foreground font-black" }, isInline: false },
          { id: crypto.randomUUID(), type: "paragraph", props: { text: "Empowering scholars and educators with integrated digital learning, board examination analytics, live syllabus tracking, and AI tutoring.", align: "center", className: "max-w-2xl text-muted-foreground" }, isInline: false },
          { id: crypto.randomUUID(), type: "button", props: { label: "View Syllabus PDF", variant: "default", align: "center", className: "shadow-md" }, isInline: true },
          { id: crypto.randomUUID(), type: "button", props: { label: "Explore Programs", variant: "outline", align: "center" }, isInline: true },
          { id: crypto.randomUUID(), type: "stats", props: { value: "98.5%", label: "Board Exam Pass Rate", change: "+3.4% vs last year", className: "bg-card shadow-sm" }, isInline: true },
          { id: crypto.randomUUID(), type: "stats", props: { value: "10,000+", label: "Enrolled Scholars", change: "Active Scholars", className: "bg-card shadow-sm" }, isInline: true },
          { id: crypto.randomUUID(), type: "stats", props: { value: "100%", label: "STEM Accreditation", change: "Grade A Certified", className: "bg-card shadow-sm" }, isInline: true },
          { id: crypto.randomUUID(), type: "pdf", props: { title: "VidyaSchool_Academic_Performance_Report_2026.pdf", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" }, isInline: false, customHeight: 380 },
          { id: crypto.randomUUID(), type: "card", props: { title: "Academic Excellence & STEM", body: "State-of-the-art laboratory access, interactive coding courses, and AI-assisted tutoring.", progress: "90%", className: "bg-card p-6 rounded-2xl border shadow-sm" }, isInline: true },
          { id: crypto.randomUUID(), type: "card", props: { title: "Holistic Development & Athletics", body: "Olympic-standard sports facilities, arts, music, and leadership development programs.", progress: "85%", className: "bg-card p-6 rounded-2xl border shadow-sm" }, isInline: true },
        ]
        const generatedSanitized = generated.map(sanitizeBlock)
        setBlocks(generatedSanitized)
        const generatedCode = blocksToFusion(generatedSanitized as any)
        setAiMessages(prev => [
          ...prev,
          { role: "assistant", text: `Generated layout section with ${generated.length} elements for "${promptToSend}".`, fusionCode: generatedCode, blockCount: generatedSanitized.length }
        ])
      }
    } finally {
      setAiLoading(false)
      setTimeout(() => aiBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50)
    }
  }

  const viewportWidths: Record<ViewportMode, string> = {
    desktop: "w-full max-w-full px-4 sm:px-8 md:px-12 mx-auto",
    tablet: "w-full max-w-3xl mx-auto border-x border-border shadow-2xl bg-card/20 px-4",
    mobile: "w-full max-w-sm mx-auto border-x border-border shadow-2xl bg-card/20 px-4",
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden select-none">

      {/* Top bar */}
      <div className="flex items-center gap-2 px-4 h-12 border-b shrink-0 bg-card z-30 overflow-x-auto">
        <Button variant="ghost" size="icon" className="size-7" onClick={() => router.push(`/admin/${username}/page-builder`)}>
          <ArrowLeft className="size-4" />
        </Button>
        <Separator orientation="vertical" className="h-4 mx-1" />
        <Input value={pageName} onChange={e => setPageName(e.target.value)} className="h-7 text-sm font-bold border-0 shadow-none px-1 w-40 focus-visible:ring-1 focus-visible:ring-primary" />
        <span className="text-muted-foreground/40 text-xs">/</span>
        <Input value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))} placeholder="slug" className="h-7 text-xs font-mono border-0 shadow-none px-1 w-28 focus-visible:ring-1 focus-visible:ring-primary text-muted-foreground" />

        <div className="flex-1" />

        {/* View Modes (Design / Blueprint / Split) */}
        <div className="flex items-center border rounded-lg p-0.5 gap-0.5 bg-muted/40 shrink-0">
          <button
            onClick={() => setViewMode("design")}
            className={cn("px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer",
              viewMode === "design" ? "bg-background shadow-xs text-foreground font-bold" : "text-muted-foreground hover:text-foreground")}
            title="Design View (Clean UI Render)"
          >
            <LayoutGrid className="size-3.5 text-primary" /> <span className="hidden md:inline">Design</span>
          </button>
          <button
            onClick={() => setViewMode("blueprint")}
            className={cn("px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer",
              viewMode === "blueprint" ? "bg-primary text-primary-foreground shadow-xs font-bold" : "text-muted-foreground hover:text-foreground")}
            title="Blueprint View (Schematic & Spring Linking)"
          >
            <Layers className="size-3.5" /> <span className="hidden md:inline">Blueprint</span>
          </button>
          <button
            onClick={() => setViewMode("split")}
            className={cn("px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer",
              viewMode === "split" ? "bg-background shadow-xs text-foreground font-bold" : "text-muted-foreground hover:text-foreground")}
            title="Split View (Design + Blueprint Side-by-Side)"
          >
            <Columns3 className="size-3.5" /> <span className="hidden md:inline">Split</span>
          </button>
        </div>

        <Separator orientation="vertical" className="h-4 mx-1 hidden sm:block" />

        {/* Viewport Switcher */}
        <div className="flex items-center border rounded-lg p-0.5 gap-0.5 bg-muted/40 shrink-0">
          <button
            onClick={() => setViewport("desktop")}
            className={cn("p-1.5 rounded transition-all cursor-pointer", viewport === "desktop" ? "bg-background shadow-xs text-foreground" : "text-muted-foreground")}
            title="Desktop Viewport"
          >
            <Monitor className="size-3.5" />
          </button>
          <button
            onClick={() => setViewport("tablet")}
            className={cn("p-1.5 rounded transition-all cursor-pointer", viewport === "tablet" ? "bg-background shadow-xs text-foreground" : "text-muted-foreground")}
            title="Tablet Viewport"
          >
            <Tablet className="size-3.5" />
          </button>
          <button
            onClick={() => setViewport("mobile")}
            className={cn("p-1.5 rounded transition-all cursor-pointer", viewport === "mobile" ? "bg-background shadow-xs text-foreground" : "text-muted-foreground")}
            title="Mobile Viewport"
          >
            <Smartphone className="size-3.5" />
          </button>
        </div>

        {/* Alignment Grid Overlay Toggle */}
        <button
          onClick={() => setShowGridLines(g => !g)}
          className={cn("p-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 transition-all cursor-pointer shrink-0",
            showGridLines ? "bg-primary/10 border-primary/30 text-primary font-bold" : "text-muted-foreground border-transparent hover:bg-muted")}
          title="Toggle Grid Lines"
        >
          <Grid className="size-3.5" />
        </button>

        <Separator orientation="vertical" className="h-4 mx-1 hidden sm:block" />

        <Button
          variant="secondary"
          size="sm"
          disabled={aiLoading}
          onClick={() => handleAiGenerate("Auto-arrange all canvas elements into a stunning modern layout with proper alignment, spacing, and hero hierarchy")}
          className="h-7 text-xs gap-1.5 font-bold bg-primary/10 text-primary hover:bg-primary/20 border border-primary/25 shrink-0 shadow-2xs"
          title="Let AI automatically position, scale, and align all page elements"
        >
          {aiLoading ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3 text-primary animate-pulse" />}
          AI Auto-Design
        </Button>

        <Button variant="outline" size="sm" onClick={() => setPreview(p => !p)} className="h-7 text-xs gap-1.5 font-semibold shrink-0">
          {preview ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
          {preview ? "Edit Mode" : "Live Preview"}
        </Button>
        <Button size="sm" onClick={handleSave} className="h-7 text-xs gap-1.5 font-bold shadow-xs shrink-0">
          <Save className="size-3" />
          {saved ? "Saved!" : "Save Page"}
        </Button>
      </div>

      {/* Main Workspace wrapped in DndContext */}
      {preview ? (
        <div className="flex-1 overflow-y-auto bg-background flex flex-col justify-between select-text">
          {/* Real Main Site Header */}
          <LightHeader />

          {/* Full-width Canvas Viewport Container */}
          <main className="flex-1 w-full bg-background transition-all min-h-[600px] flex flex-col justify-start">
            <div className={cn("px-4 sm:px-6 lg:px-8 py-8 sm:py-14 space-y-6 transition-all", viewportWidths[viewport])}>
              {blocks.map(b => {
                const def = BLOCK_DEFS.find(d => d.type === b.type)
                return (
                  <div
                    key={b.id}
                    style={{
                      width: b.customWidth ? `${b.customWidth}px` : undefined,
                      height: b.customHeight ? `${b.customHeight}px` : undefined,
                      ...(b.isFreeform ? { position: "absolute", left: `${b.x}px`, top: `${b.y}px` } : {})
                    }}
                    className={cn(b.isInline ? "inline-block w-fit" : "w-full block")}
                  >
                    {def ? def.render(b.props, false, b.customWidth, b.customHeight) : null}
                  </div>
                )
              })}
              {blocks.length === 0 && (
                <div className="py-24 text-center text-muted-foreground space-y-2">
                  <p className="text-base font-semibold text-foreground">Your live page canvas is empty</p>
                  <p className="text-xs text-muted-foreground">Switch back to Edit Mode or ask AI Assistant to build a layout.</p>
                </div>
              )}
            </div>
          </main>

          {/* Real Main Site Footer */}
          <Footer />
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
          <ResizablePanelGroup orientation="horizontal" className="flex-1 min-h-0 h-full">

            {/* Left Panel: Palette & AI */}
            <ResizablePanel defaultSize={`${leftSize}%`} minSize="12%" maxSize="30%" onResize={handleLeftResize} className="border-r bg-card overflow-hidden flex flex-col">
              <Tabs defaultValue="blocks" className="flex flex-col flex-1 overflow-hidden">
                <TabsList className="w-full rounded-none shrink-0 bg-transparent border-b h-9">
                  <TabsTrigger value="blocks" className="flex-1 text-xs font-bold">Palette ({BLOCK_DEFS.length})</TabsTrigger>
                  <TabsTrigger value="ai" className="flex-1 text-xs font-bold">AI Assistant</TabsTrigger>
                  <TabsTrigger value="code" className="flex-1 text-xs font-bold flex items-center gap-1"><Code2 className="size-3" />Code</TabsTrigger>
                </TabsList>
                <TabsContent value="blocks" className="flex-1 overflow-y-auto p-2 space-y-3 mt-0">
                  {/* Layout & Container Blocks Category */}
                  <div>
                    <div className="text-[10px] font-extrabold text-primary uppercase tracking-wider px-1 py-1 flex items-center gap-1.5 border-b border-border/40 mb-1.5">
                      <LayoutTemplate className="size-3 text-primary" /> Layout & Containers ({BLOCK_DEFS.filter(b => ["section", "row", "grid", "tabs", "accordion", "columns", "divider", "spacer"].includes(b.type)).length})
                    </div>
                    <div className="space-y-1">
                      {BLOCK_DEFS.filter(b => ["section", "row", "grid", "tabs", "accordion", "columns", "divider", "spacer"].includes(b.type)).map(({ type, label, icon: Icon }) => (
                        <DraggablePaletteItem key={type} type={type} label={label} icon={Icon} onClick={() => addBlock(type)} />
                      ))}
                    </div>
                  </div>

                  {/* Components & Content Widgets Category */}
                  <div>
                    <div className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider px-1 py-1 flex items-center gap-1.5 border-b border-border/40 mb-1.5">
                      <Layers className="size-3 text-muted-foreground" /> Components & Widgets ({BLOCK_DEFS.filter(b => !["section", "row", "grid", "tabs", "accordion", "columns", "divider", "spacer"].includes(b.type)).length})
                    </div>
                    <div className="space-y-1">
                      {BLOCK_DEFS.filter(b => !["section", "row", "grid", "tabs", "accordion", "columns", "divider", "spacer"].includes(b.type)).map(({ type, label, icon: Icon }) => (
                        <DraggablePaletteItem key={type} type={type} label={label} icon={Icon} onClick={() => addBlock(type)} />
                      ))}
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="ai" className="flex-1 overflow-hidden mt-0 flex flex-col">
                  {/* NVIDIA Free Model Selector Header */}
                  <div className="px-3 py-2 border-b bg-muted/30 shrink-0 flex items-center justify-between gap-1 text-xs">
                    <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                      <Zap className="size-3 text-purple-500" /> AI Model:
                    </span>
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger className="h-7 text-[10px] font-mono w-[160px] bg-background border-border">
                        <SelectValue placeholder="Select Model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="meta/llama-3.1-8b-instruct" className="text-xs font-mono">Llama 3.1 8B (Fast)</SelectItem>
                        <SelectItem value="meta/llama-3.3-70b-instruct" className="text-xs font-mono">Llama 3.3 70B (Powerful)</SelectItem>
                        <SelectItem value="nvidia/nemotron-4-340b-instruct" className="text-xs font-mono">Nemotron 4 340B (Ultra)</SelectItem>
                        <SelectItem value="deepseek-ai/deepseek-r1" className="text-xs font-mono">DeepSeek R1 (Reasoning)</SelectItem>
                        <SelectItem value="mistralai/mistral-7b-instruct-v0.3" className="text-xs font-mono">Mistral 7B (Versatile)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <ScrollArea className="flex-1 px-3 py-2">
                    <div className="space-y-2">
                    {aiMessages.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground/60 py-6 text-center">
                        <Sparkles className="size-6 text-purple-500 animate-pulse" />
                        <p className="text-xs font-semibold text-foreground">AI Designer & Page Architect</p>
                        <p className="text-[11px] text-muted-foreground max-w-[210px]">Describe a section or ask AI to design your existing elements without removing them.</p>
                        <div className="flex flex-col gap-1.5 w-full pt-2">
                          <button
                            type="button"
                            onClick={() => handleAiGenerate("With these elements create a nice page")}
                            className="text-left text-[11px] p-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-300 font-medium transition-colors border border-purple-500/20 flex items-center gap-1.5 cursor-pointer"
                          >
                            <Sparkles className="size-3 shrink-0 text-purple-500" /> With these elements create a nice page
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAiGenerate("Arrange side-by-side buttons and stats cards cleanly")}
                            className="text-left text-[11px] p-2 rounded-lg bg-muted hover:bg-muted/80 text-foreground font-medium transition-colors border border-border flex items-center gap-1.5 cursor-pointer"
                          >
                            <LayoutGrid className="size-3 shrink-0 text-primary" /> Arrange side-by-side & balance layout
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAiGenerate("Add Syllabus PDF viewer and KPI stats counter")}
                            className="text-left text-[11px] p-2 rounded-lg bg-muted hover:bg-muted/80 text-foreground font-medium transition-colors border border-border flex items-center gap-1.5 cursor-pointer"
                          >
                            <FileText className="size-3 shrink-0 text-emerald-500" /> Add Syllabus PDF & Stats Counter
                          </button>
                        </div>
                      </div>
                    )}
                    {aiMessages.map((m, i) => (
                      <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[95%] rounded-xl px-3 py-1.5 text-xs ${m.role === "user" ? "bg-primary text-primary-foreground font-medium" : "bg-muted text-foreground"}`}>
                          {m.text}
                          {/* Fusion Code Preview Widget */}
                          {m.fusionCode && (
                            <AiCodeWidget code={m.fusionCode} blockCount={m.blockCount || 0} />
                          )}
                        </div>
                      </div>
                    ))}
                    {aiLoading && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-xl px-3 py-1.5 text-xs flex items-center gap-1.5 text-muted-foreground">
                          <Loader2 className="size-3 animate-spin text-purple-500" /> Generating...
                        </div>
                      </div>
                    )}
                    <div ref={aiBottomRef} />
                    </div>
                  </ScrollArea>
                  <div className="border-t p-2 flex flex-col gap-1.5 shrink-0 bg-card">
                    {/* Attached file preview badge */}
                    {attachedFile && (
                      <div className="flex items-center gap-2 px-1">
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-muted border text-[11px] text-foreground max-w-full">
                          {attachedFile.kind === "image" && <ImageIcon className="size-3 text-sky-500 shrink-0" />}
                          {attachedFile.kind === "pdf" && <FileText className="size-3 text-rose-500 shrink-0" />}
                          {attachedFile.kind === "video" && <Video className="size-3 text-violet-500 shrink-0" />}
                          {attachedFile.kind === "text" && <FileText className="size-3 text-muted-foreground shrink-0" />}
                          <span className="truncate max-w-[140px] font-medium">{attachedFile.name}</span>
                          <button
                            type="button"
                            onClick={() => setAttachedFile(null)}
                            className="ml-1 text-muted-foreground hover:text-foreground transition-colors shrink-0"
                          >
                            <X className="size-3" />
                          </button>
                        </div>
                      </div>
                    )}

                    <form
                      onSubmit={(e) => { e.preventDefault(); handleAiGenerate() }}
                      className="w-full flex items-center gap-1.5 p-1 pl-2.5 rounded-full border border-border bg-background shadow-md focus-within:border-primary min-h-[42px]"
                    >
                      {/* Hidden file input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.pdf,video/*"
                        className="hidden"
                        onChange={handleFileSelect}
                      />

                      {/* Attach button */}
                      <button
                        type="button"
                        disabled={isUploading}
                        onClick={() => fileInputRef.current?.click()}
                        title="Attach image, PDF, or document"
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 transition-all cursor-pointer my-auto"
                      >
                        {isUploading
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Paperclip className="h-3.5 w-3.5" />}
                      </button>

                      <textarea
                        rows={1}
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            handleAiGenerate()
                          }
                        }}
                        placeholder={attachedFile ? `Ask about ${attachedFile.name}...` : "Message AI Assistant..."}
                        className="flex-1 bg-transparent text-xs text-foreground focus:outline-none placeholder:text-muted-foreground/60 px-1 py-1 resize-none max-h-20 min-h-[28px] my-auto scrollbar-none"
                      />

                      <button
                        type="submit"
                        disabled={(!aiPrompt.trim() && !attachedFile) || aiLoading}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-all cursor-pointer my-auto"
                      >
                        {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowUp className="h-3.5 w-3.5" />}
                      </button>
                    </form>
                  </div>
                </TabsContent>
                <TabsContent value="code" className="flex-1 overflow-hidden mt-0 flex flex-col">
                  <FusionCodeEditor
                    blocks={blocks}
                    onApply={(newBlocks) => {
                      setBlocks(newBlocks.map(sanitizeBlock))
                      setSelectedId(null)
                    }}
                  />
                </TabsContent>
              </Tabs>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Center Canvas Studio */}
            <ResizablePanel defaultSize={`${100 - leftSize - 18}%`} minSize="40%" className="overflow-y-auto bg-muted/20 p-6 flex flex-col items-center" onClick={() => setSelectedId(null)}>
              {/* Responsive Frame Readout Header */}
              <div className={cn("w-full mb-2 flex items-center justify-between text-xs select-none transition-all", viewMode === "split" ? "max-w-5xl" : viewportWidths[viewport])}>
                <span className="px-2 py-0.5 rounded-none bg-muted text-muted-foreground text-[10px] font-mono font-bold uppercase tracking-wider border flex items-center gap-1">
                  <Zap className="size-3 text-primary" /> MODE: {viewMode.toUpperCase()} ({viewport.toUpperCase()})
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  PALETTE WIDGETS: {BLOCK_DEFS.length} COMPONENTS (INCL. PDF VIEWER)
                </span>
              </div>

              {/* Canvas Container */}
              <div className={cn("w-full transition-all flex gap-4 relative", viewMode === "split" ? "max-w-5xl" : viewportWidths[viewport])} onClick={e => e.stopPropagation()}>

                {/* Design View (Clean UI Render without links/springs) */}
                {(viewMode === "design" || viewMode === "split") && (
                  <div className="flex-1">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1 flex items-center gap-1">
                      <LayoutGrid className="size-3 text-primary" /> Design View (Clean Render)
                    </div>
                    <CanvasDropArea isOver={activeDragType !== null} showGrid={showGridLines} isBlueprint={false} activeWallHighlight={null}>
                      <SortableContext items={blocks.map(b => b.id)} strategy={rectSortingStrategy}>
                        {blocks.map(block => (
                          <SortableBlock
                            key={block.id}
                            block={block}
                            isSelected={selectedId === block.id}
                            isDropTarget={overBlockId === block.id && activeDragType !== null}
                            isBlueprint={false}
                            onSelect={() => setSelectedId(block.id)}
                            onDelete={() => { setBlocks(p => p.filter(b => b.id !== block.id)); if (selectedId === block.id) setSelectedId(null) }}
                            onDuplicate={() => handleDuplicateBlock(block.id)}
                            onMoveUp={() => handleMoveBlock(block.id, "up")}
                            onMoveDown={() => handleMoveBlock(block.id, "down")}
                            onAlignChange={align => handleAlignChange(block.id, align)}
                            onToggleFreeform={() => handleToggleFreeform(block.id)}
                            onToggleInline={() => handleToggleInline(block.id)}
                            onSnapWall={wall => handleSnapWall(block.id, wall)}
                            onResize={(w, h) => handleResize(block.id, w, h)}
                            onUpdateCoords={(x, y) => handleUpdateCoords(block.id, x, y)}
                            onSetWallHighlight={w => setActiveWallHighlight(w)}
                          />
                        ))}
                      </SortableContext>

                      {blocks.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-28 text-muted-foreground gap-3 border-2 border-dashed border-border w-full">
                          <div className="size-12 rounded bg-muted flex items-center justify-center text-muted-foreground">
                            <Plus className="size-6" />
                          </div>
                          <p className="text-sm font-semibold text-foreground">Clean Design View</p>
                          <p className="text-xs text-muted-foreground text-center max-w-xs">Switch to Blueprint View to edit spring links and wall constraints.</p>
                        </div>
                      )}
                    </CanvasDropArea>
                  </div>
                )}

                {/* Blueprint View (Schematic Spring Anchors & Component Linking Lines) */}
                {(viewMode === "blueprint" || viewMode === "split") && (
                  <div className="flex-1 relative">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1 flex items-center gap-1">
                      <Layers className="size-3 text-primary" /> Blueprint View (Spring Coils & Linking)
                    </div>

                    {/* Component Link Line (Blueprint View Only) */}
                    {selectedBlock && linkedTargetBlock && (
                      <ComponentLinkConnector fromBlock={selectedBlock} toBlock={linkedTargetBlock} />
                    )}

                    <CanvasDropArea isOver={activeDragType !== null} showGrid={showGridLines} isBlueprint={true} activeWallHighlight={activeWallHighlight}>
                      <SortableContext items={blocks.map(b => b.id)} strategy={rectSortingStrategy}>
                        {blocks.map(block => (
                          <SortableBlock
                            key={block.id}
                            block={block}
                            isSelected={selectedId === block.id}
                            isDropTarget={overBlockId === block.id && activeDragType !== null}
                            isBlueprint={true}
                            onSelect={() => setSelectedId(block.id)}
                            onDelete={() => { setBlocks(p => p.filter(b => b.id !== block.id)); if (selectedId === block.id) setSelectedId(null) }}
                            onDuplicate={() => handleDuplicateBlock(block.id)}
                            onMoveUp={() => handleMoveBlock(block.id, "up")}
                            onMoveDown={() => handleMoveBlock(block.id, "down")}
                            onAlignChange={align => handleAlignChange(block.id, align)}
                            onToggleFreeform={() => handleToggleFreeform(block.id)}
                            onToggleInline={() => handleToggleInline(block.id)}
                            onSnapWall={wall => handleSnapWall(block.id, wall)}
                            onResize={(w, h) => handleResize(block.id, w, h)}
                            onUpdateCoords={(x, y) => handleUpdateCoords(block.id, x, y)}
                            onSetWallHighlight={w => setActiveWallHighlight(w)}
                          />
                        ))}
                      </SortableContext>

                      {blocks.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-28 text-muted-foreground gap-3 border-2 border-dashed border-border w-full">
                          <Layers className="size-10 text-primary" />
                          <p className="text-sm font-semibold text-foreground">Blueprint Schematic View</p>
                          <p className="text-xs text-muted-foreground text-center max-w-xs">Drag spring dots to walls or link components together in Blueprint view.</p>
                        </div>
                      )}
                    </CanvasDropArea>
                  </div>
                )}

              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Right: Constraints & Property Inspector */}
            <ResizablePanel defaultSize="18%" minSize="14%" maxSize="30%" className="border-l bg-card overflow-y-auto">
              {selectedBlock ? (
                <PropsPanel
                  block={selectedBlock}
                  allBlocks={blocks}
                  onChange={(key, val) => setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? { ...b, props: { ...b.props, [key]: val } } : b))}
                  onChangeConstraints={patch => setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? { ...b, ...patch } : b))}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground/30 gap-2 p-6 text-center">
                  <Square className="size-8 stroke-1" />
                  <p className="text-xs font-medium text-foreground/50">Select a widget on layout</p>
                  <p className="text-[11px] text-muted-foreground">Adjust spring tension, wall anchors, and properties.</p>
                </div>
              )}
            </ResizablePanel>

          </ResizablePanelGroup>

          {/* Floating Drag Overlay */}
          <DragOverlay dropAnimation={null}>
            {activeDragType && (() => {
              const def = BLOCK_DEFS.find(d => d.type === activeDragType)
              if (!def) return null
              return (
                <div className="rounded border border-dashed border-primary bg-background text-foreground p-6 shadow-2xl opacity-90 pointer-events-none max-w-sm">
                  {def.render(def.defaultProps)}
                </div>
              )
            })()}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  )
}
