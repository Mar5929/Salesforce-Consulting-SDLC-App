import type { Metadata } from "next"
import { ClerkProvider } from "@clerk/nextjs"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { Toaster } from "@/components/ui/sonner"
import "@/app/globals.css"

export const metadata: Metadata = {
  title: "SF Consulting AI Framework",
  description: "AI-powered Salesforce consulting project management",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
            rel="stylesheet"
          />
        </head>
        <body className="min-h-screen bg-background font-sans antialiased">
          <NuqsAdapter>{children}</NuqsAdapter>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  )
}
