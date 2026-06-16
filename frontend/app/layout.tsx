import type { Metadata } from "next";
import { Hanken_Grotesk, Newsreader } from "next/font/google";
import "./globals.css";

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "MindNest — AI Study Companion",
  description:
    "Upload documents, ask questions, generate flashcards, quizzes, and mind maps with MindNest.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${hanken.variable} ${newsreader.variable} h-full`}
    >
      <body className="h-full font-sans bg-mn-bg text-mn-text-1 antialiased">
        {children}
      </body>
    </html>
  );
}
