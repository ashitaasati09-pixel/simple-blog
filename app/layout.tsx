import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SimpleBlog",
  description: "A place for real voices.",
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
          background: "#fafafa",
          fontFamily: "'Segoe UI', sans-serif",
        }}
      >
        {children}
      </body>
    </html>
  );
}