"use client"

import { useState, useEffect, useRef } from "react"
import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Play, Pause } from "lucide-react"

const LiquidMetal = dynamic(
  () => import("@paper-design/shaders-react").then((mod) => mod.LiquidMetal),
  { ssr: false, loading: () => <Skeleton className="absolute inset-0" /> }
)

export default function LiquidMetalHero() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isInView, setIsInView] = useState(true)
  const [isTabVisible, setIsTabVisible] = useState(true)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("antigravity_logo_playing")
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    setReducedMotion(prefersReducedMotion)
    if (prefersReducedMotion) {
      setIsPlaying(false)
    } else if (saved !== null) {
      setIsPlaying(saved === "true")
    }

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const onMotionChange = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches)
      if (event.matches) setIsPlaying(false)
    }
    motionQuery.addEventListener("change", onMotionChange)

    const onVisibilityChange = () => setIsTabVisible(!document.hidden)
    document.addEventListener("visibilitychange", onVisibilityChange)

    const el = containerRef.current
    const observer = el
      ? new IntersectionObserver(
          ([entry]) => setIsInView(entry.isIntersecting),
          { threshold: 0.15 }
        )
      : null
    if (el && observer) observer.observe(el)

    const frame = requestAnimationFrame(() => setIsReady(true))

    return () => {
      motionQuery.removeEventListener("change", onMotionChange)
      document.removeEventListener("visibilitychange", onVisibilityChange)
      observer?.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [])

  const togglePlay = () => {
    setIsPlaying((prev) => {
      const next = !prev
      localStorage.setItem("antigravity_logo_playing", String(next))
      return next
    })
  }

  const shouldAnimate = isReady && isPlaying && isInView && isTabVisible && !reducedMotion

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden"
    >
      {isReady && (
        <div className="absolute inset-0">
          <LiquidMetal
            width="100%"
            height="100%"
            image="/assets/vidyaschool/Logo/restored_no_bg_with_title.png"
            colorBack="#00000000"
            colorTint="#e11d48"
            repetition={1.2}
            softness={0.12}
            shiftRed={0.6}
            shiftBlue={0.0}
            distortion={0.05}
            contour={0.55}
            angle={60}
            speed={shouldAnimate ? 0.35 : 0}
            scale={0.7}
            fit="contain"
          />
        </div>
      )}

      {!reducedMotion && (
        <div className="absolute bottom-3 right-3 z-10 sm:bottom-4 sm:right-4">
          <Button
            variant="outline"
            size="default"
            onClick={togglePlay}
            className="h-8 w-8 rounded-full border-border bg-background/50 p-0 backdrop-blur-xs hover:bg-background"
            aria-label={isPlaying ? "Pause animation" : "Play animation"}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4 fill-muted-foreground/30" />
            ) : (
              <Play className="ml-0.5 h-4 w-4 fill-muted-foreground/30" />
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
