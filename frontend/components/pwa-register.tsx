"use client"

import { useEffect } from "react"

export function PWARegister() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      window.location.protocol === "https:" || window.location.hostname === "localhost"
    ) {
      const handleRegister = () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("Service Worker registered successfully with scope:", reg.scope)
          })
          .catch((err) => {
            console.error("Service Worker registration failed:", err)
          })
      }

      if (document.readyState === "complete") {
        handleRegister()
      } else {
        window.addEventListener("load", handleRegister)
        return () => window.removeEventListener("load", handleRegister)
      }
    }
  }, [])

  return null
}
