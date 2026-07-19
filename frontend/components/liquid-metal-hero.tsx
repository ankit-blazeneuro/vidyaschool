"use client"

import { useState, useEffect, useRef } from "react"
import dynamic from "next/dynamic"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Play, Pause } from "lucide-react"

const LOGO_SRC = "/assets/vidyaschool/Logo/restored_no_bg_with_title.png"

const LiquidMetal = dynamic(
  () => import("@paper-design/shaders-react").then((mod) => mod.LiquidMetal),
  { ssr: false }
)

export default function LiquidMetalHero() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isInView, setIsInView] = useState(true)
  const [isTabVisible, setIsTabVisible] = useState(true)
  const [reducedMotion, setReducedMotion] = useState(false)

  // isReady  → mounts the shader
  // showPlaceholder → hides placeholder; cleared ~150ms AFTER isReady so WebGL
  //                   has time to paint its first frame before we remove the shimmer
  const [isReady, setIsReady] = useState(false)
  const [showPlaceholder, setShowPlaceholder] = useState(true)

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

    // Mount shader on first frame, then hide placeholder only after WebGL
    // has had enough time to paint (avoids the blank flash between the two)
    const frame = requestAnimationFrame(() => {
      setIsReady(true)
      const timer = setTimeout(() => setShowPlaceholder(false), 150)
      return () => clearTimeout(timer)
    })

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
    <div ref={containerRef} className="relative h-full w-full overflow-hidden">

      {/* Shimmer placeholder — stays mounted until shader paints its first frame */}
      {showPlaceholder && (
        <div className="absolute inset-0" aria-hidden>
          {/* Grayscale logo at same scale as the shader */}
          <Image
            src={LOGO_SRC}
            alt=""
            fill
            className="object-contain scale-[0.7] grayscale opacity-50"
            priority
            sizes="(max-width: 768px) 90vw, (max-width: 1024px) 50vw, 40vw"
          />
          {/*
            Outer div: scale + mask (logo alpha channel as stencil).
            Inner div: only the translateX animation.
            Kept separate so transforms never conflict.
          */}
          <div
            className="absolute inset-0 scale-[0.7] overflow-hidden"
            style={{
              maskImage: `url('${LOGO_SRC}')`,
              WebkitMaskImage: `url('${LOGO_SRC}')`,
              maskSize: "contain",
              WebkitMaskSize: "contain",
              maskRepeat: "no-repeat",
              WebkitMaskRepeat: "no-repeat",
              maskPosition: "center",
              WebkitMaskPosition: "center",
            }}
          >
            <div
              className="logo-shimmer-sweep absolute inset-0"
              style={{
                background:
                  "linear-gradient(105deg, transparent 25%, rgba(255,255,255,0.75) 50%, transparent 75%)",
              }}
            />
          </div>
        </div>
      )}

      {/* Animated shader — mounted at isReady, overlaps placeholder for ~150ms */}
      {isReady && (
        <div className="absolute inset-0">
          <LiquidMetal
            width="100%"
            height="100%"
            image={LOGO_SRC}
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
