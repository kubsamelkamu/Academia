import { redirect } from "next/navigation"

type AcceptInvitationAliasPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function AcceptInvitationAliasPage({
  searchParams,
}: AcceptInvitationAliasPageProps) {
  const params = (await searchParams) ?? {}
  const rawToken = params.token
  const token = Array.isArray(rawToken) ? rawToken[0] : rawToken

  const qs = token ? `?token=${encodeURIComponent(token)}` : ""
  redirect(`/accept-invitation${qs}`)
}
