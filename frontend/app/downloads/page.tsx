import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { DownloadsClient } from "./downloads-client"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Mobile App Downloads | VidyaSchool",
  description: "Download the official VidyaSchool Mobile App for Android. Scan the QR code or download the APK directly.",
}

export default function DownloadsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />

      <main className="flex-1 py-12 px-4 sm:px-8 md:px-12 lg:px-24">
        <DownloadsClient />
      </main>

      <Footer />
    </div>
  )
}
