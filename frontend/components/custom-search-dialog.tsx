'use client'

import * as React from "react"
import { useDocsSearch } from "fumadocs-core/search/client"
import {
  SearchDialog,
  SearchDialogOverlay,
  SearchDialogContent,
  SearchDialogList,
  SearchDialogListItem,
  SearchDialogHeader,
  SearchDialogInput,
  SearchDialogClose,
  type SharedProps,
} from "fumadocs-ui/components/dialog/search"
import { Search, Sparkles } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

export function CustomSearchDialog(props: SharedProps) {
  const [search, setSearch] = React.useState("")
  const [results, setResults] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [isFocused, setIsFocused] = React.useState(false)
  const [loaderPhase, setLoaderPhase] = React.useState(0)

  React.useEffect(() => {
    if (!isLoading) {
      setLoaderPhase(0)
      return
    }

    const interval = setInterval(() => {
      setLoaderPhase((prev) => (prev + 1) % 2)
    }, 1300)

    return () => clearInterval(interval)
  }, [isLoading])

  React.useEffect(() => {
    if (!search.trim()) {
      setResults([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(search)}`)
        if (res.ok) {
          const data = await res.json()
          setResults(data)
        }
      } catch (err) {
        console.error("Search fetch failed:", err)
      } finally {
        setIsLoading(false)
      }
    }, 150) // debounce search fetches

    return () => clearTimeout(timer)
  }, [search])

  // Render a custom item
  const renderItem = ({ item, onClick }: { item: any; onClick: () => void }) => {
    // If it's an action item, just render standard
    if (item.type === "action") {
      return (
        <button key={item.id} onClick={item.onSelect} className="w-full text-left">
          {item.node}
        </button>
      )
    }

    // Determine type: check if item.id starts with 'page-' or 'docs-'
    const isDoc = item.id?.startsWith("docs-") || item.url?.startsWith("/docs/")
    
    // Aesthetic badge styles
    const badgeClass = isDoc
      ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 dark:bg-indigo-500/20 border border-indigo-500/20"
      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-500/20 border border-emerald-500/20"
    const typeLabel = isDoc ? "DOCS" : "PAGE"

    return (
      <SearchDialogListItem
        key={item.id}
        item={item}
        onClick={onClick}
        className="relative flex flex-col items-start gap-1 py-2.5 px-3.5 mx-1 rounded-xl hover:bg-fd-accent/40 text-left w-[calc(100%-8px)] transition-all duration-300 group cursor-pointer border-b border-fd-border/10 last:border-b-0 hover:translate-x-1 hover:shadow-xs hover:border-l-2 hover:border-l-primary hover:pl-3"
      >
        <div className="flex items-center gap-2 w-full">
          <span className={`text-[8px] font-extrabold tracking-wider px-1.5 py-0.5 rounded-md uppercase shrink-0 ${badgeClass}`}>
            {typeLabel}
          </span>
          <div className="font-semibold text-xs text-fd-foreground group-hover:text-primary transition-colors truncate flex-1">
            {item.title}
          </div>
        </div>
        {item.content && (
          <p className="text-[11px] text-fd-muted-foreground line-clamp-1 leading-normal w-full pl-[56px] group-hover:text-fd-foreground/80 transition-colors">
            {item.content}
          </p>
        )}
      </SearchDialogListItem>
    )
  }

  return (
    <SearchDialog search={search} onSearchChange={setSearch} {...props}>
      {/* Premium Blurred Backdrop Overlay with subtle dark tint */}
      <SearchDialogOverlay className="backdrop-blur-md bg-black/50" />
      
      {/* Premium Glassmorphic Dialog Container styled like the sidebar search and command popovers */}
      <SearchDialogContent className="max-h-[85vh] overflow-hidden flex flex-col p-0 border border-border/80 rounded-xl shadow-2xl bg-sidebar-foreground/5 hover:bg-sidebar-foreground/10 text-muted-foreground transition-all duration-150 text-xs focus:outline-none backdrop-blur-md">
        <style>{`
          @keyframes text-shimmer {
            0% {
              background-position: 200% 0;
            }
            100% {
              background-position: -200% 0;
            }
          }
          .animate-text-shimmer {
            background: linear-gradient(90deg, var(--muted-foreground) 20%, var(--foreground) 50%, var(--muted-foreground) 80%);
            background-size: 200% auto;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: text-shimmer 2s linear infinite;
          }
        `}</style>

        {/* Clean Header container displaying only the search input */}
        <SearchDialogHeader 
          className={`flex items-center justify-between px-3 py-1.5 h-11 shrink-0 ${
            search.trim() !== "" ? "border-b border-border/80" : ""
          }`}
        >
          <div className="flex items-center gap-2.5 flex-1 h-full">
            <Search className="size-4.5 shrink-0 text-muted-foreground/80" />
            <SearchDialogInput 
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="flex-1 bg-transparent text-xs text-muted-foreground font-normal placeholder:text-muted-foreground/50 focus-visible:outline-none h-full py-0 border-none outline-none" 
              placeholder="Quick Search"
            />
          </div>
          {search.trim() === "" && (
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded-md border border-border bg-transparent dark:bg-transparent px-1.5 font-mono text-[9px] font-medium text-muted-foreground/60 shadow-none">
              <span>⌘</span><span>F</span>
            </kbd>
          )}
        </SearchDialogHeader>

        {/* Scrollable list area - only render when text is entered */}
        {search.trim() !== "" && (
          <ScrollArea className="flex-1 max-h-[380px] py-1">
            {isLoading && (
              <div className="flex items-center px-4 py-2.5 border-b border-border/10">
                <span className="text-xs font-semibold animate-text-shimmer">
                  {loaderPhase === 0 ? "Searching in documentations..." : "Searching in pages..."}
                </span>
              </div>
            )}
            <SearchDialogList
              items={search.trim() === "" ? null : results}
              Item={renderItem}
              className="p-1 space-y-1"
            />
          </ScrollArea>
        )}
      </SearchDialogContent>
    </SearchDialog>
  )
}
