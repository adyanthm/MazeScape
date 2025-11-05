import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "MazeScape - Tom & Jerry Maze Chase Game",
  description: "An exciting browser-based maze game where Jerry must collect cheese while escaping from Tom! Navigate through brick-walled mazes, race against time, and compete for the top score.",
  keywords: ["maze game", "tom and jerry", "browser game", "chase game", "puzzle game", "phaser game", "next.js game"],
  authors: [{ name: "MazeScape Team" }],
  openGraph: {
    title: "MazeScape - Tom & Jerry Maze Chase Game",
    description: "Navigate mazes, collect cheese, and escape from Tom in this thrilling browser game!",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
