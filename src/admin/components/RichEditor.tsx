import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit                   from '@tiptap/starter-kit'
import Image                        from '@tiptap/extension-image'
import Link                         from '@tiptap/extension-link'
import Placeholder                  from '@tiptap/extension-placeholder'
import CharacterCount               from '@tiptap/extension-character-count'
import { useEffect, useRef }        from 'react'
import { supabase }                 from '@/lib/supabase'
import toast                        from 'react-hot-toast'
import {
  Bold, Italic, Heading2, Heading3, List, ListOrdered,
  Quote, Minus, ImageIcon, Link as LinkIcon, Undo, Redo, Upload
} from 'lucide-react'

interface Props {
  value:    string
  onChange: (val: string) => void
}

function ToolBtn({ onClick, active, title, children }: {
  onClick: () => void; active?: boolean; title: string; children: React.ReactNode
}) {
  return (
    <button type="button" onClick={onClick} title={title}
      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all text-sm
        ${active ? 'bg-navy text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}>
      {children}
    </button>
  )
}

export default function RichEditor({ value, onChange }: Props) {
  const fileRef   = useRef<HTMLInputElement>(null)
  const uploading = useRef(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: false }),
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder: 'Rédigez votre article ici…' }),
      CharacterCount,
    ],
    content:     value,
    onUpdate:    ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[320px] outline-none p-4 text-gray-800 leading-relaxed',
      },
    },
  })

  /* Sync value externe → éditeur */
  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    if (value !== current) {
      editor.commands.setContent(value || '')
    }
  }, [value, editor])

  if (!editor) return null

  /* Upload image */
  const uploadImg = async (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Image requise'); return }
    if (file.size > 5 * 1024 * 1024)    { toast.error('Max 5MB'); return }
    if (uploading.current) return
    uploading.current = true
    const tid = toast.loading('Upload en cours…')
    try {
      const ext  = file.name.split('.').pop()
      const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('blog-images').upload(name, file)
      if (error) throw error
      const { data } = supabase.storage.from('blog-images').getPublicUrl(name)
      editor.chain().focus().setImage({ src: data.publicUrl }).run()
      toast.success('Image insérée !', { id: tid })
    } catch (e: any) {
      toast.error(e.message || 'Erreur upload', { id: tid })
    } finally {
      uploading.current = false
    }
  }

  const addLink = () => {
    const url = window.prompt('URL du lien :')
    if (url) editor.chain().focus().setLink({ href: url }).run()
  }

  const words = editor.storage.characterCount?.words() ?? 0
  const chars = editor.storage.characterCount?.characters() ?? 0

  return (
    <div className="border-2 border-gray-200 rounded-2xl overflow-hidden focus-within:border-navy transition-colors">

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 bg-gray-50 border-b border-gray-200">

        {/* Historique */}
        <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="Annuler"><Undo size={14}/></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="Rétablir"><Redo size={14}/></ToolBtn>

        <div className="w-px h-5 bg-gray-300 mx-1"/>

        {/* Titres */}
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })} title="Titre H2">
          <Heading2 size={14}/>
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })} title="Titre H3">
          <Heading3 size={14}/>
        </ToolBtn>

        <div className="w-px h-5 bg-gray-300 mx-1"/>

        {/* Formatage */}
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')} title="Gras">
          <Bold size={14}/>
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')} title="Italique">
          <Italic size={14}/>
        </ToolBtn>

        <div className="w-px h-5 bg-gray-300 mx-1"/>

        {/* Listes */}
        <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')} title="Liste à puces">
          <List size={14}/>
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')} title="Liste numérotée">
          <ListOrdered size={14}/>
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')} title="Citation">
          <Quote size={14}/>
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Séparateur">
          <Minus size={14}/>
        </ToolBtn>

        <div className="w-px h-5 bg-gray-300 mx-1"/>

        {/* Lien & Image */}
        <ToolBtn onClick={addLink} active={editor.isActive('link')} title="Ajouter un lien">
          <LinkIcon size={14}/>
        </ToolBtn>
        <ToolBtn onClick={() => fileRef.current?.click()} title="Insérer une image">
          <ImageIcon size={14}/>
        </ToolBtn>
        <ToolBtn onClick={() => {
          const url = window.prompt('URL de l\'image :')
          if (url) editor.chain().focus().setImage({ src: url }).run()
        }} title="Image par URL">
          <Upload size={14}/>
        </ToolBtn>
      </div>

      {/* Zone d'écriture */}
      <div className="bg-white min-h-[320px] cursor-text" onClick={() => editor.commands.focus()}>
        <EditorContent editor={editor}/>
      </div>

      {/* Stats */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex gap-4 text-xs text-gray-400">
        <span>{words} mots</span>
        <span>{chars} caractères</span>
        <span>~{Math.max(1, Math.round(words / 200))} min de lecture</span>
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) uploadImg(f) }}/>
    </div>
  )
}