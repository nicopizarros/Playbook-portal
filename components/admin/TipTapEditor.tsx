'use client';

import { useCallback, useRef } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import { upload } from '@vercel/blob/client';
import { TIPTAP_EXTENSIONS } from '@/lib/tiptap-extensions';

type Props = {
  content: Record<string, unknown> | null;
  onChange: (json: Record<string, unknown>) => void;
};

async function uploadImageFile(editor: Editor, file: File) {
  if (!file.type.startsWith('image/')) return;
  try {
    const blob = await upload(file.name, file, {
      access: 'public',
      handleUploadUrl: '/api/admin/upload-image',
    });
    editor.chain().focus().setImage({ src: blob.url, alt: file.name }).run();
  } catch (err) {
    console.error('[TipTapEditor] image upload failed:', err);
  }
}

function ToolbarButton({
  label,
  onClick,
  isActive,
}: {
  label: string;
  onClick: () => void;
  isActive?: boolean;
}) {
  return (
    <button
      type="button"
      className={`btn-mini${isActive ? ' is-active' : ''}`}
      onMouseDown={e => e.preventDefault()}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export function TipTapEditor({ content, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: TIPTAP_EXTENSIONS,
    content: content && Object.keys(content).length ? content : { type: 'doc', content: [{ type: 'paragraph' }] },
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getJSON()),
    editorProps: {
      handleDrop: (_view, event) => {
        const file = event.dataTransfer?.files?.[0];
        if (!file || !file.type.startsWith('image/')) return false;
        event.preventDefault();
        void uploadImageFile(editor!, file);
        return true;
      },
      handlePaste: (_view, event) => {
        const file = Array.from(event.clipboardData?.items || [])
          .map(item => item.getAsFile())
          .find((f): f is File => !!f && f.type.startsWith('image/'));
        if (!file) return false;
        void uploadImageFile(editor!, file);
        return true;
      },
    },
  });

  const pickImageFile = useCallback(() => fileInputRef.current?.click(), []);

  const onFileSelected = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (editor && file) void uploadImageFile(editor, file);
    },
    [editor],
  );

  const setLink = useCallback(() => {
    if (!editor) return;
    const previous = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Enlace', previous || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="tiptap-editor">
      <div className="tiptap-toolbar">
        <ToolbarButton label="B" isActive={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} />
        <ToolbarButton label="I" isActive={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} />
        <ToolbarButton label="H2" isActive={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
        <ToolbarButton label="H3" isActive={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} />
        <ToolbarButton label="Lista" isActive={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} />
        <ToolbarButton label="1. Lista" isActive={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
        <ToolbarButton label="Cita" isActive={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
        <ToolbarButton label="Enlace" isActive={editor.isActive('link')} onClick={setLink} />
        <ToolbarButton label="Imagen" onClick={pickImageFile} />
        <ToolbarButton label="Deshacer" onClick={() => editor.chain().focus().undo().run()} />
        <ToolbarButton label="Rehacer" onClick={() => editor.chain().focus().redo().run()} />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onFileSelected}
          style={{ display: 'none' }}
        />
      </div>
      <EditorContent editor={editor} className="tiptap-content" />
    </div>
  );
}
