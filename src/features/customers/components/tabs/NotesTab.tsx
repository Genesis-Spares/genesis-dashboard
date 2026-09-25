'use client';

import { useState } from 'react';
import {
    PlusIcon,
    StarIcon,
    PencilIcon,
    TrashIcon,
    XMarkIcon,
    CheckIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import { NoteType } from '@/types/customer.types';
import { useAuth } from '@/lib/hooks/useAuth';

interface Note {
    id: string;
    content: string;
    type: NoteType;
    isPinned: boolean;
    isInternal: boolean;
    createdAt: string;
    authorId?: string;
}

interface NotesTabProps {
    notes: Note[];
    canManage: boolean;
    onAddNote: (data: any, options?: { onSuccess?: () => void; onError?: (error: unknown) => void }) => void;
    onUpdateNote: (data: { noteId: string; dto: any }, options?: { onSuccess?: () => void; onError?: (error: unknown) => void }) => void;
    onDeleteNote: (noteId: string, options?: { onSuccess?: () => void; onError?: (error: unknown) => void }) => void;
    isAdding: boolean;
    isUpdating: boolean;
    isDeleting: boolean;
}

const inputClass =
    'w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500';

function InfoCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {title}
                </h3>
                {action}
            </div>
            {children}
        </div>
    );
}

export function NotesTab({
    notes,
    canManage,
    onAddNote,
    onUpdateNote,
    onDeleteNote,
    isAdding,
    isUpdating,
    isDeleting
}: NotesTabProps) {
    const [showForm, setShowForm] = useState(false);
    const [content, setContent] = useState('');
    const [type, setType] = useState<NoteType>('GENERAL');
    const [isPinned, setIsPinned] = useState(false);

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [editType, setEditType] = useState<NoteType>('GENERAL');
    const [editIsPinned, setEditIsPinned] = useState(false);

    const { user } = useAuth();

    // Get the author ID from the authenticated user
    const authorId = user?.id || user?.userId || user?.sub;

    console.log("📝 Author ID from auth:", authorId);
    console.log("👤 Full user object:", user);

    const handleAdd = () => {
        if (!content.trim()) return;

        if (!authorId) {
            console.error('❌ No author ID found. User must be authenticated to add a note.');
            return;
        }

        onAddNote(
            {
                content,
                type,
                isInternal: true,
                isPinned,
                authorId: authorId
            },
            {
                onSuccess: () => {
                    setShowForm(false);
                    setContent('');
                    setType('GENERAL');
                    setIsPinned(false);
                },
                onError: (error) => {
                    console.error('❌ Failed to add note:', error);
                },
            }
        );
    };

    const handleEdit = (note: Note) => {
        setEditingId(note.id);
        setEditContent(note.content);
        setEditType(note.type);
        setEditIsPinned(note.isPinned);
    };

    const handleUpdate = (noteId: string) => {
        if (!editContent.trim()) return;

        onUpdateNote(
            {
                noteId,
                dto: {
                    content: editContent,
                    type: editType,
                    isPinned: editIsPinned
                }
            },
            {
                onSuccess: () => {
                    setEditingId(null);
                    setEditContent('');
                    setEditType('GENERAL');
                    setEditIsPinned(false);
                },
                onError: (error) => {
                    console.error('❌ Failed to update note:', error);
                },
            }
        );
    };

    const handleDelete = (noteId: string) => {
        if (window.confirm('Are you sure you want to delete this note?')) {
            onDeleteNote(noteId, {
                onError: (error) => {
                    console.error('❌ Failed to delete note:', error);
                },
            });
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditContent('');
        setEditType('GENERAL');
        setEditIsPinned(false);
    };

    const sortedNotes = [...notes].sort((a, b) => Number(b.isPinned) - Number(a.isPinned));

    return (
        <InfoCard
            title={`Notes (${notes.length})`}
            action={
                canManage && (
                    <button
                        onClick={() => setShowForm((v) => !v)}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                        <PlusIcon className="w-4 h-4" />
                        Add Note
                    </button>
                )
            }
        >
            {showForm && (
                <div className="mb-5 p-4 rounded-xl border border-gray-100 dark:border-gray-800 space-y-3">
                    <textarea
                        className={inputClass}
                        rows={3}
                        placeholder="Write a note about this customer…"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />
                    <div className="flex flex-wrap items-center gap-3">
                        <select
                            className={`${inputClass} w-auto`}
                            value={type}
                            onChange={(e) => setType(e.target.value as NoteType)}
                        >
                            <option value="GENERAL">General</option>
                            <option value="SUPPORT">Support</option>
                            <option value="SALES">Sales</option>
                            <option value="COMPLAINT">Complaint</option>
                            <option value="FEEDBACK">Feedback</option>
                        </select>
                        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <input
                                type="checkbox"
                                checked={isPinned}
                                onChange={(e) => setIsPinned(e.target.checked)}
                            />
                            Pin this note
                        </label>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setShowForm(false)}
                            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAdd}
                            disabled={isAdding || !content.trim() || !authorId}
                            className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white disabled:opacity-50 hover:bg-blue-700 transition-colors"
                        >
                            {isAdding ? 'Saving…' : 'Add Note'}
                        </button>
                    </div>
                </div>
            )}

            {sortedNotes.length > 0 ? (
                <div className="space-y-3">
                    {sortedNotes.map((note) => (
                        <div
                            key={note.id}
                            className={`p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:shadow-sm transition-shadow ${note.isPinned ? 'bg-blue-50/50 dark:bg-blue-900/5 border-blue-100 dark:border-blue-800/30' : ''
                                }`}
                        >
                            {editingId === note.id ? (
                                // Edit mode
                                <div className="space-y-3">
                                    <textarea
                                        className={inputClass}
                                        rows={3}
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                    />
                                    <div className="flex flex-wrap items-center gap-3">
                                        <select
                                            className={`${inputClass} w-auto`}
                                            value={editType}
                                            onChange={(e) => setEditType(e.target.value as NoteType)}
                                        >
                                            <option value="GENERAL">General</option>
                                            <option value="SUPPORT">Support</option>
                                            <option value="SALES">Sales</option>
                                            <option value="COMPLAINT">Complaint</option>
                                            <option value="FEEDBACK">Feedback</option>
                                        </select>
                                        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                            <input
                                                type="checkbox"
                                                checked={editIsPinned}
                                                onChange={(e) => setEditIsPinned(e.target.checked)}
                                            />
                                            Pin this note
                                        </label>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={handleCancelEdit}
                                            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => handleUpdate(note.id)}
                                            disabled={isUpdating || !editContent.trim()}
                                            className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white disabled:opacity-50 hover:bg-blue-700 transition-colors"
                                        >
                                            {isUpdating ? 'Saving…' : 'Save Changes'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                // View mode
                                <>
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                                {note.type}
                                            </span>
                                            {note.isPinned && (
                                                <StarSolid className="w-3.5 h-3.5 text-yellow-400" />
                                            )}
                                            {note.isInternal && (
                                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-50 dark:bg-gray-700/50 text-gray-400">
                                                    Internal
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="text-xs text-gray-400 mr-2">
                                                {new Date(note.createdAt).toLocaleString()}
                                            </span>
                                            {canManage && (
                                                <>
                                                    <button
                                                        onClick={() => handleEdit(note)}
                                                        className="text-gray-400 hover:text-blue-500 transition-colors p-1"
                                                        title="Edit note"
                                                    >
                                                        <PencilIcon className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(note.id)}
                                                        disabled={isDeleting}
                                                        className="text-gray-400 hover:text-red-500 transition-colors p-1 disabled:opacity-50"
                                                        title="Delete note"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-line">
                                        {note.content}
                                    </p>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-3">
                        <PlusIcon className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">No notes yet.</p>
                    {canManage && (
                        <p className="text-xs text-gray-400 mt-1">Click "Add Note" to add one.</p>
                    )}
                </div>
            )}
        </InfoCard>
    );
}