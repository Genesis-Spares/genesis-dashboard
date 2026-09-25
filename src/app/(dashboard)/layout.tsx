// src/app/(dashboard)/layout.tsx
'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Providers } from '@/components/providers/Providers';
import { SessionManager } from '@/components/auth/SessionManager';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useIsMobile } from '@/hooks/use-mobile';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const isMobile = useIsMobile();

    const handleMobileMenuClick = () => {
        setMobileSidebarOpen(true);
    };

    const handleMobileSidebarClose = () => {
        setMobileSidebarOpen(false);
    };

    return (
        <Providers>
            <ProtectedRoute>
                <SessionManager />
                <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
                    {/* Sidebar - Mobile overlay */}
                    <Sidebar
                        mobileOpen={mobileSidebarOpen}
                        onMobileClose={handleMobileSidebarClose}
                    />

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col overflow-hidden w-full">
                        <Header onMenuClick={handleMobileMenuClick} />
                        <main className="flex-1 overflow-y-auto p-3 md:p-4 lg:p-6">
                            <div className="container mx-auto max-w-7xl">
                                {children}
                            </div>
                        </main>
                    </div>
                </div>
            </ProtectedRoute>
        </Providers>
    );
}