import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/src/context/AuthContext";
import { QueryProvider } from "@/src/providers/QueryProvider";


export const metadata: Metadata = {
  title: "Duke's Restaurant POS",
  description: "Premium Restaurant Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased text-white bg-dukes-bg-main">
        <QueryProvider>
          <AuthProvider>
            <Toaster position="top-right" />
            {children}
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
