import Link from "next/link"

export default function DocsPage() {
  return (
    <main className="container mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Documentation</h1>
      <p className="mt-3 text-muted-foreground">
        Product docs are currently maintained in the repository markdown files.
      </p>

      <ul className="mt-6 space-y-3">
        <li>
          <Link href="/features" className="text-primary hover:underline">
            See platform features
          </Link>
        </li>
        <li>
          <a href="https://github.com/kubsamelkamu/Academia" target="_blank" rel="noreferrer" className="text-primary hover:underline">
            Open repository documentation
          </a>
        </li>
      </ul>
    </main>
  )
}
