'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import LinkExtension from '@tiptap/extension-link'
import ImageExtension from '@tiptap/extension-image'
import { useEffect, useState } from 'react'
import { MediaPickerDialog } from '@/components/admin/media/MediaPickerDialog'

const ToolBtn = ({ action, label, isActive }: { action: () => void; label: string; isActive?: boolean }) => (
  <button
    type="button"
    onClick={action}
    className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
      isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
    }`}
  >
    {label}
  </button>
)

interface Props {
  value: string
  onChange: (html: string, json: string) => void
  placeholder?: string
}

export function TipTapEditor({ value, onChange, placeholder }: Props) {
  const [showMediaPicker, setShowMediaPicker] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: placeholder ?? 'Введіть текст...' }),
      LinkExtension.configure({ openOnClick: false }),
      ImageExtension,
    ],
    content: value || '<p></p>',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML(), JSON.stringify(editor.getJSON()))
    },
  })

  useEffect(() => {
    if (editor && value && editor.getHTML() !== value) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  const insertImage = (url: string) => {
    editor?.chain().focus().setImage({ src: url }).run()
  }

  if (!editor) return null

  return (
    <>
      <div className="rounded-md border border-gray-300">
        <div className="flex flex-wrap gap-1 border-b bg-gray-50 px-2 py-1.5">
          <ToolBtn action={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} label="H2"
            isActive={editor.isActive('heading', { level: 2 })} />
          <ToolBtn action={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} label="H3"
            isActive={editor.isActive('heading', { level: 3 })} />
          <ToolBtn action={() => editor.chain().focus().toggleBold().run()} label="B"
            isActive={editor.isActive('bold')} />
          <ToolBtn action={() => editor.chain().focus().toggleItalic().run()} label="I"
            isActive={editor.isActive('italic')} />
          <ToolBtn action={() => editor.chain().focus().toggleBulletList().run()} label="UL"
            isActive={editor.isActive('bulletList')} />
          <ToolBtn action={() => editor.chain().focus().toggleOrderedList().run()} label="OL"
            isActive={editor.isActive('orderedList')} />
          <ToolBtn action={() => editor.chain().focus().toggleBlockquote().run()} label="Quote"
            isActive={editor.isActive('blockquote')} />
          <ToolBtn action={() => editor.chain().focus().toggleCodeBlock().run()} label="Code"
            isActive={editor.isActive('codeBlock')} />
          <span className="mx-1 w-px bg-gray-300" />
          <ToolBtn action={() => setShowMediaPicker(true)} label="🖼"
            isActive={editor.isActive('image')} />
        </div>
        <EditorContent editor={editor} className="prose prose-sm max-w-none px-3 py-2 min-h-[300px] focus:outline-none" />
      </div>
      <MediaPickerDialog
        open={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={(asset) => {
          if (asset.publicUrl) insertImage(asset.publicUrl)
          setShowMediaPicker(false)
        }}
      />
    </>
  )
}
