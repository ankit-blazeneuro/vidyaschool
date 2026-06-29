"use client"

import * as React from "react"
import { ImageIcon, Trash2Icon, PlusIcon, Loader2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface SliderImage {
  id: number
  url: string
  title: string
  enabled: boolean
}

// A beautiful, self-contained custom Switch component using Tailwind CSS
function CustomSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-primary" : "bg-input"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  )
}

export default function SliderManagementPage() {
  const [images, setImages] = React.useState<SliderImage[]>([])
  const [loading, setLoading] = React.useState(true)
  const [newTitle, setNewTitle] = React.useState("")
  const [newUrl, setNewUrl] = React.useState("")
  const [saving, setSaving] = React.useState(false)

  // Fetch slider images
  const fetchImages = React.useCallback(async () => {
    try {
      const res = await fetch("/api/backend/api/public/slider-images")
      if (res.ok) {
        const data = await res.json()
        setImages(data)
      }
    } catch (err) {
      console.error("Failed to fetch slider images", err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchImages()
  }, [fetchImages])

  // Save full image list
  const saveImages = async (updatedList: SliderImage[]) => {
    setSaving(true)
    try {
      const res = await fetch("/api/backend/api/admin/slider-images", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedList),
      })
      if (res.ok) {
        const data = await res.json()
        setImages(data.images || updatedList)
      }
    } catch (err) {
      console.error("Failed to save slider images", err)
    } finally {
      setSaving(false)
    }
  }

  // Toggle image enabled status
  const handleToggle = (id: number, enabled: boolean) => {
    const updatedList = images.map((img) =>
      img.id === id ? { ...img, enabled } : img
    )
    setImages(updatedList)
    saveImages(updatedList)
  }

  // Delete image
  const handleDelete = (id: number) => {
    const updatedList = images.filter((img) => img.id !== id)
    setImages(updatedList)
    saveImages(updatedList)
  }

  // Add new image
  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !newUrl.trim()) return

    const nextId = images.length > 0 ? Math.max(...images.map((img) => img.id)) + 1 : 1
    const newImage: SliderImage = {
      id: nextId,
      url: newUrl.trim(),
      title: newTitle.trim(),
      enabled: true,
    }

    const updatedList = [...images, newImage]
    setImages(updatedList)
    saveImages(updatedList)

    setNewTitle("")
    setNewUrl("")
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Slider Banners</h2>
        <p className="text-muted-foreground text-sm">
          Manage the image banners displayed on the student mobile app dashboard in real-time.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Side: Current Slider Images */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Banner Cards</CardTitle>
            <CardDescription>
              View, enable, or delete active banners on the student portal.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            {images.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed text-center">
                <ImageIcon className="mb-2 h-10 w-10 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">No slider images found</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {images.map((img) => (
                  <div key={img.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                    <div className="flex items-center space-x-4">
                      {/* Thumbnail */}
                      <div className="relative h-12 w-20 overflow-hidden rounded-md border bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.url}
                          alt={img.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold">{img.title}</h4>
                        <p className="text-xs text-muted-foreground">ID: {img.id}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-muted-foreground">
                          {img.enabled ? "Enabled" : "Disabled"}
                        </span>
                        <CustomSwitch
                          checked={img.enabled}
                          onChange={(checked) => handleToggle(img.id, checked)}
                          disabled={saving}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(img.id)}
                        disabled={saving}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Side: Add New Slider Image */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Add New Banner</CardTitle>
            <CardDescription>
              Add a new image URL and title to include it in the student carousel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Banner Title</label>
                <Input
                  type="text"
                  placeholder="e.g. Science Fair 2026"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Image URL</label>
                <Input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                    Adding Banner...
                  </>
                ) : (
                  <>
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Add Banner Card
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
