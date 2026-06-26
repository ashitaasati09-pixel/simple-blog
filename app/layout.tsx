import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SimpleBlog",
  description: "A simple blogging platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          fontFamily: "'Segoe UI', sans-serif",
          background: "#f9fafb",
          minHeight: "100vh",
        }}
      >
        {children}
      </body>
    </html>
  );
}