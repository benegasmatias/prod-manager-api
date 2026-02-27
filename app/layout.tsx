import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast'
import { NegocioProvider } from '@/src/context/NegocioContext'
import { ThemeProvider } from '@/src/context/ThemeContext'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ProdManager Pro",
  description: "Gestión de Producción Multi-Negocio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <NegocioProvider>
            {children}
            <Toaster position="top-right" />
          </NegocioProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
