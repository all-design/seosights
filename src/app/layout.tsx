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
  title: "Agent OS — AI SEO Backlinks That Rank & Get Cited",
  description:
    "AI-powered SEO backlinks that rank you on Google AND get cited by ChatGPT, Claude, and Perplexity. One lever. Both worlds.",
  keywords: [
    "AI SEO",
    "backlinks",
    "AI citations",
    "ChatGPT SEO",
    "Perplexity citations",
    "Agent OS",
    "SEO strategy",
    "AI search optimization",
  ],
  authors: [{ name: "Agent OS" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Agent OS — AI SEO Backlinks That Rank & Get Cited",
    description:
      "AI-powered SEO backlinks that rank you on Google AND get cited by ChatGPT, Claude, and Perplexity.",
    url: "https://agentos.ai",
    siteName: "Agent OS",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Agent OS — AI SEO Backlinks That Rank & Get Cited",
    description:
      "AI-powered SEO backlinks that rank you on Google AND get cited by ChatGPT, Claude, and Perplexity.",
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
