'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyleKit } from '@tiptap/extension-text-style';
import Image from '@tiptap/extension-image';
import { Placeholder } from '@tiptap/extensions';
import { toast } from 'react-hot-toast';
import {
    AlignCenter, AlignJustify, AlignLeft, AlignRight, Baseline, Bold, Braces, ChevronDown, Image as ImageIcon, Italic,
    Link as LinkIcon, List, ListOrdered, LoaderCircle, Minus, Redo2, RemoveFormatting, Strikethrough, TextQuote,
    Underline, Undo2, Unlink,
} from 'lucide-react';
import { uploadAttachment } from '../api/emails.api';

// ─── choices (the same ones Gmail offers) ───────────────────────

export const FONTS: { label: string; value: string | null }[] = [
    { label: 'Sans Serif', value: null },
    { label: 'Serif', value: "Georgia, 'Times New Roman', serif" },
    { label: 'Fixed Width', value: "'Courier New', Courier, monospace" },
    { label: 'Wide', value: "'Arial Black', Arial, sans-serif" },
    { label: 'Narrow', value: "'Arial Narrow', Arial, sans-serif" },
    { label: 'Comic Sans MS', value: "'Comic Sans MS', 'Comic Sans', cursive" },
    { label: 'Garamond', value: "Garamond, Georgia, serif" },
    { label: 'Tahoma', value: 'Tahoma, Verdana, sans-serif' },
    { label: 'Trebuchet MS', value: "'Trebuchet MS', Helvetica, sans-serif" },
    { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
];

const SIZES: { label: string; value: string | null }[] = [
    { label: 'Small', value: '12px' },
    { label: 'Normal', value: null },
    { label: 'Large', value: '18px' },
    { label: 'Huge', value: '28px' },
];

const BLOCKS = [
    { label: 'Paragraph', level: 0 },
    { label: 'Heading 1', level: 1 },
    { label: 'Heading 2', level: 2 },
    { label: 'Heading 3', level: 3 },
] as const;

// 8 × 6 palette like Gmail's
const PALETTE = [
    '#000000', '#444444', '#666666', '#999999', '#cccccc', '#eeeeee', '#f3f3f3', '#ffffff',
    '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#9900ff', '#ff00ff',
    '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#cfe2f3', '#d9d2e9', '#ead1dc',
    '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#9fc5e8', '#b4a7d6', '#d5a6bd',
    '#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3d85c6', '#674ea7', '#a64d79',
    '#660000', '#783f04', '#7f6000', '#274e13', '#0c343d', '#073763', '#20124d', '#4c1130',
];

export const MERGE_FIELDS = [
    { key: 'firstName', label: 'First name', hint: 'falls back to “there”' },
    { key: 'lastName', label: 'Last name' },
    { key: 'fullName', label: 'Full name', hint: 'or their email' },
    { key: 'email', label: 'Email address' },
];

// ─── small building blocks ──────────────────────────────────────

function ToolBtn({ active, title, onClick, disabled, children }: {
    active?: boolean; title: string; onClick: () => void; disabled?: boolean; children: React.ReactNode;
}) {
    return (
        <button type="button" title={title} aria-label={title} aria-pressed={active} disabled={disabled}
            onMouseDown={(e) => e.preventDefault()} onClick={onClick}
            className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md px-1.5 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 disabled:opacity-40 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white ${active ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : ''}`}>
            {children}
        </button>
    );
}

const Sep = () => <span className="mx-1 h-5 w-px shrink-0 bg-gray-200 dark:bg-gray-700" />;

/** A toolbar button that opens a small panel below it. */
function Menu({ label, title, children, width = 'w-44', align = 'left' }: {
    label: React.ReactNode; title: string; children: (close: () => void) => React.ReactNode; width?: string; align?: 'left' | 'right';
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
        document.addEventListener('mousedown', onDown);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDown);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);
    return (
        <div ref={ref} className="relative">
            <button type="button" title={title} aria-label={title} aria-expanded={open}
                onMouseDown={(e) => e.preventDefault()} onClick={() => setOpen((v) => !v)}
                className={`inline-flex h-8 items-center gap-1 rounded-md px-1.5 text-sm text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white ${open ? 'bg-gray-100 dark:bg-gray-700' : ''}`}>
                {label}
                <ChevronDown className="h-3 w-3 opacity-60" />
            </button>
            {open && (
                <div className={`absolute top-full z-30 mt-1 ${align === 'right' ? 'right-0' : 'left-0'} ${width} rounded-lg border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-gray-800`}
                    onMouseDown={(e) => e.target instanceof HTMLInputElement || e.preventDefault()}>
                    {children(() => setOpen(false))}
                </div>
            )}
        </div>
    );
}

function MenuItem({ active, onClick, children, style }: { active?: boolean; onClick: () => void; children: React.ReactNode; style?: React.CSSProperties }) {
    return (
        <button type="button" onClick={onClick} style={style}
            className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${active ? 'font-semibold text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-200'}`}>
            {children}
        </button>
    );
}

function Swatches({ current, onPick, onReset, resetLabel }: { current?: string; onPick: (c: string) => void; onReset: () => void; resetLabel: string }) {
    return (
        <div>
            <div className="grid grid-cols-8 gap-1">
                {PALETTE.map((c) => (
                    <button key={c} type="button" title={c} aria-label={c} onClick={() => onPick(c)}
                        style={{ background: c }}
                        className={`h-4.5 w-4.5 rounded-sm border ${current?.toLowerCase() === c ? 'ring-2 ring-blue-500 ring-offset-1' : 'border-gray-200 dark:border-gray-600'}`} />
                ))}
            </div>
            <button type="button" onClick={onReset} className="mt-2 w-full rounded-md py-1 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">{resetLabel}</button>
        </div>
    );
}

// ─── link editing ───────────────────────────────────────────────

function normaliseUrl(raw: string) {
    const v = raw.trim();
    if (!v) return '';
    if (/^(https?:|mailto:|tel:)/i.test(v)) return v;
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return `mailto:${v}`;
    return `https://${v}`;
}

function LinkPanel({ editor, close }: { editor: Editor; close: () => void }) {
    const { from, to, empty } = editor.state.selection;
    const [text, setText] = useState(empty ? '' : editor.state.doc.textBetween(from, to, ' '));
    const [url, setUrl] = useState<string>(editor.getAttributes('link').href ?? '');
    const apply = () => {
        const href = normaliseUrl(url);
        if (!href) return;
        const label = text.trim() || href.replace(/^mailto:/, '');
        const chain = editor.chain().focus().extendMarkRange('link');
        if (empty || label !== editor.state.doc.textBetween(from, to, ' ')) {
            // typing after the new link continues as plain text, like Gmail
            chain.insertContent({ type: 'text', text: label, marks: [{ type: 'link', attrs: { href } }] }).unsetMark('link').run();
        } else {
            chain.setLink({ href }).run();
        }
        close();
    };
    return (
        <form className="space-y-2 p-2" onSubmit={(e) => { e.preventDefault(); apply(); }}>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300">Text to display
                <input value={text} onChange={(e) => setText(e.target.value)} className="mt-1 w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-900" />
            </label>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300">Web address or email
                <input autoFocus value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://genesis.co.ke/offers"
                    className="mt-1 w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-900" />
            </label>
            <div className="flex justify-end gap-2 pt-1">
                {editor.isActive('link') && (
                    <button type="button" onClick={() => { editor.chain().focus().extendMarkRange('link').unsetLink().run(); close(); }}
                        className="rounded-md px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50">Remove</button>
                )}
                <button type="submit" disabled={!url.trim()} className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white disabled:opacity-50">OK</button>
            </div>
        </form>
    );
}

// ─── the editor ─────────────────────────────────────────────────

interface Props {
    /** starting content; remount (change `key`) to load different content */
    value: string;
    onChange: (html: string) => void;
    editable?: boolean;
    placeholder?: string;
    /** called once with the editor so the composer can insert merge fields etc. */
    onReady?: (editor: Editor) => void;
}

export function RichTextEditor({ value, onChange, editable = true, placeholder = 'Write your message…', onReady }: Props) {
    const [uploading, setUploading] = useState(0);
    const fileInput = useRef<HTMLInputElement>(null);
    const onChangeRef = useRef(onChange);
    useLayoutEffect(() => { onChangeRef.current = onChange; }, [onChange]);

    const uploadImages = async (files: File[], editor: Editor, at?: number) => {
        const images = files.filter((f) => f.type.startsWith('image/'));
        if (!images.length) return false;
        setUploading((n) => n + images.length);
        for (const file of images) {
            try {
                if (file.size > 5 * 1024 * 1024) throw new Error(`${file.name} is over 5 MB — use a smaller image.`);
                const { url } = await uploadAttachment(file);
                const chain = editor.chain().focus();
                (at !== undefined ? chain.insertContentAt(at, { type: 'image', attrs: { src: url, alt: file.name } }) : chain.setImage({ src: url, alt: file.name })).run();
            } catch (e) {
                toast.error(e instanceof Error ? e.message : 'Image upload failed');
            } finally {
                setUploading((n) => n - 1);
            }
        }
        return true;
    };

    const editor = useEditor({
        immediatelyRender: false,
        editable,
        content: value,
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
                link: { openOnClick: false, autolink: true, defaultProtocol: 'https' },
                codeBlock: false,
                code: false,
            }),
            TextStyleKit,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Image.configure({ resize: { enabled: true, alwaysPreserveAspectRatio: true, minWidth: 40, minHeight: 20 } }),
            Placeholder.configure({ placeholder }),
        ],
        editorProps: {
            attributes: {
                class: 'gx-email-content min-h-[260px] px-4 py-3 text-[14px] leading-relaxed text-gray-900 outline-none dark:text-gray-100',
                'aria-label': 'Message body',
            },
            handlePaste: (view, event) => {
                const files = Array.from(event.clipboardData?.files ?? []);
                if (!files.some((f) => f.type.startsWith('image/')) || !editorRef.current) return false;
                void uploadImages(files, editorRef.current);
                return true;
            },
            handleDrop: (view, event) => {
                const files = Array.from((event as DragEvent).dataTransfer?.files ?? []);
                if (!files.some((f) => f.type.startsWith('image/')) || !editorRef.current) return false;
                event.preventDefault();
                const pos = view.posAtCoords({ left: (event as DragEvent).clientX, top: (event as DragEvent).clientY })?.pos;
                void uploadImages(files, editorRef.current, pos);
                return true;
            },
        },
        onUpdate: ({ editor }) => onChangeRef.current(editor.isEmpty ? '' : editor.getHTML()),
    });
    const editorRef = useRef<Editor | null>(null);
    useLayoutEffect(() => { editorRef.current = editor; }, [editor]);

    useEffect(() => {
        if (editor && onReady) onReady(editor);
    }, [editor, onReady]);

    useEffect(() => {
        editor?.setEditable(editable);
    }, [editor, editable]);

    const s = useEditorState({
        editor,
        selector: ({ editor: e }) => {
            if (!e) return null;
            const style = e.getAttributes('textStyle');
            return {
                bold: e.isActive('bold'),
                italic: e.isActive('italic'),
                underline: e.isActive('underline'),
                strike: e.isActive('strike'),
                bullet: e.isActive('bulletList'),
                ordered: e.isActive('orderedList'),
                quote: e.isActive('blockquote'),
                link: e.isActive('link'),
                level: ([1, 2, 3] as const).find((l) => e.isActive('heading', { level: l })) ?? 0,
                align: (['center', 'right', 'justify'] as const).find((a) => e.isActive({ textAlign: a })) ?? 'left',
                font: (style.fontFamily as string | undefined) ?? null,
                size: (style.fontSize as string | undefined) ?? null,
                color: style.color as string | undefined,
                background: style.backgroundColor as string | undefined,
                canUndo: e.can().undo(),
                canRedo: e.can().redo(),
            };
        },
    });

    if (!editor || !s) {
        return <div className="min-h-[300px] animate-pulse rounded-lg bg-gray-50 dark:bg-gray-900/40" />;
    }

    const chain = () => editor.chain().focus();
    const fontLabel = FONTS.find((f) => f.value === s.font)?.label ?? 'Sans Serif';
    const AlignIcon = { left: AlignLeft, center: AlignCenter, right: AlignRight, justify: AlignJustify }[s.align] ?? AlignLeft;

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            {editable && (
                <div className="sticky top-0 z-20 flex flex-wrap items-center gap-0.5 border-b border-gray-100 bg-white/95 px-2 py-1 backdrop-blur dark:border-gray-700 dark:bg-gray-800/95" role="toolbar" aria-label="Formatting">
                    <ToolBtn title="Undo (Ctrl+Z)" onClick={() => chain().undo().run()} disabled={!s.canUndo}><Undo2 className="h-4 w-4" /></ToolBtn>
                    <ToolBtn title="Redo (Ctrl+Y)" onClick={() => chain().redo().run()} disabled={!s.canRedo}><Redo2 className="h-4 w-4" /></ToolBtn>
                    <Sep />
                    <Menu title="Font" width="w-48" label={<span className="w-[84px] truncate text-left" style={{ fontFamily: s.font ?? undefined }}>{fontLabel}</span>}>
                        {(close) => FONTS.map((f) => (
                            <MenuItem key={f.label} active={f.value === s.font} style={{ fontFamily: f.value ?? undefined }}
                                onClick={() => { (f.value ? chain().setFontFamily(f.value) : chain().unsetFontFamily()).run(); close(); }}>{f.label}</MenuItem>
                        ))}
                    </Menu>
                    <Sep />
                    <Menu title="Size" width="w-36" label={<span className="text-[13px]">Size</span>}>
                        {(close) => SIZES.map((z) => (
                            <MenuItem key={z.label} active={z.value === s.size} style={{ fontSize: z.value ?? '14px' }}
                                onClick={() => { (z.value ? chain().setFontSize(z.value) : chain().unsetFontSize()).run(); close(); }}>{z.label}</MenuItem>
                        ))}
                    </Menu>
                    <Menu title="Text style" width="w-40" label={<span className="text-[13px]">{BLOCKS[s.level].label}</span>}>
                        {(close) => BLOCKS.map((b) => (
                            <MenuItem key={b.label} active={b.level === s.level}
                                onClick={() => { (b.level ? chain().setHeading({ level: b.level }) : chain().setParagraph()).run(); close(); }}>
                                <span className={b.level === 1 ? 'text-lg font-bold' : b.level === 2 ? 'text-base font-bold' : b.level === 3 ? 'font-semibold' : ''}>{b.label}</span>
                            </MenuItem>
                        ))}
                    </Menu>
                    <Sep />
                    <ToolBtn title="Bold (Ctrl+B)" active={s.bold} onClick={() => chain().toggleBold().run()}><Bold className="h-4 w-4" /></ToolBtn>
                    <ToolBtn title="Italic (Ctrl+I)" active={s.italic} onClick={() => chain().toggleItalic().run()}><Italic className="h-4 w-4" /></ToolBtn>
                    <ToolBtn title="Underline (Ctrl+U)" active={s.underline} onClick={() => chain().toggleUnderline().run()}><Underline className="h-4 w-4" /></ToolBtn>
                    <ToolBtn title="Strikethrough" active={s.strike} onClick={() => chain().toggleStrike().run()}><Strikethrough className="h-4 w-4" /></ToolBtn>
                    <Menu title="Text colour" width="w-[236px]" label={
                        <span className="flex flex-col items-center leading-none">
                            <Baseline className="h-4 w-4" />
                            <span className="-mt-0.5 h-[3px] w-4 rounded-full" style={{ background: s.color ?? '#111827' }} />
                        </span>
                    }>
                        {(close) => (
                            <div className="grid gap-3 p-2">
                                <div>
                                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Background colour</p>
                                    <Swatches current={s.background} resetLabel="No background"
                                        onPick={(c) => { chain().setBackgroundColor(c).run(); close(); }}
                                        onReset={() => { chain().unsetBackgroundColor().run(); close(); }} />
                                </div>
                                <div>
                                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Text colour</p>
                                    <Swatches current={s.color} resetLabel="Default colour"
                                        onPick={(c) => { chain().setColor(c).run(); close(); }}
                                        onReset={() => { chain().unsetColor().run(); close(); }} />
                                </div>
                            </div>
                        )}
                    </Menu>
                    <Sep />
                    <Menu title="Align" width="w-auto" label={<AlignIcon className="h-4 w-4" />}>
                        {(close) => (
                            <div className="flex gap-0.5">
                                {([['left', AlignLeft], ['center', AlignCenter], ['right', AlignRight], ['justify', AlignJustify]] as const).map(([a, Icon]) => (
                                    <ToolBtn key={a} title={`Align ${a}`} active={s.align === a} onClick={() => { chain().setTextAlign(a).run(); close(); }}>
                                        <Icon className="h-4 w-4" />
                                    </ToolBtn>
                                ))}
                            </div>
                        )}
                    </Menu>
                    <ToolBtn title="Numbered list" active={s.ordered} onClick={() => chain().toggleOrderedList().run()}><ListOrdered className="h-4 w-4" /></ToolBtn>
                    <ToolBtn title="Bulleted list" active={s.bullet} onClick={() => chain().toggleBulletList().run()}><List className="h-4 w-4" /></ToolBtn>
                    <ToolBtn title="Quote" active={s.quote} onClick={() => chain().toggleBlockquote().run()}><TextQuote className="h-4 w-4" /></ToolBtn>
                    <ToolBtn title="Divider" onClick={() => chain().setHorizontalRule().run()}><Minus className="h-4 w-4" /></ToolBtn>
                    <Sep />
                    <Menu title="Insert link (Ctrl+K)" width="w-72" label={<LinkIcon className="h-4 w-4" />}>
                        {(close) => <LinkPanel editor={editor} close={close} />}
                    </Menu>
                    {s.link && <ToolBtn title="Remove link" onClick={() => chain().extendMarkRange('link').unsetLink().run()}><Unlink className="h-4 w-4" /></ToolBtn>}
                    <ToolBtn title="Insert photo" onClick={() => fileInput.current?.click()} disabled={uploading > 0}>
                        {uploading > 0 ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                    </ToolBtn>
                    <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/gif,image/webp" multiple hidden
                        onChange={(e) => { void uploadImages(Array.from(e.target.files ?? []), editor); e.target.value = ''; }} />
                    <Menu title="Insert personalisation" width="w-60" label={<span className="inline-flex items-center gap-1 text-[13px]"><Braces className="h-4 w-4" />Personalise</span>}>
                        {(close) => (
                            <>
                                <p className="px-2.5 pb-1 pt-1.5 text-[11px] leading-snug text-gray-500">Replaced with each customer&apos;s details when sent.</p>
                                {MERGE_FIELDS.map((f) => (
                                    <MenuItem key={f.key} onClick={() => { chain().insertContent(`{{${f.key}}}`).run(); close(); }}>
                                        <span className="flex-1">{f.label}</span>
                                        {f.hint && <span className="text-[11px] text-gray-400">{f.hint}</span>}
                                    </MenuItem>
                                ))}
                            </>
                        )}
                    </Menu>
                    <Sep />
                    <ToolBtn title="Remove formatting" onClick={() => chain().unsetAllMarks().unsetTextAlign().clearNodes().run()}><RemoveFormatting className="h-4 w-4" /></ToolBtn>
                </div>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto">
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}
