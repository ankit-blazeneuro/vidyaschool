"use client"

import Link from "next/link"
import dynamic from "next/dynamic"
import Image from "next/image"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const LiquidMetalHero = dynamic(() => import("@/components/liquid-metal-hero"), {
  loading: () => (
    <div className="absolute inset-0 translate-y-4 sm:translate-y-6" aria-hidden>
      <Image
        src="/assets/vidyaschool/Logo/restored_no_bg_with_title.png"
        alt=""
        fill
        className="object-contain scale-[0.40] grayscale opacity-50"
        priority
        sizes="(max-width: 768px) 90vw, (max-width: 1024px) 50vw, 40vw"
      />
      {/* Shimmer masked to logo shape via PNG alpha channel */}
      <div
        className="absolute inset-0 scale-[0.40] overflow-hidden"
        style={{
          maskImage: "url('/assets/vidyaschool/Logo/restored_no_bg_with_title.png')",
          WebkitMaskImage: "url('/assets/vidyaschool/Logo/restored_no_bg_with_title.png')",
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
      {/* Hero Content */}
      <div className="relative z-10 mx-auto max-w-[1380px] w-full px-4 sm:px-6 lg:px-8">
        <div
          className="grid w-full h-full grid-cols-1 items-center gap-8 py-8 sm:gap-10 sm:py-12 lg:grid-cols-12 lg:gap-12 lg:py-16"
        >
            <div className="order-2 flex flex-col justify-center lg:order-1 lg:col-span-6">
              <div className="space-y-3 text-center sm:space-y-5 lg:space-y-6 lg:text-left">
                <h1 className="text-[clamp(1.75rem,5vw+0.75rem,4.5rem)] tracking-tight text-foreground leading-[1.08] text-balance">
                  Empowering Minds, Shaping Futures
                </h1>

                <p className="mx-auto max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base md:text-lg lg:mx-0">
                  Welcome to VidyaSchool, where academic excellence meets holistic development. Discover our wings, modern labs, arts programs, and vibrant student community.
                </p>

                <div className="flex w-full flex-col items-stretch gap-3 pt-1 sm:flex-row sm:items-center sm:justify-center lg:justify-start">
                  <Button asChild variant="default" size="md" className="w-full sm:w-auto px-6 py-2.5">
                    <Link href="/signup">
                      <span>Continue</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            <div className="order-1 relative aspect-[4/3] w-full min-h-[300px] sm:min-h-[420px] lg:order-2 lg:col-span-6 lg:aspect-auto lg:h-[75dvh]">
              <LiquidMetalHero />
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
