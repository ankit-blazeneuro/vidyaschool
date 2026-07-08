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
  const { search, setSearch, query } = useDocsSearch({ type: "fetch" })
  const [isFocused, setIsFocused] = React.useState(false)

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
      
      {/* Premium Glassmorphic Dialog Container */}
      <SearchDialogContent className="max-h-[85vh] overflow-hidden flex flex-col *:border-b-0 bg-fd-popover/90 backdrop-blur-xl border border-fd-border/40 shadow-2xl [&_mark]:bg-primary/20 [&_mark]:text-primary [&_mark]:font-semibold [&_mark]:px-0.5 [&_mark]:rounded-sm">
        
        {/* Glow Header container */}
        <SearchDialogHeader 
          className={`flex items-center gap-3 border-b border-fd-border/30 px-4 py-4 shrink-0 h-15 transition-all duration-300 ${
            isFocused ? "bg-primary/5 border-b-primary/30" : ""
          }`}
        >
          <Search 
            className={`size-4 shrink-0 transition-colors duration-300 ${
              isFocused ? "text-primary scale-110" : "text-fd-muted-foreground"
            }`} 
          />
          
          <SearchDialogInput 
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="flex-1 bg-transparent text-sm placeholder:text-fd-muted-foreground/75 focus-visible:outline-none h-full font-medium" 
          />
          
          <div className="flex items-center gap-1.5">
            <span className="hidden md:inline-flex items-center gap-0.5 text-[10px] font-medium text-fd-muted-foreground/60 bg-fd-muted px-1.5 py-0.5 rounded border border-fd-border/20">
              <Sparkles className="size-3 text-amber-500 animate-pulse" />
              <span>Smart Search</span>
            </span>
            <SearchDialogClose className="hover:bg-fd-accent text-fd-muted-foreground hover:text-fd-foreground rounded-lg transition-colors p-1" />
          </div>
        </SearchDialogHeader>

        {/* Scrollable list area */}
        <ScrollArea className="flex-1 max-h-[380px] py-1">
          <SearchDialogList
            items={query.data !== "empty" ? query.data : null}
            Item={renderItem}
            className="p-1 space-y-1"
          />
        </ScrollArea>
      </SearchDialogContent>
    </SearchDialog>
  )
}
