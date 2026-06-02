import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
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
  title: "seosight — Vision. Analytics. Rank. | SEO · AEO · GEO",
  description:
    "AI-powered SEO, AEO & GEO platform that ranks you on Google AND gets cited by ChatGPT, Claude, and Perplexity. Vision. Analytics. Rank.",
  keywords: [
    "AI SEO",
    "AEO",
    "GEO",
    "backlinks",
    "AI citations",
    "ChatGPT SEO",
    "Perplexity citations",
    "seosight",
    "SEO strategy",
    "AI search optimization",
    "E-E-A-T",
    "AI crawler",
  ],
  authors: [{ name: "seosight" }],
  icons: {
    icon: "/logo.png",
  },
  openGraph: {
    title: "seosight — Vision. Analytics. Rank.",
    description:
      "AI-powered SEO, AEO & GEO platform that ranks you on Google AND gets cited by ChatGPT, Claude, and Perplexity.",
    url: "https://seosight.ai",
    siteName: "seosight",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "seosight — Vision. Analytics. Rank.",
    description:
      "AI-powered SEO, AEO & GEO platform that ranks you on Google AND gets cited by ChatGPT, Claude, and Perplexity.",
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
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
