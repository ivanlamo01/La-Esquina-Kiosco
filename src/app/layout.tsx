import type { Metadata } from "next";
import { Inter, Yellowtail } from "next/font/google"; // Switch to Inter
import "./globals.css";
import { AuthProvider } from "./Context/AuthContext";
import { CartProvider } from "./Context/CartContext";
import { SidebarProvider } from "./Context/SidebarContext";
import { Providers } from "./Components/Providers";
import AppShell from "./Components/AppShell";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const graffiti = Yellowtail({
  weight: "400",
  variable: "--font-graffiti",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "La Esquina Kiosco",
  description: "Sistema de gestión de inventario y ventas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${graffiti.variable} antialiased font-sans`}
      >
        <Providers>
          <AuthProvider>
            <CartProvider>
              <SidebarProvider>
                <AppShell>
                  {children}
                </AppShell>
              </SidebarProvider>
            </CartProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
