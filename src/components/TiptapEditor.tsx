"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { Extension } from "@tiptap/core";
import { useEffect, useState } from "react";

// Custom Indent Extension
const IndentExtension = Extension.create({
  name: "indent",

  addOptions() {
    return {
      types: ["paragraph", "heading"],
      minLevel: 0,
      maxLevel: 8,
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element) => {
              const level = element.getAttribute("data-indent");
              return level ? parseInt(level, 10) : 0;
            },
            renderHTML: (attributes) => {
              if (!attributes.indent) {
                return {};
              }
              return {
                "data-indent": attributes.indent,
                style: `margin-left: ${attributes.indent * 2}rem;`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      indent:
        () =>
        ({ tr, state, dispatch, editor }) => {
          const { selection } = state;
          const { from, to } = selection;

          state.doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              const currentIndent = node.attrs.indent || 0;
              if (currentIndent < this.options.maxLevel) {
                if (dispatch) {
                  tr.setNodeMarkup(pos, undefined, {
                    ...node.attrs,
                    indent: currentIndent + 1,
                  });
                }
              }
            }
          });

          return true;
        },
      outdent:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          const { from, to } = selection;

          state.doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              const currentIndent = node.attrs.indent || 0;
              if (currentIndent > this.options.minLevel) {
                if (dispatch) {
                  tr.setNodeMarkup(pos, undefined, {
                    ...node.attrs,
                    indent: currentIndent - 1,
                  });
                }
              }
            }
          });

          return true;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => this.editor.commands.indent(),
      "Shift-Tab": () => this.editor.commands.outdent(),
    };
  },
});

interface TiptapEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: number;
  defaultPreview?: boolean;
}

const TiptapEditor = ({
  value,
  onChange,
  placeholder,
  height = 200,
  defaultPreview = true,
}: TiptapEditorProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(defaultPreview);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      IndentExtension,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "focus:outline-none text-gray-900", // Explicit dark text color
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  if (!isMounted || !editor) {
    return (
      <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
        {/* Toolbar Skeleton */}
        <div className="border-b border-gray-300 p-3 bg-gray-100">
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="px-3 py-2 text-xs font-medium bg-gray-200 border border-gray-300 rounded animate-pulse"
                style={{ width: "32px", height: "32px" }}
              />
            ))}
          </div>
        </div>
        {/* Editor Skeleton */}
        <div className="relative">
          <div
            className="p-4 bg-gray-50 animate-pulse"
            style={{ minHeight: `${height}px` }}
          >
            <div className="text-gray-400">Loading editor...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="border-b border-gray-300 p-3 bg-gray-100">
        <div className="flex flex-wrap gap-2">
          {/* Preview/Edit Toggle Button - Always visible */}
          <button
            type="button"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className={`px-3 py-2 text-xs font-medium border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm ${
              isPreviewMode
                ? "bg-indigo-100 text-indigo-700 border-indigo-300"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
            title={
              isPreviewMode ? "Switch to Edit Mode" : "Switch to Preview Mode"
            }
          >
            {isPreviewMode ? "✏️ Edit" : "👁️ Preview"}
          </button>

          {/* Toolbar buttons - Hidden in preview mode */}
          {!isPreviewMode && (
            <>
              <div className="w-px h-6 bg-gray-400 mx-1"></div>

              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                disabled={!editor.can().chain().focus().toggleBold().run()}
                className={`px-3 py-2 text-xs font-medium border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm ${
                  editor.isActive("bold")
                    ? "bg-indigo-100 text-indigo-700 border-indigo-300"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
                title="Bold (Ctrl+B)"
              >
                <strong>B</strong>
              </button>

              <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                disabled={!editor.can().chain().focus().toggleItalic().run()}
                className={`px-3 py-2 text-xs font-medium border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm ${
                  editor.isActive("italic")
                    ? "bg-indigo-100 text-indigo-700 border-indigo-300"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
                title="Italic (Ctrl+I)"
              >
                <em>I</em>
              </button>

              <button
                type="button"
                onClick={() => editor.chain().focus().toggleStrike().run()}
                disabled={!editor.can().chain().focus().toggleStrike().run()}
                className={`px-3 py-2 text-xs font-medium border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm ${
                  editor.isActive("strike")
                    ? "bg-indigo-100 text-indigo-700 border-indigo-300"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
                title="Strikethrough"
              >
                <s>S</s>
              </button>

              <button
                type="button"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                disabled={!editor.can().chain().focus().toggleUnderline().run()}
                className={`px-3 py-2 text-xs font-medium border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm ${
                  editor.isActive("underline")
                    ? "bg-indigo-100 text-indigo-700 border-indigo-300"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
                title="Underline (Ctrl+U)"
              >
                <u>U</u>
              </button>

              <div className="w-px h-6 bg-gray-400 mx-1"></div>

              <button
                type="button"
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 1 }).run()
                }
                className={`px-3 py-2 text-xs font-medium border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm ${
                  editor.isActive("heading", { level: 1 })
                    ? "bg-indigo-100 text-indigo-700 border-indigo-300"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
                title="Heading 1"
              >
                H1
              </button>

              <button
                type="button"
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 2 }).run()
                }
                className={`px-3 py-2 text-xs font-medium border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm ${
                  editor.isActive("heading", { level: 2 })
                    ? "bg-indigo-100 text-indigo-700 border-indigo-300"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
                title="Heading 2"
              >
                H2
              </button>

              <button
                type="button"
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 3 }).run()
                }
                className={`px-3 py-2 text-xs font-medium border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm ${
                  editor.isActive("heading", { level: 3 })
                    ? "bg-indigo-100 text-indigo-700 border-indigo-300"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
                title="Heading 3"
              >
                H3
              </button>

              <button
                type="button"
                onClick={() => editor.chain().focus().setParagraph().run()}
                className={`px-3 py-2 text-xs font-medium border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm ${
                  editor.isActive("paragraph")
                    ? "bg-indigo-100 text-indigo-700 border-indigo-300"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
                title="Paragraph"
              >
                P
              </button>

              <div className="w-px h-6 bg-gray-400 mx-1"></div>

              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`px-3 py-2 text-xs font-medium border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm ${
                  editor.isActive("bulletList")
                    ? "bg-indigo-100 text-indigo-700 border-indigo-300"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
                title="Bullet List"
              >
                •
              </button>

              <div className="w-px h-6 bg-gray-400 mx-1"></div>

              {/* Indent More / Indent Less */}
              <button
                type="button"
                onClick={() => editor.chain().focus().outdent().run()}
                className="px-3 py-2 text-xs font-medium bg-white text-gray-700 border border-gray-400 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                title="Decrease Indent (Shift+Tab)"
              >
                ←
              </button>

              <button
                type="button"
                onClick={() => editor.chain().focus().indent().run()}
                className="px-3 py-2 text-xs font-medium bg-white text-gray-700 border border-gray-400 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                title="Increase Indent (Tab)"
              >
                →
              </button>

              <div className="w-px h-6 bg-gray-400 mx-1"></div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    editor.chain().focus().setTextAlign("left").run()
                  }
                  className={`px-2 py-2 text-xs font-medium border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm ${
                    editor.isActive({ textAlign: "left" })
                      ? "bg-indigo-100 text-indigo-700 border-indigo-300"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                  title="Align left"
                >
                  L
                </button>
                <button
                  type="button"
                  onClick={() =>
                    editor.chain().focus().setTextAlign("center").run()
                  }
                  className={`px-2 py-2 text-xs font-medium border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm ${
                    editor.isActive({ textAlign: "center" })
                      ? "bg-indigo-100 text-indigo-700 border-indigo-300"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                  title="Align center"
                >
                  C
                </button>
                <button
                  type="button"
                  onClick={() =>
                    editor.chain().focus().setTextAlign("right").run()
                  }
                  className={`px-2 py-2 text-xs font-medium border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm ${
                    editor.isActive({ textAlign: "right" })
                      ? "bg-indigo-100 text-indigo-700 border-indigo-300"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                  title="Align right"
                >
                  R
                </button>
                <button
                  type="button"
                  onClick={() =>
                    editor.chain().focus().setTextAlign("justify").run()
                  }
                  className={`px-2 py-2 text-xs font-medium border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm ${
                    editor.isActive({ textAlign: "justify" })
                      ? "bg-indigo-100 text-indigo-700 border-indigo-300"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                  title="Justify"
                >
                  J
                </button>
              </div>

              <button
                type="button"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`px-3 py-2 text-xs font-medium border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm ${
                  editor.isActive("orderedList")
                    ? "bg-indigo-100 text-indigo-700 border-indigo-300"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
                title="Numbered List"
              >
                1.
              </button>

              <button
                type="button"
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                className={`px-3 py-2 text-xs font-medium border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm ${
                  editor.isActive("codeBlock")
                    ? "bg-indigo-100 text-indigo-700 border-indigo-300"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
                title="Code Block"
              >
                {"</>"}
              </button>

              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={`px-3 py-2 text-xs font-medium border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm ${
                  editor.isActive("blockquote")
                    ? "bg-indigo-100 text-indigo-700 border-indigo-300"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
                title="Quote"
              >
                &quot;
              </button>

              <div className="w-px h-6 bg-gray-400 mx-1"></div>

              <button
                type="button"
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
                className="px-3 py-2 text-xs font-medium bg-white text-gray-700 border border-gray-400 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                title="Horizontal Line"
              >
                ―
              </button>

              <button
                type="button"
                onClick={() => editor.chain().focus().setHardBreak().run()}
                className="px-3 py-2 text-xs font-medium bg-white text-gray-700 border border-gray-400 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                title="Line Break"
              >
                ↵
              </button>

              <div className="w-px h-6 bg-gray-400 mx-1"></div>

              <button
                type="button"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().chain().focus().undo().run()}
                className="px-3 py-2 text-xs font-medium bg-white text-gray-700 border border-gray-400 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                title="Undo (Ctrl+Z)"
              >
                ↶
              </button>

              <button
                type="button"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().chain().focus().redo().run()}
                className="px-3 py-2 text-xs font-medium bg-white text-gray-700 border border-gray-400 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                title="Redo (Ctrl+Y)"
              >
                ↷
              </button>
            </>
          )}
        </div>
      </div>

      {/* Editor/Preview */}
      <div className="relative">
        <EditorContent
          editor={editor}
          className={`p-4 min-h-[200px] text-gray-900 border rounded-lg bg-white ${
            isPreviewMode ? "tiptap-preview-mode" : ""
          }`}
          style={{ minHeight: `${height}px` }}
        />
        {!value && !isPreviewMode && (
          <div className="absolute top-4 left-4 text-gray-400 pointer-events-none">
            {placeholder || "Start typing your content..."}
          </div>
        )}
      </div>
    </div>
  );
};

export default TiptapEditor;
