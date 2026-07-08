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
import { Search } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

export function CustomSearchDialog(props: SharedProps) {
  const { search, setSearch, query } = useDocsSearch({ type: "fetch" })

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
    const typeLabel = isDoc ? "DOCS" : "PAGE"

    return (
      <SearchDialogListItem
        key={item.id}
        item={item}
        onClick={onClick}
        className="relative flex flex-col items-start gap-0.5 py-1.5 px-3 rounded-lg hover:bg-fd-accent hover:text-fd-accent-foreground text-left w-full transition-colors group cursor-pointer border-b border-fd-border/30 last:border-b-0"
      >
        <div className="flex items-center gap-2 w-full">
          <span className="text-[8px] font-extrabold tracking-wider text-fd-muted-foreground bg-fd-muted/30 px-1 py-0.2 rounded uppercase shrink-0">
            {typeLabel}
          </span>
          <div className="font-semibold text-xs text-fd-foreground group-hover:text-fd-accent-foreground truncate flex-1">
            {item.title}
          </div>
        </div>
        {item.content && (
          <p className="text-[11px] text-fd-muted-foreground line-clamp-1 leading-normal w-full pl-[46px]">
            {item.content}
          </p>
        )}
      </SearchDialogListItem>
    )
  }

  return (
    <SearchDialog search={search} onSearchChange={setSearch} {...props}>
      <SearchDialogOverlay className="backdrop-blur-md bg-black/40" />
      <SearchDialogContent className="max-h-[85vh] overflow-hidden flex flex-col *:border-b-0">
        <SearchDialogHeader className="flex items-center gap-3 border-b border-fd-border/30 px-4 py-4 shrink-0 h-14">
          <Search className="size-4 shrink-0 text-fd-muted-foreground ml-1" />
          <SearchDialogInput className="flex-1 bg-transparent text-sm placeholder:text-fd-muted-foreground focus-visible:outline-none h-full" />
          <SearchDialogClose />
        </SearchDialogHeader>
        <ScrollArea className="flex-1 max-h-[380px]">
          <SearchDialogList
            items={query.data !== "empty" ? query.data : null}
            Item={renderItem}
            className="p-2 space-y-0.5"
          />
        </ScrollArea>
      </SearchDialogContent>
    </SearchDialog>
  )
}
