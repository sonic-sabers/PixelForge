import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "PixelForge - AI Image Cutouts",
  description:
    "Remove backgrounds and flip images instantly. Get polished transparent PNGs with one click.",
  applicationName: "PixelForge",
  keywords: [
    "image cutout",
    "remove background",
    "transparent png",
    "image editor",
    "ai image",
  ],
  authors: [{ name: "PixelForge" }],
  creator: "PixelForge",
  publisher: "PixelForge",
  metadataBase: new URL("https://pixelforge.app"),
  openGraph: {
    title: "PixelForge - AI Image Cutouts",
    description:
      "Remove backgrounds and flip images instantly. Get polished transparent PNGs with one click.",
    type: "website",
    locale: "en_US",
    siteName: "PixelForge",
  },
  twitter: {
    card: "summary_large_image",
    title: "PixelForge - AI Image Cutouts",
    description:
      "Remove backgrounds and flip images instantly. Get polished transparent PNGs with one click.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="antialiased font-sans">
      <body className="flex min-h-dvh flex-col">
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
