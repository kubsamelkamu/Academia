export const DOCUMENT_TEMPLATE_ALLOWED_MIME_TYPES = new Set<string>([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
])

export function isAllowedDocumentTemplateFile(file: File): boolean {
  if (DOCUMENT_TEMPLATE_ALLOWED_MIME_TYPES.has(file.type)) return true
  const name = file.name.toLowerCase()
  return name.endsWith(".pdf") || name.endsWith(".docx")
}

export function formatBytesAsMb(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—"
  const mb = bytes / (1024 * 1024)
  return `${mb.toFixed(2)} MB`
}

export type ValidateDocumentTemplateFilesOptions = {
  maxFiles?: number
  maxBytesPerFile?: number
  emptySelectionError?: string
  tooManyFilesError?: string
}

export function validateDocumentTemplateFiles(
  files: File[],
  options: ValidateDocumentTemplateFilesOptions = {}
): string | null {
  const maxFiles = options.maxFiles ?? 10
  const maxBytesPerFile = options.maxBytesPerFile ?? 10 * 1024 * 1024
  const emptySelectionError =
    options.emptySelectionError ?? "Please select at least one file (PDF or DOCX)."
  const tooManyFilesError =
    options.tooManyFilesError ?? `You can upload up to ${maxFiles} files per request.`

  if (!files.length) {
    return emptySelectionError
  }

  if (files.length > maxFiles) {
    return tooManyFilesError
  }

  for (const file of files) {
    if (!isAllowedDocumentTemplateFile(file)) {
      return `Unsupported file type: ${file.name}`
    }
    if (file.size > maxBytesPerFile) {
      return `File too large (max 10MB): ${file.name}`
    }
  }

  return null
}
