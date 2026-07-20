"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Send, Sparkles } from "lucide-react"

export function TeacherAIInput() {
  const router = useRouter()
  const [message, setMessage] = React.useState("")
  const [username, setUsername] = React.useState("")

  React.useEffect(() => {
    fetch("/api/profile/username")
      .then(res => res.json())
      .then(data => {
        if (data.username) setUsername(data.username)
      })
      .catch(() => {})
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    const uuid = crypto.randomUUID()
    
    // Save initial message to localStorage so it is picked up by the chat panel instantly
    const chatData = {
      id: uuid,
      title: message.trim().slice(0, 40) + (message.length > 40 ? "..." : ""),
      messages: [
        { role: "user", content: message.trim(), createdAt: new Date().toISOString() }
      ],
      createdAt: new Date().toISOString()
    }

    try {
      const existing = JSON.parse(localStorage.getItem("vidya_teacher_chats") || "[]")
      localStorage.setItem("vidya_teacher_chats", JSON.stringify([chatData, ...existing]))
      
      // Dispatch custom event to notify sidebar to update immediately
      window.dispatchEvent(new Event("vidya_chats_updated"))
    } catch (err) {
      console.error("Failed to save initial chat:", err)
    }

    // Try syncing with backend async
    fetch("/api/backend/api/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uuid, title: chatData.title, message: message.trim() })
    }).catch(() => {
      // Ignore background sync errors, client fallback is active
    })

    router.push(`/teacher/${username || 'username'}/tasks/${uuid}`)
  }

  return (
    <div className="sticky bottom-4 left-0 right-0 w-full max-w-3xl mx-auto px-4 z-40">
      <form
        onSubmit={handleSubmit}
        className="w-full flex items-center gap-2.5 p-2 rounded-2xl border border-zinc-200/40 dark:border-zinc-800/40 bg-white/30 dark:bg-black/35 backdrop-blur-md shadow-xl transition-all duration-200 focus-within:border-primary/30"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="h-4.5 w-4.5 animate-pulse" />
        </span>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask AI helper to plan a class or create a task..."
          className="flex-1 min-w-0 bg-transparent text-sm text-foreground focus:outline-none placeholder:text-muted-foreground/60 px-1"
        />
        <button
          type="submit"
          disabled={!message.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  )
}
