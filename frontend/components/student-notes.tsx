"use client"

import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import { NotebookPen } from "lucide-react"

interface NoteItem {
  notebook: string
  timestamp: string
  title: string
  bullets: string[]
  body: string
}

const defaultNotes: NoteItem[] = [
  {
    notebook: "Mathematics",
    timestamp: "2h ago",
    title: "Quadratic Equations",
    bullets: [
      "Revise discriminant formula: b²−4ac",
      "Practice factorisation methods",
      "Complete exercises 3.4 – 3.7",
    ],
    body: "Focus on cases where the discriminant is negative. Review imaginary roots before the unit test on Friday.",
  },
  {
    notebook: "Science",
    timestamp: "Yesterday",
    title: "Photosynthesis Recap",
    bullets: [
      "Light-dependent reactions in thylakoid",
      "Calvin cycle in the stroma",
      "Chlorophyll absorbs red & blue light",
    ],
    body: "Draw and label the chloroplast diagram. Cross-reference with chapter 6 diagrams in the textbook.",
  },
  {
    notebook: "English",
    timestamp: "3h ago",
    title: "Essay – Chapter 3 Draft",
    bullets: [
      "Comparative analysis of justice vs morality",
      "Quote from Atticus in chapter 10",
      "Conclude with societal reflection",
    ],
    body: "Finish the introduction paragraph. Proofread for passive voice and ensure in-text citations follow MLA format.",
  },
  {
    notebook: "History",
    timestamp: "5h ago",
    title: "WWI Key Timeline",
    bullets: [
      "June 28, 1914 – Franz Ferdinand assassinated",
      "Aug 1914 – Major powers declare war",
      "Nov 11, 1918 – Armistice signed",
    ],
    body: "Map out the trench warfare positions for the Western Front. Review causes of the war for short-answer section.",
  },
  {
    notebook: "Computer Science",
    timestamp: "1d ago",
    title: "Binary Search Trees",
    bullets: [
      "Insertion, deletion, traversal algorithms",
      "In-order traversal gives sorted output",
      "Time complexity: O(log n) average",
    ],
    body: "Implement BST in Python as practice. Visualise rotations for AVL balancing — this may appear in practicals.",
  },
  {
    notebook: "Geography",
    timestamp: "2d ago",
    title: "Tectonic Plates",
    bullets: [
      "Convergent, divergent & transform boundaries",
      "Ring of Fire spans Pacific Ocean",
      "Richter scale measures earthquake magnitude",
    ],
    body: "Annotate the world map with major plate boundaries and label earthquake-prone zones.",
  },
  {
    notebook: "Physics",
    timestamp: "3d ago",
    title: "Newton's Laws of Motion",
    bullets: [
      "1st Law: inertia — object at rest stays at rest",
      "2nd Law: F = ma",
      "3rd Law: equal & opposite reaction",
    ],
    body: "Solve the pulley problems from worksheet 5. Revisit friction force derivations before the lab session.",
  },
  {
    notebook: "Economics",
    timestamp: "4h ago",
    title: "Supply & Demand",
    bullets: [
      "Law of demand: price ↑ → quantity ↓",
      "Equilibrium where supply meets demand",
      "Price elasticity = % change in qty / % change in price",
    ],
    body: "Draw supply-demand curves for the smartphone market case study. Label shifts caused by subsidies.",
  },
]

export function StudentNotes({ notes = defaultNotes }: { notes?: NoteItem[] }) {
  return (
    /* overflow-hidden + pb-0 makes card bottoms flush with the section edge */
    <section className="rounded-2xl bg-zinc-100 dark:bg-[#121212] mx-4 lg:mx-6 overflow-hidden">

      {/* Heading row */}
      <div className="px-6 pt-5 pb-4">
        <h2 className="font-heading text-base leading-snug font-medium mb-4 text-foreground">
          Notes
        </h2>
      </div>

      {/* Horizontal scroll — bleeds off right edge */}
      <div className="flex gap-4 overflow-x-auto px-6 pb-0 -mr-6 scrollbar-none">
        {notes.map((note, i) => (
          <Card
            key={i}
            className="relative min-w-[280px] max-w-[280px] shrink-0 bg-white dark:bg-[#1e1e1e] border-0 ring-0
                       rounded-t-xl rounded-b-none shadow-none flex flex-col last:mr-6"
          >
            <CardHeader className="pb-2 pt-1 px-5">
              {/* Top row: icon + notebook label + timestamp */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <NotebookPen className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs font-semibold text-muted-foreground truncate">
                    Notebook</span>
                </div>
                <span className="text-xs text-muted-foreground/70 shrink-0">{note.timestamp}</span>
              </div>

              {/* Title */}
              <p className="text-base font-semibold text-foreground leading-snug">
                {note.title}
              </p>
            </CardHeader>

            <CardContent className="px-5 pb-3 flex flex-col gap-2">
              {/* Bullet list */}
              <ul className="space-y-1">
                {note.bullets.map((b, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-foreground/80">
                    <span className="mt-[7px] size-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>


              {/* Bottom-to-half gradient overlay */}
              <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-white dark:from-[#1e1e1e] via-white/60 dark:via-[#1e1e1e]/60 to-transparent pointer-events-none rounded-t-none" />
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
