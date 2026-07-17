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
    statusBarStyle: "black-translucent",
    title: "LIFT",
  },
};

export const viewport: Viewport = {
  themeColor: "#13110c",
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
      <body className="min-h-full">
        <Boot />
        <main className="relative z-[1] mx-auto min-h-screen w-full max-w-[440px] px-[18px] pb-[132px] pt-[22px] no-scrollbar">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
