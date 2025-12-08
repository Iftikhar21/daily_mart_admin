// components/layout/AdminHeader.tsx
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ChevronDown, LogOut, Menu, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface AdminHeaderProps {
    title: string;
    onMenuToggle: () => void;
}

const Header = ({ title, onMenuToggle }: AdminHeaderProps) => {
    const { user, logout } = useAuth();
    const [profileOpen, setProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setProfileOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();          // clear state & localStorage
        navigate('/'); // redirect ke login
    };

    return (
        <header className="fixed top-0 right-0 left-0 lg:left-80 bg-white border-b border-gray-200 z-30">
            <div className="flex items-center justify-between px-4 lg:px-8 py-4 content-container">
                {/* Kiri */}
                <div className="flex items-center gap-3">
                    <button
                        id="mobileMenuBtn"
                        className="lg:hidden text-slate-900"
                        onClick={onMenuToggle}
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <h1 className="text-lg font-semibold text-gray-800 truncate max-w-[150px] lg:max-w-none">
                        {title}
                    </h1>
                </div>

                {/* Kanan */}
                <div className="relative" ref={profileRef}>
                    <button
                        id="profileBtn"
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => setProfileOpen(!profileOpen)}
                    >
                        <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 lg:w-6 lg:h-6 text-gray-600" />
                        </div>
                        <span className="hidden lg:inline text-sm font-medium text-gray-700 truncate max-w-[100px]">
                            {user?.name || 'Unknown'}
                        </span>
                        <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    </button>

                    {/* Dropdown */}
                    {profileOpen && (
                        <div id="profileDropdown" className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                            <Link to="/admin/profil" className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                                <User className="w-4 h-4" />
                                <span>Profile</span>
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Logout</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;