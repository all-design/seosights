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
  title: "seosights — Get Customers from Google & AI | SEO · AEO · GEO",
  description:
    "seosights writes, audits, and auto-executes SEO strategies proven to rank on Google AND get cited by ChatGPT, Claude, and Perplexity. All while you sleep.",
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
  ],
  authors: [{ name: "seosights" }],
  icons: {
    icon: "/logo-transparent.png",
  },
  openGraph: {
    title: "seosights — Get Customers from Google & AI",
    description:
      "8 AI agents audit, strategize, and auto-execute your SEO — ranking you on Google AND getting you cited by AI. All while you sleep.",
    url: "https://seosights.com",
    siteName: "seosights",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "seosights — Get Customers from Google & AI",
    description:
      "8 AI agents audit, strategize, and auto-execute your SEO — ranking you on Google AND getting you cited by AI. All while you sleep.",
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
