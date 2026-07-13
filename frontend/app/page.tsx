import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HeroSection } from "@/components/hero-section"
import dynamic from "next/dynamic"
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'VidyaSchool | Empowering Minds, Shaping Futures',
  description: 'Welcome to VidyaSchool - academic excellence meets holistic development with modern labs, arts programs, and vibrant student community.',
}

const VideoModal = dynamic(() => import("@/components/video-modal"), {
  loading: () => <div className="w-full aspect-video rounded-2xl bg-muted/20 animate-pulse" />
})
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
] as const

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      
      <main className="flex-1 flex flex-col">
        <HeroSection />

        <div className="w-full px-4 sm:px-8 md:px-12 lg:px-24 max-w-none">
          <section id="about" className="w-full mt-16 md:mt-24 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <div className="lg:col-span-7"><VideoModal /></div>
              <div className="lg:col-span-5 flex flex-col justify-center space-y-6">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                  A Little About Us
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-[1.3] border-l-3 border-rose-600/60 pl-5 py-1">
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
          <section id="students" className="w-full mt-20 md:mt-28 py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-8">
              <h2 className="text-center text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">Our Students</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 p-3.5 rounded-2xl border border-border/80 bg-card/45 overflow-hidden h-[360px]">
                <ImageLightbox src="/assets/vidyaschool/student_classical_dance.jpg" alt="Classical & Fusion Dance" width={1200} height={800} priority />
              </div>
              <div className="p-3.5 rounded-2xl border border-border/80 bg-card/45 overflow-hidden h-[360px]">
                <ImageLightbox src="/assets/vidyaschool/student_singing.jpg" alt="Choral & Classical Singing" width={600} height={900} />
              </div>
              <div className="p-3.5 rounded-2xl border border-border/80 bg-card/45 overflow-hidden h-[360px]">
                <ImageLightbox src="/assets/vidyaschool/student_playing.jpg" alt="Instrumental Play" width={600} height={900} />
              </div>
              <div className="md:col-span-2 p-3.5 rounded-2xl border border-border/80 bg-card/45 overflow-hidden h-[360px]">
                <ImageLightbox src="/assets/vidyaschool/student_robotics.jpg" alt="Lego Robotics & Innovation" width={1200} height={800} />
              </div>
            </div>
          </section>

          {/* Partners */}
          <section id="partners" className="w-full mt-16 md:mt-20 py-6 overflow-hidden">
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
