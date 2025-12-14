// components/layout/AdminSidebar.tsx
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Box, ChevronDown, Database, LayoutDashboard, User, ChevronRight, Receipt } from 'lucide-react';
import logoWhite from "@/assets/img/logo-daily-mart-putih.svg";

interface MenuItem {
    route?: string;
    label: string;
    icon: React.ElementType;
    children?: MenuItem[];
}

interface AdminSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: AdminSidebarProps) => {
    const { user } = useAuth();
    const location = useLocation();
    const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({});

    const menus: MenuItem[] = [
        {
            route: '/admin/dashboard',
            label: 'Dashboard',
            icon: LayoutDashboard,
        },

        // ========================
        // MASTER CABANG
        // ========================
        {
            label: 'Master Cabang',
            icon: Database,
            children: [
                { route: '/admin/cabang', label: 'Cabang', icon: Database },
                { route: '/admin/produk', label: 'Produk per Cabang', icon: Box },
                { route: '/admin/kategori-produk', label: 'Kategori Produk', icon: Database },
            ],
        },

        // ========================
        // MANAJEMEN PENGGUNA
        // ========================
        {
            label: 'Manajemen Pengguna',
            icon: User,
            children: [
                { route: '/admin/kelola-pengguna', label: 'Pengguna', icon: User },
                { route: '/admin/kelola-petugas', label: 'Petugas', icon: User },
                { route: '/admin/kelola-kurir', label: 'Kurir', icon: User },
                { route: '/admin/kelola-pelanggan', label: 'Pelanggan', icon: User },
            ],
        },

        // ========================
        // TRANSAKSI STOK
        // ========================
        {
            label: 'Transaksi Stok',
            icon: Box,
            children: [
                { route: '/admin/request-stok', label: 'Request Stok Barang', icon: Box },
                { route: '/admin/laporan-penjualan-cabang', label: 'Laporan Penjualan per Cabang', icon: Receipt },
            ],
        },

        // ========================
        // PROFIL
        // ========================
        {
            route: '/admin/profil',
            label: 'Profil',
            icon: User,
        },
    ];

    // Auto buka menu parent jika child aktif
    useEffect(() => {
        const newOpenMenus: { [key: string]: boolean } = {};

        menus.forEach(menu => {
            if (menu.children) {
                const isChildActive = menu.children.some(child =>
                    isActive(child.route!)
                );
                if (isChildActive) {
                    newOpenMenus[menu.label] = true;
                }
            }
        });

        setOpenMenus(prev => ({ ...prev, ...newOpenMenus }));
    }, [location.pathname]);

    const toggleMenu = (label: string) => {
        setOpenMenus(prev => ({
            ...prev,
            [label]: !prev[label]
        }));
    };

    const isActive = (route: string) => {
        if (route === '/admin/dashboard') {
            return location.pathname === route;
        }
        return location.pathname === route || location.pathname.startsWith(route + '/');
    };

    const isParentActive = (menu: MenuItem) => {
        if (menu.route) return isActive(menu.route);
        if (menu.children) {
            return menu.children.some(child => isActive(child.route!));
        }
        return false;
    };

    return (
        <>
            <aside
                className={`fixed top-0 left-0 h-screen w-80 
                        bg-gradient-to-b from-[#009145] to-[#005f2f]
                        backdrop-blur-xl bg-opacity-90
                        text-white z-40 transform transition-transform duration-300 
                        flex flex-col border-r border-white/10 shadow-2xl
                        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
            >

                {/* Logo */}
                <div className="p-6 border-b border-white/10 flex-shrink-0 bg-white/5 backdrop-blur-md">
                    <div className="w-40 h-40 mx-auto flex items-center justify-center">
                        <img src={logoWhite} className="w-24 h-24 opacity-90" />
                    </div>
                </div>

                {/* Navigation Container dengan Scroll */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    <nav className="p-4 flex-1 overflow-y-auto">
                        <ul className="space-y-2">
                            {menus.map((menu, index) => (
                                <li key={index} className="relative">
                                    {menu.children ? (
                                        // Dropdown Menu
                                        <div>
                                            <button
                                                onClick={() => toggleMenu(menu.label)}
                                                className={`flex items-center justify-between w-full px-4 py-3 rounded-lg transition-all duration-300 cursor-pointer group ${isParentActive(menu)
                                                    ? 'bg-white/20 text-white shadow-lg'
                                                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <menu.icon className={`w-5 h-5 ${isParentActive(menu) ? 'text-white' : 'text-white/70 group-hover:text-white'
                                                        }`} />
                                                    <span className="font-medium text-sm">{menu.label}</span>
                                                </div>
                                                <ChevronDown
                                                    className={`w-4 h-4 transition-transform duration-300 ${openMenus[menu.label] ? 'rotate-180' : ''
                                                        } ${isParentActive(menu) ? 'text-white' : 'text-white/60 group-hover:text-white'}`}
                                                />
                                            </button>

                                            {/* Dropdown Content */}
                                            {openMenus[menu.label] && (
                                                <div className="ml-4 mt-2 space-y-1 max-h-48 overflow-y-auto pr-2 scrollbar-hide">
                                                    {menu.children.map((child, childIndex) => {
                                                        const active = isActive(child.route!);
                                                        return (
                                                            <div key={childIndex} className="relative">
                                                                <Link
                                                                    to={child.route!}
                                                                    onClick={onClose}
                                                                    className={`block px-4 py-2.5 rounded-lg text-sm transition-all duration-300 ${active
                                                                        ? 'bg-[#00b15a] text-white shadow-md border-l-4 border-white'
                                                                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                                                                        }`}
                                                                >
                                                                    <div className="flex items-center">
                                                                        <div className={`w-1.5 h-1.5 rounded-full mr-3 ${active ? 'bg-white' : 'bg-white/40 group-hover:bg-white'
                                                                            }`}></div>
                                                                        <span className="truncate">{child.label}</span>
                                                                        {active && (
                                                                            <ChevronRight className="w-3 h-3 ml-auto text-blue-200" />
                                                                        )}
                                                                    </div>
                                                                </Link>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        // Single Menu
                                        <Link
                                            to={menu.route!}
                                            onClick={onClose}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${isActive(menu.route!)
                                                ? 'bg-white/20 text-white shadow-lg border-r-4 border-white'
                                                : 'text-white/80 hover:bg-white/10 hover:text-white'
                                                }`}
                                        >
                                            <menu.icon className={`w-5 h-5 flex-shrink-0 ${isActive(menu.route!) ? 'text-white' : 'text-gray-400 group-hover:text-white'
                                                }`} />
                                            <span className="font-medium text-sm">{menu.label}</span>
                                            {isActive(menu.route!) && (
                                                <ChevronRight className="w-4 h-4 ml-auto text-blue-200" />
                                            )}
                                        </Link>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* User Info */}
                    <div className="p-4 border-t border-white/10 bg-white/5 backdrop-blur-md">
                        <div className="flex items-center gap-3 px-2 py-2 text-white/90">
                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{user?.name || 'Admin'}</p>
                                <p className="text-xs text-white/70 truncate">Administrator</p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;