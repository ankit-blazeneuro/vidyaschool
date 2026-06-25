import Link from "next/link"
import Image from "next/image"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Globe, ArrowRight, Music, Bot, Activity, Sparkles } from "lucide-react"
import dynamic from "next/dynamic"

const LiquidMetalHero = dynamic(() => import("@/components/liquid-metal-hero"))
const VideoModal = dynamic(() => import("@/components/video-modal"))
const ImageLightbox = dynamic(() => import("@/components/image-lightbox"))
const AnimatedPartners = dynamic(() => import("@/components/animated-partners"))

const partners = [
  { name: "WIAUK", logo: "/assets/logos/wiaauk.jpg", width: 32, height: 32 },
  { name: "Mastercard", logo: "/assets/logos/mastercard.svg", width: 32, height: 32 },
  { name: "IIT Delhi", logo: "/assets/logos/iitd.png", width: 32, height: 32 },
  { name: "ICA", logo: "/assets/logos/india-for-collective-india.png", width: 32, height: 32 },
  { name: "RBS", logo: "/assets/logos/rbs.png", width: 32, height: 32 },
  { name: "Bird Group", logo: "/assets/logos/bird.png", width: 80, height: 16 },
  { name: "Fidelity", logo: "/assets/logos/fidelity.svg", width: 32, height: 32 },
  { name: "Verint", logo: "/assets/logos/verint.jpg", width: 32, height: 32 },
  { name: "KPMG", logo: "/assets/logos/kpmg.png", width: 72, height: 32 },
  { name: "ReNew Power", logo: "/assets/logos/renew.svg", width: 80, height: 32 },
  { name: "IndiGo", logo: "/assets/logos/indigo.svg", width: 40, height: 32 },
  { name: "ICRA", logo: "/assets/logos/icra.png", width: 80, height: 32 }
]

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      
      <main className="flex-1 flex flex-col justify-center py-4 sm:py-6 md:py-8">
        <div className="w-full px-4 sm:px-8 md:px-12 lg:px-24 max-w-none">
          
          {/* Hero */}
          <div className="relative rounded-xl border border-border bg-transparent px-4 py-6 sm:px-8 sm:py-9 md:px-12 md:py-12 lg:px-14 lg:py-14">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 sm:gap-10 lg:gap-16 items-center">
              
              <div className="lg:col-span-6 flex flex-col justify-center min-h-0 lg:min-h-[350px] lg:pl-6 order-2 lg:order-1">
                <div className="space-y-4 text-center sm:space-y-5 lg:space-y-6 lg:text-left">
                  <div className="inline-flex max-w-full items-center gap-1.5 self-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground sm:text-xs lg:self-start">
                    <Sparkles className="h-4 w-4" />
                    <span className="truncate">Welcome to VidyaSchool</span>
                  </div>
                  
                  <h1 className="text-[clamp(2.25rem,10vw,3.75rem)] font-extrabold tracking-tight text-foreground leading-[1.05] text-balance sm:text-[clamp(3rem,7vw,4.5rem)] lg:text-[clamp(3.25rem,4.6vw,5rem)]">
                    Empowering Minds, Shaping Futures
                  </h1>
                  
                  <p className="mx-auto max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base md:text-lg lg:mx-0">
                    Welcome to VidyaSchool, where academic excellence meets holistic development. Discover our wings, modern labs, arts programs, and vibrant student community.
                  </p>
  
                  <div className="flex w-full flex-col items-stretch gap-3 pt-2 sm:flex-row sm:items-center sm:justify-center lg:justify-start">
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
  
              <div className="lg:col-span-6 flex items-center justify-center lg:pr-6 order-1 lg:order-2">
                <LiquidMetalHero />
              </div>
            </div>
          </div>

          {/* Video */}
          <section className="w-full mt-16 md:mt-24 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <div className="lg:col-span-7"><VideoModal /></div>
              <div className="lg:col-span-5 flex flex-col justify-center space-y-6">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-0.5 w-fit text-xs font-semibold text-muted-foreground">
                  <Globe className="h-3.5 w-3.5" />
                  <span>A Little About Us</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-[1.3] italic border-l-3 border-rose-600/60 pl-5 py-1">
                  "It's like a home to me. It's the place where I grow as a person, get exposed to new ideas, learn and reach for my dreams."
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Here's a short film with the students, teachers, and staff talking about what makes the VIDYA School different and what it means to them.
                </p>
                <div className="space-y-3.5 pt-2">
                  <div className="flex items-start gap-2.5 text-sm">
                    <span className="h-5 w-5 mt-0.5 flex items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 text-xs shrink-0">✓</span>
                    <div><h4 className="font-semibold text-foreground">Holistic Growth</h4><p className="text-xs text-muted-foreground mt-0.5">Fostering personal development alongside academic excellence.</p></div>
                  </div>
                  <div className="flex items-start gap-2.5 text-sm">
                    <span className="h-5 w-5 mt-0.5 flex items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 text-xs shrink-0">✓</span>
                    <div><h4 className="font-semibold text-foreground">New Ideas & Exposure</h4><p className="text-xs text-muted-foreground mt-0.5">Broadening horizons through visual and physical digital learning.</p></div>
                  </div>
                  <div className="flex items-start gap-2.5 text-sm">
                    <span className="h-5 w-5 mt-0.5 flex items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 text-xs shrink-0">✓</span>
                    <div><h4 className="font-semibold text-foreground">A Nurturing Community</h4><p className="text-xs text-muted-foreground mt-0.5">A second home where students, teachers, and staff grow together.</p></div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Bento */}
          <section className="w-full mt-20 md:mt-28 py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-8">
              <h2 className="text-center text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">Our Students</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 p-3.5 rounded-2xl border border-border/80 bg-card/45 overflow-hidden h-[360px]">
                <ImageLightbox src="/assets/vidyaschool/student_classical_dance.jpg" alt="Classical & Fusion Dance" width={800} height={600} />
              </div>
              <div className="p-3.5 rounded-2xl border border-border/80 bg-card/45 overflow-hidden h-[360px]">
                <ImageLightbox src="/assets/vidyaschool/student_singing.jpg" alt="Choral & Classical Singing" width={400} height={600} />
              </div>
              <div className="p-3.5 rounded-2xl border border-border/80 bg-card/45 overflow-hidden h-[360px]">
                <ImageLightbox src="/assets/vidyaschool/student_playing.jpg" alt="Instrumental Play" width={400} height={600} />
              </div>
              <div className="md:col-span-2 p-3.5 rounded-2xl border border-border/80 bg-card/45 overflow-hidden h-[360px]">
                <ImageLightbox src="/assets/vidyaschool/student_robotics.jpg" alt="Lego Robotics & Innovation" width={800} height={600} />
              </div>
            </div>
          </section>

          {/* Partners */}
          <section className="w-full mt-16 md:mt-20 py-6 overflow-hidden">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-4">
              <h2 className="text-center text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">Platforms & Programs Empowering Our Digital Classroom</h2>
            </div>
            <AnimatedPartners partners={partners} />
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
