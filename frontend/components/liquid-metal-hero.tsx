"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Play, Pause } from "lucide-react"

const LiquidMetal = dynamic(
  () => import("@paper-design/shaders-react").then((mod) => mod.LiquidMetal),
  { ssr: false, loading: () => <Skeleton className="w-full h-full aspect-[4/3] rounded-xl" /> }
)

export default function LiquidMetalHero() {
  const [isPlaying, setIsPlaying] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem("antigravity_logo_playing")
    if (saved !== null) setIsPlaying(saved === "true")
  }, [])

  const togglePlay = () => {
    setIsPlaying((prev) => {
      const next = !prev
      localStorage.setItem("antigravity_logo_playing", String(next))
      return next
    })
  }

  return (
    <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden flex items-center justify-center bg-transparent">
      <LiquidMetal
        width="100%"
        height="100%"
        image="/assets/vidyaschool/simple-removebg-preview.png"
        colorBack="#00000000"
        colorTint="#e11d48"
        repetition={1.2}
        softness={0.12}
        shiftRed={0.6}
        shiftBlue={0.0}
        distortion={0.05}
        contour={0.55}
        angle={60}
        speed={isPlaying ? 0.35 : 0}
        scale={0.7}
        fit="contain"
      />
      <div className="absolute bottom-4 right-4 z-10">
        <Button
          variant="outline"
          size="default"
          onClick={togglePlay}
          className="h-8 w-8 rounded-full border-border bg-background/50 hover:bg-background backdrop-blur-xs text-muted-foreground hover:text-foreground flex items-center justify-center p-0"
          aria-label={isPlaying ? "Pause animation" : "Play animation"}
        >
          {isPlaying ? <Pause className="h-4 w-4 fill-muted-foreground/30" /> : <Play className="h-4 w-4 ml-0.5 fill-muted-foreground/30" />}
        </Button>
      </div>
    </div>
  )
}
