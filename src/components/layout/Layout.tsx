// components/layout/AdminLayout.tsx
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import AdminSidebar from './Sidebar';
import AdminHeader from './Header';

interface AdminLayoutProps {
    children: React.ReactNode;
    title?: string;
}

const Layout = ({ children, title = 'Dashboard' }: AdminLayoutProps) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        setSidebarOpen(false);
    }, [location]);

    return (
        <div className="min-h-screen bg-gray-100">
            <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main Content Area */}
            <div className="lg:ml-80 min-h-screen">
                <AdminHeader
                    title={title}
                    onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
                />

                <main className="p-4 lg:p-6 min-h-screen bg-gray-100">
                    <div className="max-w-full pt-16">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;