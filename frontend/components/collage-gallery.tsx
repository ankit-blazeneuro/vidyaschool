"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"

interface CollageImage {
  src: string
  alt: string
  style: React.CSSProperties
}

const images: CollageImage[] = [
  {
    src: "/assets/vidyaschool/school.jpg",
    alt: "Our School",
    style: { left: "0%", top: "0%", width: "42%", height: "52%", borderRadius: 20, rotate: "-2deg", zIndex: 2 },
  },
  {
    src: "/assets/vidyaschool/student_singing.jpg",
    alt: "Choral Singing",
    style: { right: "0%", top: "2%", width: "26%", height: "56%", borderRadius: 20, rotate: "2.5deg", zIndex: 3 },
  },
  {
    src: "/assets/vidyaschool/student_playing.jpg",
    alt: "Instruments",
    style: { right: "27%", top: "4%", width: "24%", height: "48%", borderRadius: 20, rotate: "-1.5deg", zIndex: 2 },
  },
  {
    src: "/assets/vidyaschool/student_robotics.jpg",
    alt: "Lego Robotics",
    style: { left: "4%", bottom: "2%", width: "40%", height: "44%", borderRadius: 20, rotate: "1.5deg", zIndex: 3 },
  },
  {
    src: "/assets/vidyaschool/student_1.jpg",
    alt: "Our Students",
    style: { left: "36%", bottom: "0%", width: "22%", height: "50%", borderRadius: 20, rotate: "-2.5deg", zIndex: 4 },
  },
  {
    src: "/assets/vidyaschool/student_classical_dance.jpg",
    alt: "Classical Dance",
    style: { right: "0%", bottom: "3%", width: "44%", height: "42%", borderRadius: 20, rotate: "2deg", zIndex: 3 },
  },
]

export default function CollageGallery() {
  const [active, setActive] = useState<CollageImage | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <>
      {/* Collage container */}
      <div className="relative mx-auto w-full max-w-[1600px] px-4 sm:px-6 h-[580px] sm:h-[640px]">
        {images.map((img) => (
          <div
            key={img.src}
            className="absolute overflow-hidden shadow-2xl cursor-zoom-in group transition-transform duration-300 hover:scale-[1.03] hover:z-20"
            style={img.style}
            onClick={() => setActive(img)}
          >
            <img
              src={img.src}
              alt={img.alt}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%)" }}
            />
            <span className="absolute bottom-3 left-4 text-white text-xs font-semibold tracking-wide drop-shadow">
              {img.alt}
            </span>
          </div>
        ))}
      </div>

      {/* Lightbox dialog — portaled to body for true viewport centering */}
      {active && mounted && createPortal(
        <div
          className="fixed inset-0 z-[9999] w-screen h-screen bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 cursor-zoom-out animate-fade-in"
          onClick={() => setActive(null)}
        >
          <div
            className="relative max-w-5xl w-full max-h-[85vh] flex flex-col items-center justify-center rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black/95 animate-zoom-in cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={active.src}
              alt={active.alt}
              className="w-full h-auto max-h-[85vh] object-contain"
            />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-6 py-4">
              <p className="text-white text-sm font-semibold tracking-wide text-center">{active.alt}</p>
            </div>
            <button
              onClick={() => setActive(null)}
              className="absolute top-4 right-4 z-20 rounded-full bg-black/60 hover:bg-black/80 border border-white/10 hover:border-white/30 text-white p-2.5 transition-all duration-300 hover:rotate-90 shadow-lg"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>,
        document.body
      )}

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes zoom-in {
          from { transform: scale(0.92); opacity: 0; }
          to   { transform: scale(1);    opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
        .animate-zoom-in { animation: zoom-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
      `}</style>
    </>
  )
}
