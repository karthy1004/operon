import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter, Fraunces, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "variable",
  style: ["normal", "italic"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Operon — Career Operations",
  description: "You own your career. We own the execution.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#2b5d4c",
          colorBackground: "#f5f3ec",
          colorForeground: "#1c2320",
          colorMutedForeground: "#4b534e",
          colorInput: "#ffffff",
          colorInputForeground: "#1c2320",
          fontFamily: "var(--font-sans)",
        },
      }}
    >
      <html
        lang="en"
        className={`${inter.variable} ${fraunces.variable} ${ibmPlexMono.variable} h-full antialiased`}
      >
        <body
          className="min-h-full flex flex-col font-sans"
          suppressHydrationWarning
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
