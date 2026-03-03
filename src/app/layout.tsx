import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Анализатор курсов — Сравнение с Product Lab",
  description: "Профессиональный инструмент для анализа и сравнения образовательных курсов с Product Lab. Полный аудит программы, тарифов, преподавателей и маркетинга.",
  keywords: ["анализ курсов", "Product Lab", "образование", "сравнение курсов", "аудит курсов"],
  authors: [{ name: "Course Analyzer" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Анализатор курсов — Сравнение с Product Lab",
    description: "Профессиональный инструмент для анализа образовательных курсов",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
