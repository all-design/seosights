import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "seosights — Three Sights. One Unified AI Engine. | SEO · AEO · GEO",
  description:
    "seosights gives you Three Sights on modern search: First Sight (SEO), Second Sight (AEO), and Third Sight (GEO). 8 AI agents audit, strategize, and auto-execute — all while you sleep.",
  keywords: [
    "AI SEO",
    "AEO",
    "GEO",
    "backlinks",
    "AI citations",
    "ChatGPT SEO",
    "Perplexity citations",
    "seosights",
    "SEO strategy",
    "AI search optimization",
    "E-E-A-T",
    "AI crawler",
    "SEO autopilot",
    "Three Sights",
  ],
  authors: [{ name: "seosights" }],
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/logo-transparent.png", type: "image/png" },
    ],
  },
  openGraph: {
    title: "seosights — Three Sights. One Unified AI Engine.",
    description:
      "seosights gives you Three Sights on modern search: First Sight (SEO), Second Sight (AEO), and Third Sight (GEO). 8 AI agents work 24/7 — all while you sleep.",
    url: "https://seosights.com",
    siteName: "seosights",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "seosights — Three Sights. One Unified AI Engine.",
    description:
      "seosights gives you Three Sights on modern search: First Sight (SEO), Second Sight (AEO), and Third Sight (GEO). 8 AI agents work 24/7.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
          </AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
