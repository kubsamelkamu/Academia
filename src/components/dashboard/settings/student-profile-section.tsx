"use client"

import * as React from "react"
import { Github, Globe, Linkedin, Plus, Sparkles, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/store/auth-store"

const MAX_TECH_STACK_ITEMS = 10
const MAX_TECH_STACK_ITEM_LENGTH = 50
const MAX_BIO_LENGTH = 2000

const SUGGESTED_TECH_STACK = [
  "React",
  "TypeScript",
  "Next.js",
  "Node.js",
  "Tailwind CSS",
  "PostgreSQL",
  "MongoDB",
  "Docker",
  "Kubernetes",
  "Redis",
  "GraphQL",
  "Python",
  "ReactNative",
  "Flutter",
  "FastAPI",
  "Django",
] as const

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

function isValidGithubUrl(value: string): boolean {
  if (!isValidHttpUrl(value)) return false
  return value.startsWith("https://github.com/")
}

function isValidLinkedinUrl(value: string): boolean {
  if (!isValidHttpUrl(value)) return false
  return value.startsWith("https://www.linkedin.com/")
}

function normalizeTechTokens(input: string): string[] {
  return input
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
}

export function StudentProfileSection() {

  const user = useAuthStore((s) => s.user)
  const profileIsLoading = useAuthStore((s) => s.profileIsLoading)
  const fetchStudentProfile = useAuthStore((s) => s.fetchStudentProfile)
  const updateStudentProfile = useAuthStore((s) => s.updateStudentProfile)

  const [bio, setBio] = React.useState(user?.bio ?? "")
  const [githubUrl, setGithubUrl] = React.useState(user?.githubUrl ?? "")
  const [linkedinUrl, setLinkedinUrl] = React.useState(user?.linkedinUrl ?? "")
  const [portfolioUrl, setPortfolioUrl] = React.useState(user?.portfolioUrl ?? "")
  const [techStack, setTechStack] = React.useState<string[]>(user?.techStack ?? user?.technologies ?? [])
  const [techInput, setTechInput] = React.useState("")

  const [fieldErrors, setFieldErrors] = React.useState<{ githubUrl?: string; linkedinUrl?: string; portfolioUrl?: string }>({})

  React.useEffect(() => {
    fetchStudentProfile().catch(() => {
    })
  }, [fetchStudentProfile])

  React.useEffect(() => {
    setBio(user?.bio ?? "")
    setGithubUrl(user?.githubUrl ?? "")
    setLinkedinUrl(user?.linkedinUrl ?? "")
    setPortfolioUrl(user?.portfolioUrl ?? "")
    setTechStack(user?.techStack ?? user?.technologies ?? [])
  }, [user?.bio, user?.githubUrl, user?.linkedinUrl, user?.portfolioUrl, user?.techStack, user?.technologies])

  const addToTechStack = React.useCallback((items: string[]) => {
    if (!items.length) return

    setTechStack((prev) => {
      const next = [...prev]

      for (const raw of items) {
        const token = raw.trim()
        if (!token) continue

        if (next.length >= MAX_TECH_STACK_ITEMS) {
          toast.error(`You can add up to ${MAX_TECH_STACK_ITEMS} items in your tech stack.`)
          break
        }

        if (token.length > MAX_TECH_STACK_ITEM_LENGTH) {
          toast.error(`Each tech stack item must be at most ${MAX_TECH_STACK_ITEM_LENGTH} characters.`)
          continue
        }

        const exists = next.some((t) => t.toLowerCase() === token.toLowerCase())
        if (exists) continue

        next.push(token)
      }

      return next
    })
  }, [])

  const availableSuggestions = React.useMemo(() => {
    const selected = new Set(techStack.map((t) => t.toLowerCase()))
    return SUGGESTED_TECH_STACK.filter((t) => !selected.has(t.toLowerCase())).slice(0, 10)
  }, [techStack])

  const handleAddTechnology = () => {
    const tokens = normalizeTechTokens(techInput)
    if (!tokens.length) return

    addToTechStack(tokens)
    setTechInput("")
  }

  const handleRemoveTechnology = (tech: string) => {
    setTechStack((prev) => prev.filter((t) => t !== tech))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedBio = bio.trim()
    if (trimmedBio.length > MAX_BIO_LENGTH) {
      toast.error(`Bio must be at most ${MAX_BIO_LENGTH} characters.`)
      return
    }

    const gh = githubUrl.trim()
    const li = linkedinUrl.trim()
    const pf = portfolioUrl.trim()

    const nextErrors: { githubUrl?: string; linkedinUrl?: string; portfolioUrl?: string } = {}
    if (gh && !isValidGithubUrl(gh)) nextErrors.githubUrl = "Must start with https://github.com/"
    if (li && !isValidLinkedinUrl(li)) nextErrors.linkedinUrl = "Must start with https://www.linkedin.com/"
    if (pf && !isValidHttpUrl(pf)) nextErrors.portfolioUrl = "Enter a valid http/https URL."
    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      toast.error("Please fix the invalid links before saving.")
      return
    }

    try {
      await updateStudentProfile({
        bio: trimmedBio || null,
        githubUrl: gh || null,
        linkedinUrl: li || null,
        portfolioUrl: pf || null,
        techStack,
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
              onBlur={() => {
                const value = githubUrl.trim()
                setFieldErrors((prev) => ({
                  ...prev,
                  githubUrl: value && !isValidGithubUrl(value) ? "Must start with https://github.com/" : undefined,
                }))
              }}
              aria-invalid={!!fieldErrors.githubUrl}
            />
          </div>
          {fieldErrors.githubUrl ? (
            <p className="text-xs text-destructive">{fieldErrors.githubUrl}</p>
          ) : null}
          <div className="flex items-center gap-2">
            <Linkedin className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Input
              type="url"
              placeholder="https://linkedin.com/in/your-username"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              onBlur={() => {
                const value = linkedinUrl.trim()
                setFieldErrors((prev) => ({
                  ...prev,
                  linkedinUrl: value && !isValidLinkedinUrl(value) ? "Must start with https://www.linkedin.com/" : undefined,
                }))
              }}
              aria-invalid={!!fieldErrors.linkedinUrl}
            />
          </div>
          {fieldErrors.linkedinUrl ? (
            <p className="text-xs text-destructive">{fieldErrors.linkedinUrl}</p>
          ) : null}
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Input
              type="url"
              placeholder="https://your-portfolio.com"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              onBlur={() => {
                const value = portfolioUrl.trim()
                setFieldErrors((prev) => ({
                  ...prev,
                  portfolioUrl: value && !isValidHttpUrl(value) ? "Enter a valid http/https URL." : undefined,
                }))
              }}
              aria-invalid={!!fieldErrors.portfolioUrl}
            />
          </div>
          {fieldErrors.portfolioUrl ? (
            <p className="text-xs text-destructive">{fieldErrors.portfolioUrl}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label>Tech stack</Label>
          <span className="text-xs text-muted-foreground">
            {techStack.length}/{MAX_TECH_STACK_ITEMS}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {techStack.map((tech) => (
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
            disabled={techStack.length >= MAX_TECH_STACK_ITEMS}
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
            disabled={techStack.length >= MAX_TECH_STACK_ITEMS}
            aria-label="Add technology"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {techStack.length < MAX_TECH_STACK_ITEMS && availableSuggestions.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Suggestions</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableSuggestions.map((suggestion) => (
                <Button
                  key={suggestion}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 px-2"
                  onClick={() => addToTechStack([suggestion])}
                >
                  <Plus className="h-3.5 w-3.5" />
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <Button type="submit" disabled={profileIsLoading}>
        {profileIsLoading ? "Saving…" : "Save student profile"}
      </Button>
    </form>
  )
}
