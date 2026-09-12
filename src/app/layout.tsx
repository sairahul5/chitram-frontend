import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Chitram | Visual discovery",
  description: "India's visual discovery platform.",
  icons: {
    icon: {
      url: "/icon.png?v=2",
      type: "image/png",
      sizes: "6250x6250",
    },
    shortcut: "/icon.png?v=2",
    apple: "/icon.png?v=2",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={plusJakarta.variable}>
      <body className="min-h-screen bg-[#f5f1e9] text-[#1f2925] font-sans antialiased selection:bg-[#d2643b]/20 selection:text-[#1f2925]">
        {children}
      </body>
    </html>
  );
}
