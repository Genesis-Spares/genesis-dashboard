'use client';

import { useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/hooks/useAuth';
import { OrderNote } from '@/types/order.types';

interface NotesTabProps {
    notes: OrderNote[];
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
    isDeleting,
}: NotesTabProps) {
    const [showForm, setShowForm] = useState(false);
    const [content, setContent] = useState('');

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');

    const { user } = useAuth();
    const authorId = user?.id || user?.userId || user?.sub;

    const handleAdd = () => {
        if (!content.trim() || !authorId) return;

        onAddNote(
            { content, isInternal: true, authorId },
            {
                onSuccess: () => {
                    setShowForm(false);
                    setContent('');
                },
                onError: (error) => console.error('❌ Failed to add order note:', error),
            },
        );
    };

    const handleEdit = (note: OrderNote) => {
        setEditingId(note.id);
        setEditContent(note.content);
    };

    const handleUpdate = (noteId: string) => {
        if (!editContent.trim()) return;

        onUpdateNote(
            { noteId, dto: { content: editContent } },
            {
                onSuccess: () => {
                    setEditingId(null);
                    setEditContent('');
                },
                onError: (error) => console.error('❌ Failed to update order note:', error),
            },
        );
    };

    const handleDelete = (noteId: string) => {
        if (window.confirm('Delete this note?')) {
            onDeleteNote(noteId, {
                onError: (error) => console.error('❌ Failed to delete order note:', error),
            });
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditContent('');
    };

    return (
        <InfoCard
            title={`Internal Notes (${notes.length})`}
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
                        placeholder="Write an internal note about this order…"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />
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

            {notes.length > 0 ? (
                <div className="space-y-3">
                    {notes.map((note) => (
                        <div key={note.id} className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:shadow-sm transition-shadow">
                            {editingId === note.id ? (
                                <div className="space-y-3">
                                    <textarea
                                        className={inputClass}
                                        rows={3}
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                    />
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
                                <>
                                    <div className="flex items-start justify-between mb-2">
                                        <span className="text-xs text-gray-400">
                                            {new Date(note.createdAt).toLocaleString()}
                                        </span>
                                        {canManage && (
                                            <div className="flex items-center gap-1">
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
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-line">{note.content}</p>
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
                    {canManage && <p className="text-xs text-gray-400 mt-1">Click "Add Note" to add one.</p>}
                </div>
            )}
        </InfoCard>
    );
}
