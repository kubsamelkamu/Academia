/**
 * Removes only the Next.js dev lock file.
 * Prefer `npm run dev` (uses scripts/prepare-next-dev.mjs), which also frees ports 3000/3001 on Windows.
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..")
const lockPath = path.join(root, ".next", "dev", "lock")

try {
  if (fs.existsSync(lockPath)) {
    fs.rmSync(lockPath, { recursive: true, force: true })
    console.log("[clean-next-dev] removed dev lock:", lockPath)
  } else {
    console.log("[clean-next-dev] no dev lock found (ok to start)")
  }
} catch (err) {
  console.error("[clean-next-dev] failed:", err instanceof Error ? err.message : err)
  process.exitCode = 1
}
