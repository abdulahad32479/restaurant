import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

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
        <Toaster position="top-right" />
        {children}
      </body>
    </html>
  );
}
