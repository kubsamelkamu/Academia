"use client"

import * as React from "react"
import { Github, Linkedin, Plus, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/store/auth-store"

export function StudentProfileSection() {
  const user = useAuthStore((s) => s.user)
  const profileIsLoading = useAuthStore((s) => s.profileIsLoading)
  const updateStudentProfile = useAuthStore((s) => s.updateStudentProfile)

  const [bio, setBio] = React.useState(user?.bio ?? "")
  const [githubUrl, setGithubUrl] = React.useState(user?.githubUrl ?? "")
  const [linkedinUrl, setLinkedinUrl] = React.useState(user?.linkedinUrl ?? "")
  const [technologies, setTechnologies] = React.useState<string[]>(user?.technologies ?? [])
  const [techInput, setTechInput] = React.useState("")

  React.useEffect(() => {
    setBio(user?.bio ?? "")
    setGithubUrl(user?.githubUrl ?? "")
    setLinkedinUrl(user?.linkedinUrl ?? "")
    setTechnologies(user?.technologies ?? [])
  }, [user?.bio, user?.githubUrl, user?.linkedinUrl, user?.technologies])

  const handleAddTechnology = () => {
    const value = techInput.trim()
    if (!value) return
    if (technologies.includes(value)) {
      setTechInput("")
      return
    }
    setTechnologies((prev) => [...prev, value])
    setTechInput("")
  }

  const handleRemoveTechnology = (tech: string) => {
    setTechnologies((prev) => prev.filter((t) => t !== tech))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateStudentProfile({
        bio: bio.trim() || null,
        githubUrl: githubUrl.trim() || null,
        linkedinUrl: linkedinUrl.trim() || null,
        technologies,
      })
      toast.success("Student profile saved")
    } catch {
      toast.error("Failed to save student profile")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="student-bio">Bio</Label>
        <Textarea
          id="student-bio"
          placeholder="Add a short bio about yourself, your interests, and what you're working on."
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          className="resize-none"
        />
      </div>

      <div className="space-y-2">
        <Label>Social</Label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Github className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Input
              type="url"
              placeholder="https://github.com/your-username"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Linkedin className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Input
              type="url"
              placeholder="https://linkedin.com/in/your-username"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Technologies you use</Label>
        <div className="flex flex-wrap gap-2">
          {technologies.map((tech) => (
            <Badge
              key={tech}
              variant="secondary"
              className="font-normal gap-1 pr-1"
            >
              {tech}
              <button
                type="button"
                onClick={() => handleRemoveTechnology(tech)}
                className="rounded-full p-0.5 hover:bg-muted"
                aria-label={`Remove ${tech}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="e.g. React, TypeScript"
            value={techInput}
            onChange={(e) => setTechInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault()
                handleAddTechnology()
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleAddTechnology}
            aria-label="Add technology"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Button type="submit" disabled={profileIsLoading}>
        {profileIsLoading ? "Saving…" : "Save student profile"}
      </Button>
    </form>
  )
}
