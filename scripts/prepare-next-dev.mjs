/**
 * Prepares a clean Next.js dev run on Windows:
 * 1) Stops processes listening on 3000/3001 (orphaned Node often still holds `.next/dev` lock).
 * 2) Deletes `.next/dev` so lock/cache cannot block a new server.
 *
 * Uses spawnSync + timeouts so this never hangs indefinitely.
 */
import { spawnSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { setTimeout as delay } from "node:timers/promises"
import { fileURLToPath } from "node:url"

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..")
const devDir = path.join(root, ".next", "dev")

const NETSTAT_MS = 12_000
const TASKKILL_MS = 8_000

function killListenersOnPortsWin32(ports) {
  if (process.platform !== "win32") return

  const netstat = spawnSync("netstat", ["-ano"], {
    encoding: "utf8",
    timeout: NETSTAT_MS,
    windowsHide: true,
  })
  if (netstat.error || netstat.status !== 0 || !netstat.stdout) return

  const pids = new Set()
  for (const line of netstat.stdout.split(/\r?\n/)) {
    const upper = line.toUpperCase()
    if (!upper.includes("LISTENING")) continue
    for (const port of ports) {
      if (!new RegExp(`:${port}(\\s|$)`).test(line)) continue
      const parts = line.trim().split(/\s+/)
      const pid = parts[parts.length - 1]
      if (/^\d+$/.test(pid)) pids.add(pid)
    }
  }

  for (const pid of pids) {
    const r = spawnSync("taskkill", ["/F", "/PID", pid], {
      encoding: "utf8",
      timeout: TASKKILL_MS,
      windowsHide: true,
    })
    if (r.status === 0) {
      console.log(`[prepare-next-dev] stopped process ${pid} (was listening on a dev port)`)
    }
  }
}

async function rmDevArtifacts() {
  if (!fs.existsSync(devDir)) return

  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      try {
        fs.rmSync(devDir, { recursive: true, force: true, maxRetries: 6, retryDelay: 150 })
      } catch {
        fs.rmSync(devDir, { recursive: true, force: true })
      }
      if (!fs.existsSync(devDir)) {
        console.log("[prepare-next-dev] removed .next/dev")
        return
      }
    } catch (err) {
      if (attempt === 5) {
        console.warn(
          "[prepare-next-dev] could not fully remove .next/dev:",
          err instanceof Error ? err.message : err,
        )
        console.warn("[prepare-next-dev] close any running `next dev`, then delete `.next\\dev` manually or retry.")
        return
      }
      await delay(200 * (attempt + 1))
    }
  }
}

killListenersOnPortsWin32([3000, 3001])
await rmDevArtifacts()
