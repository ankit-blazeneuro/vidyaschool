"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { Play, X } from "lucide-react"

export default function VideoModal() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)
  const imageContainerRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return
    const rect = imageContainerRef.current.getBoundingClientRect()
    setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  return (
    <>
      <div 
        ref={imageContainerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setIsModalOpen(true)}
        className="relative rounded-2xl overflow-hidden border border-border/80 bg-card/45 shadow-lg group aspect-video cursor-pointer"
      >
        <Image
          className="w-full h-full object-cover rounded-2xl"
          src="/assets/vidyaschool/vidya-founder.png"
          alt="VIDYA Founder"
          width={1366}
          height={768}
          quality={85}
          priority
        />
        <button
          type="button"
          className="absolute left-1/2 top-1/2 z-20 flex h-18 w-18 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/35 bg-white/20 text-white shadow-2xl backdrop-blur-xl transition-transform hover:scale-110"
          aria-label="Play video"
        >
          <Play className="ml-1 h-7 w-7 fill-current" />
        </button>
        {isHovered && (
          <div 
            className="absolute pointer-events-none z-20 flex items-center gap-2 bg-background/60 backdrop-blur-md border border-border/80 text-foreground font-semibold rounded-xl shadow-2xl text-xs px-4 py-2.5 transition-all duration-200"
            style={{ 
              left: mousePosition.x - 60, 
              top: mousePosition.y - 20,
              transform: 'scale(1)',
              opacity: 1
            }}
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-white animate-pulse">
              <Play className="h-2 w-2 fill-current ml-0.5" />
            </div>
            <span>Watch Video</span>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div 
          onClick={() => setIsModalOpen(false)} 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="relative max-w-4xl w-full aspect-video rounded-2xl overflow-hidden border border-border bg-black shadow-2xl animate-scale-in"
          >
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="absolute top-4 right-4 z-20 rounded-full bg-black/60 hover:bg-black/80 border border-white/10 hover:border-white/30 text-white p-2 transition-all hover:rotate-90 duration-300" 
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <iframe
              src="https://www.youtube.com/embed/LxzeiY0BG1U?si=m2V7tJ-BuAWCP48f&autoplay=1"
              title="VIDYA Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>
        </div>
      )}
      
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </>
  )
}
