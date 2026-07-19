"use client"

import Link from "next/link"
import dynamic from "next/dynamic"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const LiquidMetalHero = dynamic(() => import("@/components/liquid-metal-hero"), {
  loading: () => (
    <div className="absolute inset-0 animate-pulse bg-muted/20" aria-hidden />
  ),
})

const sections = [
  { id: "hero", name: "Welcome to VidyaSchool", num: "01" },
  { id: "about", name: "A Little About Us", num: "02" },
  { id: "students", name: "Our Students", num: "03" },
  { id: "partners", name: "Empowering Partners", num: "04" },
]

export function HeroSection() {
  const [activeSection, setActiveSection] = useState("hero")

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "-20% 0px -60% 0px", // triggers when section is in the middle of the viewport
      threshold: 0.1,
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id)
        }
      })
    }, observerOptions)

    sections.forEach((sec) => {
      const el = document.getElementById(sec.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <section
      id="hero"
      aria-label="Welcome to VidyaSchool"
      className="relative flex h-[95dvh] min-h-[95dvh] w-full items-center overflow-x-clip py-6 sm:py-0"
    >
      {/* Decorative Background SVG — Left */}
      <div className="absolute -left-20 top-[-10%] w-[500px] h-[500px] sm:w-[650px] sm:h-[650px] lg:w-[850px] lg:h-[850px] pointer-events-none select-none z-0 animate-[spin_240s_linear_infinite]">
        <img
          src="/globe-backdrop.svg"
          alt=""
          className="w-full h-full object-contain"
        />
      </div>

      {/* Decorative Background SVG — Right (slightly smaller, reverse spin) */}
      <div
        className="absolute -right-24 bottom-[-8%] w-[380px] h-[380px] sm:w-[480px] sm:h-[480px] lg:w-[620px] lg:h-[620px] pointer-events-none select-none z-0 animate-[spin_300s_linear_infinite]"
        style={{ animationDirection: "reverse" }}
      >
        <img
          src="/globe-backdrop.svg"
          alt=""
          className="w-full h-full object-contain"
        />
      </div>

      {/* Glassmorphism Card */}
      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl sm:rounded-3xl bg-white/40 dark:bg-background/60 backdrop-blur-[2px] overflow-hidden lg:h-[85dvh]">
          <div
            className="grid w-full h-full grid-cols-1 items-center gap-8 p-8 sm:gap-10 sm:p-12 lg:grid-cols-12 lg:gap-12 lg:p-16"
          >
            <div className="order-2 flex flex-col justify-center lg:order-1 lg:col-span-6">
              <div className="space-y-3 text-center sm:space-y-5 lg:space-y-6 lg:text-left">
                <div className="inline-flex max-w-full items-center gap-1.5 self-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground sm:text-xs lg:self-start">
                  <Sparkles className="h-4 w-4 shrink-0" />
                  <span className="truncate">Welcome to VidyaSchool</span>
                </div>

                <h1 className="text-[clamp(1.75rem,5vw+0.75rem,4.5rem)] tracking-tight text-foreground leading-[1.08] text-balance">
                  Empowering Minds, Shaping Futures
                </h1>

                <p className="mx-auto max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base md:text-lg lg:mx-0">
                  Welcome to VidyaSchool, where academic excellence meets holistic development. Discover our wings, modern labs, arts programs, and vibrant student community.
                </p>

                <div className="flex w-full flex-col items-stretch gap-3 pt-1 sm:flex-row sm:items-center sm:justify-center lg:justify-start">
                  <Button asChild variant="default" size="md" className="w-full sm:w-auto">
                    <Link href="/student">
                      <span>Student Portal</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="md" className="w-full sm:w-auto">
                    <Link href="/teacher">Teacher Portal</Link>
                  </Button>
                </div>
              </div>
            </div>

            <div className="order-1 relative aspect-[4/3] max-h-[42dvh] w-full sm:max-h-[50dvh] sm:aspect-[16/10] lg:order-2 lg:col-span-6 lg:aspect-auto lg:h-full">
              <LiquidMetalHero />
            </div>
          </div>
        </div>
      </div>

      {/* Right Side Horizontal Section Indicator */}
      <div className="fixed right-4 md:right-8 lg:right-12 top-1/2 -translate-y-1/2 z-40 hidden sm:flex flex-col items-end gap-4">
        {sections.map((sec) => {
          const isActive = activeSection === sec.id
          return (
            <Tooltip key={sec.id}>
              <TooltipTrigger asChild>
                <a
                  href={`#${sec.id}`}
                  className="group py-2 outline-none flex items-center justify-end"
                >
                  <div
                    className={cn(
                      "h-[3px] w-6 rounded-full transition-colors duration-300",
                      isActive
                        ? "bg-foreground"
                        : "bg-muted-foreground/35 group-hover:bg-foreground"
                    )}
                  />
                </a>
              </TooltipTrigger>
              <TooltipContent side="left" className="font-medium shadow-md">
                <p className="text-xs">{sec.name}</p>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </section>
  )
}
