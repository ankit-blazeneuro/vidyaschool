"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Terminal, Globe, Code, ArrowRight, Play, Pause, Laptop, Monitor, Music, Bot, Activity, Sparkles, X } from "lucide-react"
import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"
import { motion, AnimatePresence } from "framer-motion"

const LiquidMetal = dynamic(
  () => import("@paper-design/shaders-react").then((mod) => mod.LiquidMetal),
  {
    ssr: false,
    loading: () => <Skeleton className="w-full h-full aspect-[4/3] rounded-xl" />,
  }
)

interface SlideItem {
  title: string
  description: string
  icon: React.ReactNode
  badge: string
  image?: string
  customContent?: React.ReactNode
  buttonText: string
  buttonHref: string
}

const slides: SlideItem[] = [
  {
    title: "Empowering Minds, Shaping Futures",
    description: "Welcome to VidyaSchool, where academic excellence meets holistic development. Discover our wings, modern labs, arts programs, and vibrant student community.",
    icon: <Sparkles className="h-4 w-4" />,
    badge: "Welcome to VidyaSchool",
    buttonText: "Student Portal",
    buttonHref: "/student"
  }
]

interface PartnerItem {
  name: string
  logo: React.ReactNode
}

const partners: PartnerItem[] = [
  {
    name: "WIAUK",
    logo: (
      <div className="flex items-center gap-3 font-semibold text-foreground/75 text-sm sm:text-base">
        <div className="relative w-8 h-8 flex items-center justify-center bg-white p-1 rounded shadow-xs">
          <Image src="/assets/logos/wiaauk.jpg" width={32} height={32} alt="WIAUK Logo" className="object-contain" />
        </div>
        <span>WIAUK</span>
      </div>
    )
  },
  {
    name: "Mastercard",
    logo: (
      <div className="flex items-center gap-3 font-semibold text-foreground/75 text-sm sm:text-base">
        <div className="relative w-8 h-8 flex items-center justify-center">
          <Image src="/assets/logos/mastercard.svg" width={32} height={32} alt="Mastercard Logo" className="object-contain" />
        </div>
        <span>Mastercard</span>
      </div>
    )
  },
  {
    name: "IIT Delhi",
    logo: (
      <div className="flex items-center gap-3 font-semibold text-foreground/75 text-sm sm:text-base">
        <div className="relative w-8 h-8 flex items-center justify-center bg-white p-1 rounded-full shadow-xs">
          <Image src="/assets/logos/iitd.png" width={32} height={32} alt="IIT Delhi Logo" className="object-contain" />
        </div>
        <span>IIT Delhi</span>
      </div>
    )
  },
  {
    name: "Indians for Collective Action",
    logo: (
      <div className="flex items-center gap-3 font-semibold text-foreground/75 text-sm sm:text-base">
        <div className="relative w-8 h-8 flex items-center justify-center bg-white p-1 rounded shadow-xs">
          <Image src="/assets/logos/india-for-collective-india.png" width={32} height={32} alt="ICA Logo" className="object-contain" />
        </div>
        <span>ICA India</span>
      </div>
    )
  },
  {
    name: "RBS",
    logo: (
      <div className="flex items-center gap-3 font-semibold text-foreground/75 text-sm sm:text-base">
        <div className="relative w-8 h-8 flex items-center justify-center bg-white p-1 rounded shadow-xs">
          <Image src="/assets/logos/rbs.png" width={32} height={32} alt="RBS Logo" className="object-contain" />
        </div>
        <span>RBS Bank</span>
      </div>
    )
  },
  {
    name: "Bird Group",
    logo: (
      <div className="flex items-center gap-3 font-semibold text-foreground/75 text-sm sm:text-base">
        <div className="relative w-20 h-8 flex items-center justify-center bg-white px-2.5 py-1 rounded shadow-xs">
          <Image src="/assets/logos/bird.png" width={80} height={16} alt="Bird Group Logo" className="object-contain" />
        </div>
      </div>
    )
  },
  {
    name: "Fidelity International",
    logo: (
      <div className="flex items-center gap-3 font-bold text-foreground/75 text-sm sm:text-base">
        <div className="relative w-8 h-8 flex items-center justify-center bg-white p-1 rounded shadow-xs">
          <Image src="/assets/logos/fidelity.svg" width={32} height={32} alt="Fidelity Logo" className="object-contain" />
        </div>
        <span>Fidelity</span>
      </div>
    )
  },
  {
    name: "Verint",
    logo: (
      <div className="flex items-center gap-3 font-semibold text-foreground/75 text-sm sm:text-base">
        <div className="relative w-8 h-8 flex items-center justify-center bg-white p-1 rounded shadow-xs">
          <Image src="/assets/logos/verint.jpg" width={32} height={32} alt="Verint Logo" className="object-contain" />
        </div>
        <span>Verint</span>
      </div>
    )
  },
  {
    name: "KPMG",
    logo: (
      <div className="flex items-center gap-3 font-semibold text-foreground/75 text-sm sm:text-base">
        <div className="relative w-18 h-8 flex items-center justify-center bg-white px-2.5 py-1 rounded shadow-xs">
          <Image src="/assets/logos/kpmg.png" width={72} height={32} alt="KPMG Logo" className="object-contain" />
        </div>
      </div>
    )
  },
  {
    name: "ReNew Power",
    logo: (
      <div className="flex items-center gap-3 font-semibold text-foreground/75 text-sm sm:text-base">
        <div className="relative w-20 h-8 flex items-center justify-center bg-white px-2 py-1 rounded shadow-xs">
          <Image src="/assets/logos/renew.svg" width={80} height={32} alt="ReNew Power Logo" className="object-contain" />
        </div>
      </div>
    )
  },
  {
    name: "IndiGo",
    logo: (
      <div className="flex items-center gap-3 font-bold text-foreground/75 text-sm sm:text-base">
        <div className="relative w-10 h-8 flex items-center justify-center bg-white p-1 rounded shadow-xs">
          <Image src="/assets/logos/indigo.svg" width={40} height={32} alt="IndiGo Logo" className="object-contain" />
        </div>
        <span>IndiGo</span>
      </div>
    )
  },
  {
    name: "ICRA",
    logo: (
      <div className="flex items-center gap-3 font-bold text-foreground/75 text-sm sm:text-base">
        <div className="relative w-20 h-8 flex items-center justify-center bg-white px-2 py-1 rounded shadow-xs">
          <Image src="/assets/logos/icra.png" width={80} height={32} alt="ICRA Logo" className="object-contain" />
        </div>
      </div>
    )
  }
]

const overlayVariants = {
  initial: { opacity: 0 },
  hover: { opacity: 1 }
}

const contentVariants = {
  initial: { y: 15, opacity: 0 },
  hover: { y: 0, opacity: 1 }
}

export default function Home() {
  const current = 0
  const [isPlaying, setIsPlaying] = React.useState(true)
  const [activeImage, setActiveImage] = React.useState<{ src: string; alt: string } | null>(null)

  // Load animation play/pause state from localStorage on client-side mount
  React.useEffect(() => {
    const saved = localStorage.getItem("antigravity_logo_playing")
    if (saved !== null) {
      setIsPlaying(saved === "true")
    }
  }, [])

  // Toggle state and save preference to localStorage
  const togglePlay = () => {
    setIsPlaying((prev) => {
      const next = !prev
      localStorage.setItem("antigravity_logo_playing", String(next))
      return next
    })
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      
      {/* Main Full Hero Content */}
      <main className="flex-1 flex flex-col justify-center py-6 md:py-8">
        <div className="w-full px-6 sm:px-12 md:px-16 lg:px-24 max-w-none">
          
          {/* Hero Wrapper Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="relative rounded-xl border border-border bg-transparent py-8 px-6 sm:py-10 sm:px-10 md:py-12 md:px-12 lg:py-14 lg:px-14 shadow-none"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              
              {/* Left Column: Text Content */}
              <div className="lg:col-span-6 flex flex-col justify-center min-h-[350px] lg:pl-6 order-2 lg:order-1">
                
                {/* Slide Text Content */}
                <div className="space-y-6">
                  
                  {/* Badge */}
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                    {slides[current].icon}
                    <span>{slides[current].badge}</span>
                  </div>
                  
                  {/* Title */}
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
                    {slides[current].title}
                  </h1>
                  
                  {/* Description */}
                  <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl">
                    {slides[current].description}
                  </p>
  
                  {/* Call-to-Actions */}
                  <div className="flex items-center gap-3 pt-2">
                    <Button asChild variant="default" size="md">
                      <Link id="hero-student-portal-btn" href={slides[current].buttonHref}>
                        {slides[current].buttonText} <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="md">
                      <Link id="hero-teacher-portal-btn" href="/teacher">
                        Teacher Portal
                      </Link>
                    </Button>
                  </div>
  
                </div>
  
              </div>
  
              {/* Right Column: Slide Mockup Shader */}
              <div className="lg:col-span-6 flex items-center justify-center lg:pr-6 order-1 lg:order-2">
                <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden flex items-center justify-center bg-transparent">
                  <LiquidMetal
                    width="100%"
                    height="100%"
                    image="/assets/vidyaschool/simple-removebg-preview.png"
                    colorBack="#00000000"
                    colorTint="#e11d48"
                    shape={undefined}
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
                </div>
              </div>
  
            </div>
            
            {/* Play/Pause Button in Bottom Right Corner */}
            <div className="absolute bottom-4 right-4 z-10">
              <Button
                id="hero-play-pause-btn"
                variant="outline"
                size="default"
                onClick={togglePlay}
                className="h-8 w-8 rounded-full border-border bg-background/50 hover:bg-background backdrop-blur-xs text-muted-foreground hover:text-foreground flex items-center justify-center p-0 transition-all duration-200"
                title={isPlaying ? "Pause animation" : "Play animation"}
                aria-label={isPlaying ? "Pause animation" : "Play animation"}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4 fill-muted-foreground/30" />
                ) : (
                  <Play className="h-4 w-4 ml-0.5 fill-muted-foreground/30 animate-pulse" />
                )}
              </Button>
            </div>
          </motion.div>

          {/* Bento Grid Section */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
            className="w-full mt-20 md:mt-28 py-6 bg-transparent"
          >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-8">
              <h2 className="text-center text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                Our Students
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card 1: Classical & Fusion Dance */}
              <motion.div 
                id="bento-card-dance"
                initial="initial"
                whileHover="hover"
                onClick={() => setActiveImage({
                  src: "/assets/vidyaschool/student_classical_dance.jpg",
                  alt: "Classical & Fusion Dance - Students learning classical, folk, and contemporary Indian dance forms."
                })}
                className="group relative rounded-2xl border border-border/80 dark:border-border bg-card/45 dark:bg-card/10 overflow-hidden h-[360px] p-3.5 shadow-sm hover:shadow-xl hover:border-foreground/20 dark:hover:border-foreground/35 cursor-zoom-in transition-all duration-300 md:col-span-2"
              >
                {/* Technical Corner Accents */}
                <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-foreground/20 group-hover:border-foreground/45 transition-colors duration-300 z-10" />
                <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-foreground/20 group-hover:border-foreground/45 transition-colors duration-300 z-10" />
                <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-foreground/20 group-hover:border-foreground/45 transition-colors duration-300 z-10" />
                <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-foreground/20 group-hover:border-foreground/45 transition-colors duration-300 z-10" />

                {/* Nice Inner Image Frame */}
                <div className="relative w-full h-full rounded-lg overflow-hidden border border-border/60 dark:border-border/30 bg-muted/20">
                  <Image 
                    src="/assets/vidyaschool/student_classical_dance.jpg"
                    alt="Student classical and fusion dance practice"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
                    className="object-cover w-full h-full transition-transform duration-700 ease-out group-hover:scale-105"
                    loading="lazy"
                  />
                  {/* Hover Text Overlay inside image frame */}
                  <motion.div 
                    variants={overlayVariants}
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                    className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col justify-end p-6 z-10"
                  >
                    <motion.div
                      variants={contentVariants}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                      className="space-y-2 text-left"
                    >
                      <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/70">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Performing Arts</span>
                      </div>
                      <h3 className="text-lg font-bold text-white tracking-tight">Classical & Fusion Dance</h3>
                      <p className="text-xs text-white/80 max-w-md leading-relaxed">
                        Students learn classical, folk, and contemporary Indian dance forms, building coordination, rhythm, and rich cultural appreciation.
                      </p>
                    </motion.div>
                  </motion.div>
                </div>
              </motion.div>

              {/* Card 2: Choral & Classical Singing */}
              <motion.div 
                id="bento-card-singing"
                initial="initial"
                whileHover="hover"
                onClick={() => setActiveImage({
                  src: "/assets/vidyaschool/student_singing.jpg",
                  alt: "Choral & Classical Singing - Developing vocal control, pitch alignment, and choral harmony."
                })}
                className="group relative rounded-2xl border border-border/80 dark:border-border bg-card/45 dark:bg-card/10 overflow-hidden h-[360px] p-3.5 shadow-sm hover:shadow-xl hover:border-foreground/20 dark:hover:border-foreground/35 cursor-zoom-in transition-all duration-300 md:col-span-1"
              >
                {/* Technical Corner Accents */}
                <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-foreground/20 group-hover:border-foreground/45 transition-colors duration-300 z-10" />
                <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-foreground/20 group-hover:border-foreground/45 transition-colors duration-300 z-10" />
                <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-foreground/20 group-hover:border-foreground/45 transition-colors duration-300 z-10" />
                <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-foreground/20 group-hover:border-foreground/45 transition-colors duration-300 z-10" />

                {/* Nice Inner Image Frame */}
                <div className="relative w-full h-full rounded-lg overflow-hidden border border-border/60 dark:border-border/30 bg-muted/20">
                  <Image 
                    src="/assets/vidyaschool/student_singing.jpg"
                    alt="Student vocal and choral practice"
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover w-full h-full transition-transform duration-700 ease-out group-hover:scale-105"
                    loading="lazy"
                  />
                  {/* Hover Text Overlay inside image frame */}
                  <motion.div 
                    variants={overlayVariants}
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                    className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col justify-end p-6 z-10"
                  >
                    <motion.div
                      variants={contentVariants}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                      className="space-y-2 text-left"
                    >
                      <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/70">
                        <Music className="h-3.5 w-3.5" />
                        <span>Vocal Music</span>
                      </div>
                      <h3 className="text-lg font-bold text-white tracking-tight">Choral & Classical Singing</h3>
                      <p className="text-xs text-white/80 leading-relaxed">
                        Developing vocal control, pitch alignment, and choral harmony across Hindustani and classical vocal traditions.
                      </p>
                    </motion.div>
                  </motion.div>
                </div>
              </motion.div>

              {/* Card 3: Instrumental Music */}
              <motion.div 
                id="bento-card-instrumental"
                initial="initial"
                whileHover="hover"
                onClick={() => setActiveImage({
                  src: "/assets/vidyaschool/student_playing.jpg",
                  alt: "Instrumental Play - Hands-on practical training with acoustic and traditional Indian instruments."
                })}
                className="group relative rounded-2xl border border-border/80 dark:border-border bg-card/45 dark:bg-card/10 overflow-hidden h-[360px] p-3.5 shadow-sm hover:shadow-xl hover:border-foreground/20 dark:hover:border-foreground/35 cursor-zoom-in transition-all duration-300 md:col-span-1"
              >
                {/* Technical Corner Accents */}
                <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-foreground/20 group-hover:border-foreground/45 transition-colors duration-300 z-10" />
                <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-foreground/20 group-hover:border-foreground/45 transition-colors duration-300 z-10" />
                <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-foreground/20 group-hover:border-foreground/45 transition-colors duration-300 z-10" />
                <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-foreground/20 group-hover:border-foreground/45 transition-colors duration-300 z-10" />

                {/* Nice Inner Image Frame */}
                <div className="relative w-full h-full rounded-lg overflow-hidden border border-border/60 dark:border-border/30 bg-muted/20">
                  <Image 
                    src="/assets/vidyaschool/student_playing.jpg"
                    alt="Student playing acoustic guitar"
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover w-full h-full transition-transform duration-700 ease-out group-hover:scale-105"
                    loading="lazy"
                  />
                  {/* Hover Text Overlay inside image frame */}
                  <motion.div 
                    variants={overlayVariants}
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                    className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col justify-end p-6 z-10"
                  >
                    <motion.div
                      variants={contentVariants}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                      className="space-y-2 text-left"
                    >
                      <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/70">
                        <Activity className="h-3.5 w-3.5" />
                        <span>Activity</span>
                      </div>
                      <h3 className="text-lg font-bold text-white tracking-tight">Instrumental Play</h3>
                      <p className="text-xs text-white/80 leading-relaxed">
                        Hands-on practical training with acoustic guitars, percussion, keyboards, and traditional Indian instruments.
                      </p>
                    </motion.div>
                  </motion.div>
                </div>
              </motion.div>

              {/* Card 4: Lego Robotics & Innovation */}
              <motion.div 
                id="bento-card-robotics"
                initial="initial"
                whileHover="hover"
                onClick={() => setActiveImage({
                  src: "/assets/vidyaschool/student_robotics.jpg",
                  alt: "Lego Robotics & Innovation - Designing, constructing, and programming autonomous robots."
                })}
                className="group relative rounded-2xl border border-border/80 dark:border-border bg-card/45 dark:bg-card/10 overflow-hidden h-[360px] p-3.5 shadow-sm hover:shadow-xl hover:border-foreground/20 dark:hover:border-foreground/35 cursor-zoom-in transition-all duration-300 md:col-span-2"
              >
                {/* Technical Corner Accents */}
                <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-foreground/20 group-hover:border-foreground/45 transition-colors duration-300 z-10" />
                <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-foreground/20 group-hover:border-foreground/45 transition-colors duration-300 z-10" />
                <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-foreground/20 group-hover:border-foreground/45 transition-colors duration-300 z-10" />
                <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-foreground/20 group-hover:border-foreground/45 transition-colors duration-300 z-10" />

                {/* Nice Inner Image Frame */}
                <div className="relative w-full h-full rounded-lg overflow-hidden border border-border/60 dark:border-border/30 bg-muted/20">
                  <Image 
                    src="/assets/vidyaschool/student_robotics.jpg"
                    alt="Student coding and constructing Lego Mindstorms robotics"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
                    className="object-cover w-full h-full transition-transform duration-700 ease-out group-hover:scale-105"
                    loading="lazy"
                  />
                  {/* Hover Text Overlay inside image frame */}
                  <motion.div 
                    variants={overlayVariants}
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                    className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col justify-end p-6 z-10"
                  >
                    <motion.div
                      variants={contentVariants}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                      className="space-y-2 text-left"
                    >
                      <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/70">
                        <Bot className="h-3.5 w-3.5" />
                        <span>STEM & Robotics</span>
                      </div>
                      <h3 className="text-lg font-bold text-white tracking-tight">Lego Robotics & Innovation</h3>
                      <p className="text-xs text-white/80 max-w-md leading-relaxed">
                        Designing, constructing, and programming autonomous robots to solve real-world problems using creative engineering blocks.
                      </p>
                    </motion.div>
                  </motion.div>
                </div>
              </motion.div>

            </div>
          </motion.section>

          {/* Partners Section */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full mt-16 md:mt-20 py-6 overflow-hidden bg-transparent"
          >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-4">
              <h2 className="text-center text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                Platforms & Programs Empowering Our Digital Classroom
              </h2>
            </div>
            
            <div className="relative flex w-full overflow-hidden mask-gradient">
              <div className="animate-marquee flex items-center py-8">
                {/* Render 4 copies of the partners array to cover wide screen viewports without blank gaps at translateX(-50%) */}
                {Array.from({ length: 4 }).map((_, groupIndex) => 
                  partners.map((partner, index) => (
                    <motion.div
                      key={`p${groupIndex + 1}-${index}`}
                      animate={{
                        y: [0, -18, 0],
                      }}
                      transition={{
                        duration: 8.0,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: -index * 1.25,
                      }}
                      whileHover={{ scale: 1.05 }}
                      className="flex items-center justify-center bg-muted/20 border border-border/40 hover:border-foreground/30 dark:hover:border-foreground/40 rounded-lg px-8 py-5 min-w-[210px] h-[72px] select-none cursor-pointer transition-colors duration-200 mr-8"
                    >
                      {partner.logo}
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </motion.section>
  
        </div>
      </main>

      {/* Footer Component */}
      <Footer />

      {/* Lightbox Dialog Modal */}
      <AnimatePresence>
        {activeImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveImage(null)}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-5xl w-full aspect-video md:aspect-[3/2] max-h-[85vh] rounded-2xl overflow-hidden border border-border/10 bg-black shadow-2xl flex items-center justify-center cursor-default"
            >
              <img 
                src={activeImage.src} 
                alt={activeImage.alt}
                className="w-full h-full object-contain select-none"
              />
              
              {/* Close Button */}
              <button 
                id="lightbox-close-btn"
                onClick={() => setActiveImage(null)}
                className="absolute top-4 right-4 z-20 rounded-full bg-black/60 hover:bg-black/80 border border-white/10 hover:border-white/30 text-white/80 hover:text-white p-2 transition-all cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Caption Overlay */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 text-left">
                <p className="text-white font-medium text-sm sm:text-base md:text-lg">
                  {activeImage.alt}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
