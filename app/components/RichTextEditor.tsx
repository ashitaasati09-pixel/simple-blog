"use client";
import { useState, useRef } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import type { NodeViewRendererProps } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle, Color, FontFamily, FontSize } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react";

// Image extension with a hover delete (X) button so individual images can be removed
const CustomImage = Image.extend({
  addNodeView() {
    return (props: NodeViewRendererProps) => {
      const { node, getPos, editor } = props;

      const wrapper = document.createElement("div");
      wrapper.style.position = "relative";
      wrapper.style.display = "inline-block";
      wrapper.style.maxWidth = "100%";
      wrapper.style.margin = "12px 0";

      const img = document.createElement("img");
      img.src = node.attrs.src;
      if (node.attrs.alt) img.alt = node.attrs.alt;
      img.style.maxWidth = "100%";
      img.style.borderRadius = "8px";
      img.style.display = "block";
      wrapper.appendChild(img);

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.textContent = "✕";
      removeBtn.title = "Remove image";
      removeBtn.style.cssText =
        "position:absolute;top:8px;right:8px;width:28px;height:28px;border-radius:50%;" +
        "background:rgba(0,0,0,0.65);color:#fff;border:none;cursor:pointer;font-size:14px;" +
        "display:none;align-items:center;justify-content:center;line-height:1;";

      wrapper.addEventListener("mouseenter", () => { removeBtn.style.display = "flex"; });
      wrapper.addEventListener("mouseleave", () => { removeBtn.style.display = "none"; });

      removeBtn.addEventListener("click", (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (typeof getPos === "function") {
          const pos = getPos();
          if (typeof pos === "number") {
            editor.chain().focus().deleteRange({ from: pos, to: pos + node.nodeSize }).run();
          }
        }
      });

      wrapper.appendChild(removeBtn);
      return { dom: wrapper };
    };
  },
});

const FONT_FAMILIES = [
  { label: "Default", value: "" },
  { label: "Segoe UI", value: "'Segoe UI', sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times New Roman", value: "'Times New Roman', serif" },
  { label: "Courier New", value: "'Courier New', monospace" },
  { label: "Comic Sans MS", value: "'Comic Sans MS', cursive" },
  { label: "Verdana", value: "Verdana, sans-serif" },
  { label: "Trebuchet MS", value: "'Trebuchet MS', sans-serif" },
];

const FONT_SIZES = ["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px", "40px", "48px"];

const TEXT_COLORS = [
  "#111111", "#374151", "#6b7280", "#9ca3af",
  "#ef4444", "#f97316", "#f59e0b", "#eab308",
  "#84cc16", "#22c55e", "#10b981", "#14b8a6",
  "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1",
  "#8b5cf6", "#a855f7", "#d946ef", "#ec4899",
  "#f43f5e", "#78350f", "#1e293b", "#7c2d12",
];

function ToolbarButton({
  onClick, active, children, title,
}: { onClick: () => void; active?: boolean; children: React.ReactNode; title: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        padding: "6px 10px",
        border: "1px solid " + (active ? "#f97316" : "#e5e7eb"),
        borderRadius: 6,
        background: active ? "#fff7ed" : "#fff",
        color: active ? "#f97316" : "#374151",
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "inherit",
        lineHeight: 1,
      }}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor | null }) {
  const [showEmoji, setShowEmoji] = useState(false);
  const [showColors, setShowColors] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!editor) return null;

  function addEmoji(emojiData: EmojiClickData) {
    editor?.chain().focus().insertContent(emojiData.emoji).run();
    setShowEmoji(false);
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/upload-image", { method: "POST", body: formData });
      const data = await res.json();

      if (data.url) {
        editor?.chain().focus().setImage({ src: data.url }).run();
      } else {
        alert(data.error || "Image upload failed.");
      }
    } catch {
      alert("Image upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div
      style={{
        display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center",
        padding: "10px 12px", border: "1px solid #e5e7eb", borderBottom: "none",
        borderRadius: "10px 10px 0 0", background: "#f9fafb", position: "relative",
      }}
    >
      <ToolbarButton title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <strong>B</strong>
      </ToolbarButton>
      <ToolbarButton title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <em>I</em>
      </ToolbarButton>
      <ToolbarButton title="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <u>U</u>
      </ToolbarButton>
      <ToolbarButton title="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <s>S</s>
      </ToolbarButton>

      <div style={{ width: 1, height: 22, background: "#e5e7eb", margin: "0 2px" }} />

      <ToolbarButton title="Heading 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>H1</ToolbarButton>
      <ToolbarButton title="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</ToolbarButton>
      <ToolbarButton title="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>• List</ToolbarButton>
      <ToolbarButton title="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. List</ToolbarButton>
      <ToolbarButton title="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>&ldquo;&rdquo;</ToolbarButton>

      <div style={{ width: 1, height: 22, background: "#e5e7eb", margin: "0 2px" }} />

      <select
        onChange={(e) => {
          const val = e.target.value;
          if (val) editor.chain().focus().setFontFamily(val).run();
          else editor.chain().focus().unsetFontFamily().run();
        }}
        style={{ padding: "6px 8px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 12, fontFamily: "inherit", background: "#fff", color: "#374151", cursor: "pointer" }}
        defaultValue=""
      >
        {FONT_FAMILIES.map((f) => <option key={f.label} value={f.value}>{f.label}</option>)}
      </select>

      <select
        onChange={(e) => {
          const val = e.target.value;
          if (val) editor.chain().focus().setFontSize(val).run();
          else editor.chain().focus().unsetFontSize().run();
        }}
        style={{ padding: "6px 8px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 12, fontFamily: "inherit", background: "#fff", color: "#374151", cursor: "pointer" }}
        defaultValue=""
      >
        <option value="">Size</option>
        {FONT_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>

      <div style={{ position: "relative" }}>
        <ToolbarButton title="Text color" onClick={() => setShowColors(!showColors)}>
          ✏️ Color
        </ToolbarButton>
        {showColors && (
          <div style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 50,
            background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8,
            padding: 12, display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)", width: 220,
          }}>
            {TEXT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                title={c}
                onClick={() => { editor.chain().focus().setColor(c).run(); setShowColors(false); }}
                style={{ width: 26, height: 26, borderRadius: "50%", background: c, border: "2px solid #fff", outline: "1px solid #e5e7eb", cursor: "pointer" }}
              />
            ))}
            <button
              type="button"
              onClick={() => { editor.chain().focus().unsetColor().run(); setShowColors(false); }}
              style={{
                gridColumn: "1 / -1", marginTop: 4, padding: "6px", fontSize: 11, fontWeight: 600,
                border: "1px solid #e5e7eb", borderRadius: 6, background: "#f9fafb", color: "#6b7280", cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Reset color
            </button>
          </div>
        )}
      </div>

      <div style={{ width: 1, height: 22, background: "#e5e7eb", margin: "0 2px" }} />

      <ToolbarButton title="Align left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}>⬅</ToolbarButton>
      <ToolbarButton title="Align center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}>⬌</ToolbarButton>
      <ToolbarButton title="Align right" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}>➡</ToolbarButton>

      <div style={{ width: 1, height: 22, background: "#e5e7eb", margin: "0 2px" }} />

      <ToolbarButton title="Insert image" onClick={() => fileInputRef.current?.click()}>
        {uploading ? "..." : "🖼️"}
      </ToolbarButton>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} style={{ display: "none" }} />

      <div style={{ position: "relative" }}>
        <ToolbarButton title="Insert emoji" onClick={() => setShowEmoji(!showEmoji)}>😊</ToolbarButton>
        {showEmoji && (
          <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 50 }}>
            <EmojiPicker onEmojiClick={addEmoji} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder,
}: {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      Underline,
      CustomImage,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: placeholder || "Start writing your story..." }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        style: "min-height: 320px; padding: 16px; font-size: 15px; line-height: 1.7; outline: none;",
      },
    },
  });

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "visible" }}>
      <Toolbar editor={editor} />
      <div style={{ border: "1px solid #e5e7eb", borderTop: "none", borderRadius: "0 0 10px 10px", background: "#fff" }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}