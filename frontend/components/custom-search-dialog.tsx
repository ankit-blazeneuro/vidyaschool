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
    if (item.type === "action") {
      return (
        <button key={item.id} onClick={item.onSelect} className="w-full text-left">
          {item.node}
        </button>
      )
    }

    const isDoc = item.id?.startsWith("docs-") || item.url?.startsWith("/docs/")
    const typeLabel = isDoc ? "Docs" : "Page"

    return (
      <SearchDialogListItem
        key={item.id}
        item={item}
        onClick={onClick}
        className="flex flex-col items-start gap-0.5 py-3 px-3 mx-1 w-[calc(100%-8px)] cursor-pointer
                   border-b border-zinc-100 dark:border-zinc-800/60 last:border-b-0"
      >
        {/* Row 1: type pill + title */}
        <div className="flex items-center gap-2 w-full">
          <span className="shrink-0 text-[9px] font-semibold tracking-widest uppercase
                           px-1.5 py-0.5 rounded
                           bg-zinc-100 dark:bg-zinc-800
                           text-zinc-500 dark:text-zinc-400
                           border border-zinc-200 dark:border-zinc-700">
            {typeLabel}
          </span>
          <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate flex-1 leading-snug">
            {item.title}
          </span>
        </div>

        {/* Row 2: content snippet */}
        {item.content && (
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 line-clamp-1 leading-normal w-full pl-[46px]">
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
          <ScrollArea
            className="flex-1 max-h-[380px] py-1"
            // Force the Radix scrollbar to always show
            type="always"
          >
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
