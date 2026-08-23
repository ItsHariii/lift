import type { Metadata, Viewport } from "next";
import { Anton, Archivo, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import Boot from "@/components/Boot";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: "400",
});

const mono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "LIFT",
  description: "Fast, offline gym weight tracker. Log sets, smash PRs.",
  applicationName: "LIFT",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    /*
     * NOT "black-translucent". That makes iOS size the standalone web view to
     * (screen height - status bar) but anchor it at y=0, leaving a dead strip
     * along the bottom that the page cannot paint or place anything in -- it
     * renders over the app. "black" makes iOS position the frame below the
     * status bar so its bottom meets the screen edge.
     */
    statusBarStyle: "black",
    title: "LIFT",
  },
};

export const viewport: Viewport = {
  /*
   * iOS paints the status bar strip itself in standalone, so this needs to
   * match the *top* of the page rather than --bg: the radial glow warms the
   * first ~60px to roughly this value. Using --bg leaves a visible flat band.
   */
  themeColor: "#1d160e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${anton.variable} ${archivo.variable} ${mono.variable} h-full`}
    >
      <body className="h-full overflow-hidden">
        <Boot />
        <div id="app-scroll" className="app-scroll no-scrollbar">
          <main className="app-shell relative z-[1] mx-auto w-full max-w-[440px]">
            {children}
          </main>
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
