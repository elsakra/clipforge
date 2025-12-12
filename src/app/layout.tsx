import type { Metadata } from "next";
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
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased">
        {children}
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}
