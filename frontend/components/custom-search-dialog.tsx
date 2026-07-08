'use client'

import * as React from "react"
import { useDocsSearch } from "fumadocs-core/search/client"
import {
  SearchDialog,
  SearchDialogContent,
  SearchDialogList,
  SearchDialogListItem,
  SearchDialogHeader,
  SearchDialogInput,
  SearchDialogClose,
  type SharedProps,
} from "fumadocs-ui/components/dialog/search"

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
        className="relative flex flex-col items-start gap-1 py-3 px-4 rounded-lg hover:bg-fd-accent hover:text-fd-accent-foreground text-left w-full transition-colors group cursor-pointer border-b border-fd-border/30 last:border-b-0"
      >
        <div className="flex items-center justify-between w-full">
          <span className="text-[10px] font-bold tracking-wider text-fd-muted-foreground bg-fd-muted/30 px-1.5 py-0.5 rounded uppercase">
            {typeLabel}
          </span>
        </div>
        <div className="font-semibold text-sm text-fd-foreground group-hover:text-fd-accent-foreground mt-1">
          {item.title}
        </div>
        {item.content && (
          <p className="text-xs text-fd-muted-foreground line-clamp-2 mt-0.5 leading-normal">
            {item.content}
          </p>
        )}
      </SearchDialogListItem>
    )
  }

  return (
    <SearchDialog search={search} onSearchChange={setSearch} {...props}>
      <SearchDialogContent className="max-h-[85vh] overflow-hidden flex flex-col *:border-b-0">
        <SearchDialogHeader className="flex items-center gap-2 border-b border-fd-border/30 px-4 py-3 shrink-0">
          <SearchDialogInput className="flex-1 bg-transparent text-sm placeholder:text-fd-muted-foreground focus-visible:outline-none" />
          <SearchDialogClose />
        </SearchDialogHeader>
        <SearchDialogList
          items={query.data !== "empty" ? query.data : null}
          Item={renderItem}
          className="p-2 space-y-1 overflow-y-auto"
        />
      </SearchDialogContent>
    </SearchDialog>
  )
}
