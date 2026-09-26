// src/app/(dashboard)/layout.tsx
'use client';

import { useCallback, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Providers } from '@/components/providers/Providers';
import { SessionManager } from '@/components/auth/SessionManager';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    const handleMobileMenuClick = () => {
        setMobileSidebarOpen(true);
    };

    const handleMobileSidebarClose = useCallback(() => {
        setMobileSidebarOpen(false);
    }, []);

    return (
        <Providers>
            <ProtectedRoute>
                <SessionManager />
                <div className="flex h-dvh bg-gray-50 dark:bg-gray-900 overflow-hidden">
                    {/* Sidebar - Mobile overlay */}
                    <Sidebar
                        mobileOpen={mobileSidebarOpen}
                        onMobileClose={handleMobileSidebarClose}
                    />

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                        <Header onMenuClick={handleMobileMenuClick} />
                        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 lg:p-6">
                            <div className="mx-auto w-full max-w-7xl min-w-0">
                                {children}
                            </div>
                        </main>
                    </div>
                </div>
            </ProtectedRoute>
        </Providers>
    );
}