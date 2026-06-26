"use client";

// Renders saved HTML content (from the rich text editor) safely with
// matching styles for headings, lists, quotes, images, and inline marks.
export default function RichContentDisplay({ html }: { html: string }) {
  return (
    <>
      <style>{`
        .rich-content h1 { font-size: 28px; font-weight: 800; margin: 20px 0 10px; color: #111; }
        .rich-content h2 { font-size: 22px; font-weight: 800; margin: 18px 0 8px; color: #111; }
        .rich-content h3 { font-size: 18px; font-weight: 700; margin: 16px 0 6px; color: #111; }
        .rich-content p { margin: 0 0 14px; line-height: 1.75; color: #1f2937; }
        .rich-content ul, .rich-content ol { margin: 0 0 14px; padding-left: 24px; line-height: 1.75; }
        .rich-content blockquote { border-left: 3px solid #f97316; margin: 16px 0; padding: 4px 0 4px 16px; color: #6b7280; font-style: italic; }
        .rich-content img { max-width: 100%; border-radius: 8px; margin: 14px 0; }
        .rich-content strong { font-weight: 700; }
        .rich-content em { font-style: italic; }
        .rich-content u { text-decoration: underline; }
        .rich-content s { text-decoration: line-through; }
        .rich-content a { color: #f97316; }
      `}</style>
      <div className="rich-content" dangerouslySetInnerHTML={{ __html: html }} />
    </>
  );
}