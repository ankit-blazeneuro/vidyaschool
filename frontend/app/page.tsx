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

          {/* Mobile App */}
          <section id="mobile-app" className="w-full mt-20 md:mt-28 py-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

              {/* Left — mockup cluster */}
              <div className="flex items-center justify-center select-none">
                <div className="relative flex items-end justify-center w-full max-w-[480px] h-[520px]">
                  {/* Bottom-left mockup */}
                  <img
                    src="/assets/mockups/bl.svg"
                    alt="App screen – bottom left"
                    className="absolute bottom-0 left-[2%] w-[37%] drop-shadow-xl rounded-[18px] rotate-[-6deg] translate-y-3 z-10"
                    draggable={false}
                  />
                  {/* Centre / main mockup */}
                  <img
                    src="/assets/mockups/wc.svg"
                    alt="App screen – centre"
                    className="relative w-[46%] drop-shadow-2xl rounded-[22px] z-20"
                    draggable={false}
                  />
                  {/* Bottom-right mockup */}
                  <img
                    src="/assets/mockups/br.svg"
                    alt="App screen – bottom right"
                    className="absolute bottom-0 right-[2%] w-[37%] drop-shadow-xl rounded-[18px] rotate-[6deg] translate-y-3 z-10"
                    draggable={false}
                  />
                  {/* Soft glow behind centre screen */}
                  <div className="absolute inset-x-[20%] inset-y-[15%] rounded-full bg-rose-500/10 blur-3xl pointer-events-none z-0" />
                </div>
              </div>

              {/* Right — copy + store buttons */}
              <div className="flex flex-col justify-center space-y-7">
                <div>
                  <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                    Now on Mobile
                  </span>
                  <h2 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
                    Mobile App{" "}
                    <span className="bg-gradient-to-r from-rose-500 to-orange-400 bg-clip-text text-transparent">
                      Available
                    </span>
                  </h2>
                  <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-md">
                    Access assignments, timetables, fee updates, library resources, and live announcements — all from your pocket. The VidyaSchool app keeps students, parents, and teachers seamlessly connected.
                  </p>
                </div>

                {/* Feature pills */}
                <div className="flex flex-wrap gap-2">
                  {["Attendance Tracking", "Fee Payments", "Live Notices", "E-Library", "Timetable"].map((f) => (
                    <span
                      key={f}
                      className="px-3 py-1 rounded-full text-[11px] font-medium bg-muted/60 border border-border/60 text-muted-foreground"
                    >
                      {f}
                    </span>
                  ))}
                </div>

                {/* Store buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                  {/* Android */}
                  <a
                    href="/downloads"
                    aria-label="Download for Android"
                    className="group inline-flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-foreground text-background hover:bg-foreground/90 transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 w-full sm:w-auto"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 918.6 515.1" className="w-6 h-6 shrink-0" aria-hidden="true">
                      <path fill="#3DDC84" d="M918.6 515.1h-918.6c14.7-155.7 103.7-288.7 235.1-359.9l-76.2-132c-4.3-7.4-1.8-16.8 5.6-21.1s16.8-1.8 21.1 5.6l77.2 133.7c58.9-26.9 125.2-41.9 196.5-41.9s137.6 15 196.5 41.9l77.2-133.7c4.2-7.4 13.7-9.9 21-5.6s9.9 13.7 5.6 21.1l-76.2 132c131.5 71.2 220.5 204.2 235.2 359.9zm-248.5-129c21.3 0 38.6-17.3 38.5-38.5 0-21.2-17.2-38.5-38.5-38.5-21.2 0-38.5 17.2-38.5 38.5 0 21.2 17.2 38.5 38.5 38.5zm-421.7 0c21.3 0 38.6-17.3 38.5-38.5 0-21.2-17.2-38.5-38.5-38.5-21.2 0-38.5 17.2-38.5 38.5 0 21.2 17.2 38.5 38.5 38.5z"/>
                    </svg>
                    <div className="text-left leading-none">
                      <p className="text-sm font-semibold">Android</p>
                    </div>
                  </a>

                  {/* App Store */}
                  <a
                    href="/downloads"
                    aria-label="Download on the App Store"
                    className="group inline-flex items-center gap-3 px-5 py-3.5 rounded-2xl border border-border/80 bg-card/60 hover:bg-card transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 w-full sm:w-auto"
                  >
                    <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0 fill-current text-foreground" aria-hidden="true">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                    </svg>
                    <div className="text-left leading-none">
                      <p className="text-sm font-semibold text-foreground">App Store</p>
                    </div>
                  </a>
                </div>

                <p className="text-[11px] text-muted-foreground/50">
                  Free to download · Available for Android 8+ & iOS 14+
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
