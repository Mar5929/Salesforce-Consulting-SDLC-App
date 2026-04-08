import { OAuthErrorToast } from "@/components/shared/oauth-error-toast"

interface HomePageProps {
  searchParams: Promise<{ error?: string }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { error } = await searchParams

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      {error === "oauth_failed" && <OAuthErrorToast />}
      <h1 className="text-2xl font-semibold">SF Consulting AI Framework</h1>
      <p className="mt-2 text-muted-foreground">
        AI-powered Salesforce consulting project management
      </p>
    </main>
  )
}
