import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClipForge - AI Content Repurposing Platform",
  description: "Transform your long-form content into viral clips, social posts, and newsletters automatically with AI.",
  keywords: ["content repurposing", "AI", "video clips", "social media", "content creation", "podcaster tools"],
  authors: [{ name: "ClipForge" }],
  openGraph: {
    title: "ClipForge - AI Content Repurposing Platform",
    description: "Transform your long-form content into viral clips, social posts, and newsletters automatically with AI.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ClipForge - AI Content Repurposing Platform",
    description: "Transform your long-form content into viral clips, social posts, and newsletters automatically with AI.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#14b8a6",
          colorText: "#f8fafc",
          colorBackground: "#1e1b4b",
          colorInputBackground: "#312e81",
          colorInputText: "#f8fafc",
          borderRadius: "0.75rem",
        },
        elements: {
          formButtonPrimary: "bg-primary hover:bg-primary/90",
          card: "bg-card shadow-xl",
          headerTitle: "text-foreground",
          headerSubtitle: "text-muted-foreground",
          socialButtonsBlockButton: "bg-secondary hover:bg-secondary/80",
          formFieldInput: "bg-input border-border",
          footerActionLink: "text-primary hover:text-primary/80",
        },
      }}
    >
      <html lang="en" className="dark">
        <body className="min-h-screen antialiased">
          {children}
          <Toaster richColors position="bottom-right" />
        </body>
      </html>
    </ClerkProvider>
  );
}
