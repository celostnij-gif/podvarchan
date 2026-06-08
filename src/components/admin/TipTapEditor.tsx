'use client'

/**
 * WYSIWYG редактор на базі TipTap для контенту блогу.
 * Підтримує форматування, заголовки, списки, посилання, код та зображення.
 */

import { useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import LinkExtension from '@tiptap/extension-link'
import ImageExtension from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
/* eslint-disable jsx-a11y/alt-text */
import {
  Bold,
  Italic,
  Strikethrough,
  Heading2,
  Heading3,
  Heading4,
  Quote,
  List,
  ListOrdered,
  Code,
  Link,
  Image,
  Undo,
  Redo,
  Pilcrow,
} from 'lucide-react'

/* ═══════════════════════════════════════
   Types
   ═══════════════════════════════════════ */

export interface TipTapEditorProps {
  content: string
  onChange: (json: string, html: string) => void
  placeholder?: string
  editable?: boolean
}

/* ═══════════════════════════════════════
   Toolbar button
   ═══════════════════════════════════════ */

function ToolbarButton({
  onClick,
  active,
  disabled,
  children,
  label,
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  children: React.ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`p-1.5 rounded-md transition-all duration-150 ${
        active
          ? 'bg-gold/15 text-gold'
          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
      } disabled:opacity-30 disabled:cursor-not-allowed`}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  )
}

/* ═══════════════════════════════════════
   Separator
   ═══════════════════════════════════════ */

function ToolbarSeparator() {
  return <div className="w-px h-5 bg-zinc-800/60 mx-0.5 shrink-0" />
}

/* ═══════════════════════════════════════
   Editor component
   ═══════════════════════════════════════ */

export default function TipTapEditor({
  content,
  onChange,
  placeholder = 'Начните писать…',
  editable = true,
}: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3, 4],
        },
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-gold underline hover:text-gold-light underline-offset-2',
        },
      }),
      ImageExtension.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor: ed }) => {
      const json = JSON.stringify(ed.getJSON())
      const html = ed.getHTML()
      onChange(json, html)
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[300px] px-4 py-3 text-zinc-200 text-sm leading-relaxed',
      },
    },
  })

  // ── Link handler ──
  const handleSetLink = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('Введите URL:', previousUrl ?? '')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  // ── Image handler ──
  const handleSetImage = useCallback(() => {
    if (!editor) return
    const url = window.prompt('Введите URL изображения:')
    if (!url) return
    editor.chain().focus().setImage({ src: url }).run()
  }, [editor])

  if (!editor) {
    return (
      <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 min-h-[350px] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-zinc-600 border-t-gold rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-2 border-b border-zinc-800/50 bg-zinc-900/50">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          label="Жирный"
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          label="Курсив"
        >
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          label="Зачеркнутый"
        >
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarSeparator />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          label="Заголовок H2"
        >
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          label="Заголовок H3"
        >
          <Heading3 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
          active={editor.isActive('heading', { level: 4 })}
          label="Заголовок H4"
        >
          <Heading4 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setParagraph().run()}
          active={editor.isActive('paragraph')}
          label="Параграф"
        >
          <Pilcrow className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarSeparator />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          label="Маркированный список"
        >
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          label="Нумерованный список"
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          label="Цитата"
        >
          <Quote className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive('codeBlock')}
          label="Блок кода"
        >
          <Code className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarSeparator />

        <ToolbarButton onClick={handleSetLink} active={editor.isActive('link')} label="Ссылка">
          <Link className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={handleSetImage} label="Изображение">
          <Image className="w-4 h-4" />
        </ToolbarButton>

        <div className="flex-1" />

        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} label="Отменить">
          <Undo className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} label="Повторить">
          <Redo className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Editor content */}
      <EditorContent editor={editor} />
    </div>
  )
}
