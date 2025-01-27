"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import TextStyle from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import MathExtension from "@aarkue/tiptap-math-extension";
import "katex/dist/katex.min.css";

import {
  LuBold,
  LuStrikethrough,
  LuItalic,
  LuList,
  LuListOrdered,
  LuHeading1,
  LuHeading2,
  LuHeading3,
  LuUndo,
  LuRedo,
  LuUnderline,
  LuAlignLeft,
  LuAlignCenter,
  LuAlignJustify,
} from "react-icons/lu";

import { cn } from "~/lib/utils";
import { Button } from "./ui/button";

export default function Editor({
  isEdit,
  content,
  onContentChange,
  className,
  ...props
}: {
  isEdit?: boolean;
  content: string;
  className?: React.HTMLAttributes<HTMLDivElement>;
  onContentChange?: (content: string) => void;
} & React.HTMLAttributes<HTMLDivElement>) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      MathExtension.configure({
        evaluation: false,
        katexOptions: { macros: { "\\B": "\\mathbb{B}" } },
        delimiters: "dollar",
      }),
      Underline,
      TextStyle,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Highlight.configure({ multicolor: true }),
    ],
    content: content,
    editable: isEdit ?? false,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const updatedContent = editor.getHTML().replace(/<p>\s*<\/p>$/, "");
      onContentChange?.(updatedContent);
    },
  });

  return (
    <div
      className={cn("flex h-full w-full flex-col rounded-lg border", className)}
      {...props}
    >
      <div
        className={`flex h-9 flex-row overflow-auto border-b scrollbar scrollbar-none ${!isEdit && "hidden"}`}
      >
        <Button
          className="h-full w-9 rounded-none border-r"
          type="button"
          onClick={() => {
            editor.chain().focus().undo().run();
          }}
          variant={editor?.isActive("undo") ? "default" : "ghost"}
        >
          <LuUndo className="size-5 flex-shrink-0" />
        </Button>
        <Button
          className="h-full w-9 rounded-none border-r"
          type="button"
          onClick={() => {
            editor.chain().focus().redo().run();
          }}
          variant={editor?.isActive("redo") ? "default" : "ghost"}
        >
          <LuRedo className="size-5 flex-shrink-0" />
        </Button>
        <Button
          className="h-full w-9 rounded-none border-r"
          type="button"
          onClick={() => {
            editor.chain().focus().toggleBold().run();
          }}
          variant={editor?.isActive("bold") ? "default" : "ghost"}
        >
          <LuBold className="size-5 flex-shrink-0" />
        </Button>
        <Button
          className="h-full w-9 rounded-none border-r"
          type="button"
          onClick={() => {
            editor.chain().focus().toggleItalic().run();
          }}
          variant={editor?.isActive("italic") ? "default" : "ghost"}
        >
          <LuItalic className="size-5 flex-shrink-0" />
        </Button>
        <Button
          className="h-full w-9 rounded-none border-r"
          type="button"
          onClick={() => {
            editor.chain().focus().toggleStrike().run();
          }}
          variant={editor?.isActive("strike") ? "default" : "ghost"}
        >
          <LuStrikethrough className="size-5 flex-shrink-0" />
        </Button>
        <Button
          className="h-full w-9 rounded-none border-r"
          type="button"
          onClick={() => {
            editor.chain().focus().toggleUnderline().run();
          }}
          variant={editor?.isActive("underline") ? "default" : "ghost"}
        >
          <LuUnderline className="size-5 flex-shrink-0" />
        </Button>
        <Button
          className="h-full w-9 rounded-none border-r"
          type="button"
          onClick={() => {
            editor.chain().focus().setTextAlign("left").run();
          }}
          variant={
            editor?.isActive({ textAlign: "left" }) ? "default" : "ghost"
          }
        >
          <LuAlignLeft className="size-5 flex-shrink-0" />
        </Button>
        <Button
          className="h-full w-9 rounded-none border-r"
          type="button"
          onClick={() => {
            editor.chain().focus().setTextAlign("center").run();
          }}
          variant={
            editor?.isActive({ textAlign: "center" }) ? "default" : "ghost"
          }
        >
          <LuAlignCenter className="size-5 flex-shrink-0" />
        </Button>
        <Button
          className="h-full w-9 rounded-none border-r"
          type="button"
          onClick={() => {
            editor.chain().focus().setTextAlign("right").run();
          }}
          variant={
            editor?.isActive({ textAlign: "right" }) ? "default" : "ghost"
          }
        >
          <LuAlignLeft className="size-5 flex-shrink-0" />
        </Button>
        <Button
          className="h-full w-9 rounded-none border-r"
          type="button"
          onClick={() => {
            editor.chain().focus().setTextAlign("justify").run();
          }}
          variant={
            editor?.isActive({ textAlign: "justify" }) ? "default" : "ghost"
          }
        >
          <LuAlignJustify className="size-5 flex-shrink-0" />
        </Button>
        <Button
          className="h-full w-9 rounded-none border-r"
          type="button"
          onClick={() => {
            editor.chain().focus().toggleHeading({ level: 1 }).run();
          }}
          variant={
            editor?.isActive("heading", { level: 1 }) ? "default" : "ghost"
          }
        >
          <LuHeading1 className="size-5 flex-shrink-0" />
        </Button>
        <Button
          className="h-full w-9 rounded-none border-r"
          type="button"
          onClick={() => {
            editor.chain().focus().toggleHeading({ level: 2 }).run();
          }}
          variant={
            editor?.isActive("heading", { level: 2 }) ? "default" : "ghost"
          }
        >
          <LuHeading2 className="size-5 flex-shrink-0" />
        </Button>
        <Button
          className="h-full w-9 rounded-none border-r"
          type="button"
          onClick={() => {
            editor.chain().focus().toggleHeading({ level: 3 }).run();
          }}
          variant={
            editor?.isActive("heading", { level: 3 }) ? "default" : "ghost"
          }
        >
          <LuHeading3 className="size-5 flex-shrink-0" />
        </Button>
        <Button
          className="h-full w-9 rounded-none border-r"
          type="button"
          onClick={() => {
            editor.chain().focus().toggleBulletList().run();
          }}
          variant={editor?.isActive("bulletList") ? "default" : "ghost"}
        >
          <LuList className="size-5 flex-shrink-0" />
        </Button>
        <Button
          className="h-full w-9 rounded-none border-r"
          type="button"
          onClick={() => {
            editor.chain().focus().toggleOrderedList().run();
          }}
          variant={editor?.isActive("orderedList") ? "default" : "ghost"}
        >
          <LuListOrdered className="size-5 flex-shrink-0" />
        </Button>
      </div>
      <EditorContent editor={editor} className="p-2"></EditorContent>
    </div>
  );
}
