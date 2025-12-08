import { useState, useEffect } from "react";
import api, { setAuthToken } from "../api";
import {
    User,
    Mail,
    Lock,
    Eye,
    EyeOff,
    Save,
    Shield,
    Calendar,
    AlertCircle,
    CheckCircle,
    XCircle
} from "lucide-react";
import Layout from "../components/layout/Layout";
import Modal from "../components/Modal";

interface AdminProfile {
    id: number;
    user_id: number;
    created_at: string;
    updated_at: string;
    user: {
        id: number;
        name: string;
        email: string;
        role: string;
        email_verified_at: string | null;
        created_at: string;
        updated_at: string;
    };
}

interface UpdateProfileData {
    name: string;
    email: string;
    current_password?: string;
    password?: string;
    password_confirmation?: string;
}

export default function ProfileAdmin() {
    const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Form states
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // UI states
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isChangePasswordMode, setIsChangePasswordMode] = useState(false);

    // Ambil data profile admin
    const fetchAdminProfile = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get("/admin/profile");

            // Cari data admin dari response
            if (res.data) {
                let adminData: AdminProfile;

                if (res.data.admin) {
                    // Jika ada data admin
                    adminData = {
                        id: res.data.admin.id,
                        user_id: res.data.id,
                        created_at: res.data.created_at,
                        updated_at: res.data.updated_at,
                        user: {
                            id: res.data.id,
                            name: res.data.name,
                            email: res.data.email,
                            role: res.data.role,
                            email_verified_at: res.data.email_verified_at,
                            created_at: res.data.created_at,
                            updated_at: res.data.updated_at
                        }
                    };
                } else {
                    // Jika belum ada data admin, buat dari user data
                    adminData = {
                        id: 0,
                        user_id: res.data.id,
                        created_at: res.data.created_at,
                        updated_at: res.data.updated_at,
                        user: {
                            id: res.data.id,
                            name: res.data.name,
                            email: res.data.email,
                            role: res.data.role,
                            email_verified_at: res.data.email_verified_at,
                            created_at: res.data.created_at,
                            updated_at: res.data.updated_at
                        }
                    };
                }

                setAdminProfile(adminData);
                setName(adminData.user.name);
                setEmail(adminData.user.email);
            }
        } catch (err: any) {
            console.error("Error fetching profile:", err);
            setError(err.response?.data?.message || "Gagal mengambil data profil");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            setAuthToken(token);
            fetchAdminProfile();
        } else {
            setError("Silakan login terlebih dahulu.");
        }
    }, []);

    // Update profile
    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validasi
        if (!name.trim()) {
            setError("Nama tidak boleh kosong");
            return;
        }

        if (!email.trim()) {
            setError("Email tidak boleh kosong");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError("Format email tidak valid");
            return;
        }

        // Jika mode ubah password aktif, validasi password
        if (isChangePasswordMode) {
            if (newPassword.length < 6) {
                setError("Password baru minimal 6 karakter");
                return;
            }

            if (newPassword !== confirmPassword) {
                setError("Password baru dan konfirmasi password tidak cocok");
                return;
            }

            if (!currentPassword) {
                setError("Password saat ini diperlukan untuk mengubah password");
                return;
            }
        }

        setUpdating(true);
        setError(null);
        setSuccess(null);

        try {
            // Buat payload update
            const updateData: any = {
                name,
                email
            };

            // Jika ubah password, tambahkan field password
            if (isChangePasswordMode && newPassword) {
                updateData.current_password = currentPassword;
                updateData.password = newPassword;
                updateData.password_confirmation = confirmPassword;
            }

            // Kirim update request
            await api.put("/admin/profile", updateData);

            // Update local state
            if (adminProfile) {
                setAdminProfile({
                    ...adminProfile,
                    user: {
                        ...adminProfile.user,
                        name,
                        email,
                        updated_at: new Date().toISOString()
                    }
                });
            }

            setSuccess("Profil berhasil diperbarui!");

            // Reset password fields
            if (isChangePasswordMode) {
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
                setIsChangePasswordMode(false);
            }

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(null), 3000);

        } catch (err: any) {
            console.error("Update error:", err);
            setError(err.response?.data?.message || err.message || "Gagal memperbarui profil");
        } finally {
            setUpdating(false);
        }
    };

    // Reset form
    const handleReset = () => {
        if (adminProfile) {
            setName(adminProfile.user.name);
            setEmail(adminProfile.user.email);
        }
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setIsChangePasswordMode(false);
        setError(null);
        setSuccess(null);
    };

    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <Layout title="Profil Admin">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Profil Admin">
            <div className="mx-auto">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Profil Admin</h1>
                            <p className="text-gray-600">Kelola informasi profil dan akun Anda</p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                <Shield className="w-4 h-4 mr-1" />
                                Admin
                            </span>
                        </div>
                    </div>
                </div>

                {/* Error & Success Messages */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
                        <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
                        <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                        {success}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Profile Info */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            {/* Profile Image/Initial */}
                            <div className="flex flex-col items-center mb-6">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold mb-4">
                                    {adminProfile?.user.name ? adminProfile.user.name.charAt(0).toUpperCase() : 'A'}
                                </div>

                                <h2 className="text-xl font-bold text-gray-800 text-center">
                                    {adminProfile?.user.name || 'Admin'}
                                </h2>
                                <p className="text-gray-600 text-sm flex items-center mt-1">
                                    <Mail className="w-4 h-4 mr-1" />
                                    {adminProfile?.user.email || 'admin@example.com'}
                                </p>
                            </div>

                            {/* Account Info */}
                            <div className="border-t pt-6">
                                <h3 className="font-semibold text-gray-800 mb-4">Informasi Akun</h3>
                                <div className="space-y-3">
                                    <div className="flex items-start text-sm">
                                        <Calendar className="w-4 h-4 mr-3 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-gray-500">Bergabung</p>
                                            <p className="font-medium">
                                                {adminProfile?.user.created_at ? formatDate(adminProfile.user.created_at) : '-'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start text-sm">
                                        <Calendar className="w-4 h-4 mr-3 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-gray-500">Terakhir Update</p>
                                            <p className="font-medium">
                                                {adminProfile?.user.updated_at ? formatDate(adminProfile.user.updated_at) : '-'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Security Tips */}
                        <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Tips Keamanan</h3>
                            <div className="space-y-4">
                                <div className="flex items-start">
                                    <Lock className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                                    <div>
                                        <h4 className="font-medium text-gray-800">Gunakan Password yang Kuat</h4>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Gunakan kombinasi huruf besar/kecil, angka, dan simbol untuk password yang lebih aman.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start">
                                    <Shield className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                                    <div>
                                        <h4 className="font-medium text-gray-800">Jaga Kerahasiaan Akun</h4>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Jangan bagikan informasi login Anda kepada siapapun.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start">
                                    <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
                                    <div>
                                        <h4 className="font-medium text-gray-800">Periksa Aktivitas</h4>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Perhatikan aktivitas login yang mencurigakan dan segera ubah password jika diperlukan.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Edit Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-gray-800">Edit Profil</h3>
                                <button
                                    onClick={handleReset}
                                    type="button"
                                    className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
                                >
                                    Reset
                                </button>
                            </div>

                            <form onSubmit={handleUpdateProfile} className="space-y-6">
                                {/* Nama */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <div className="flex items-center">
                                            <User className="w-4 h-4 mr-2" />
                                            Nama Lengkap
                                        </div>
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Masukkan nama lengkap"
                                        required
                                    />
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <div className="flex items-center">
                                            <Mail className="w-4 h-4 mr-2" />
                                            Email
                                        </div>
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="masukkan@email.com"
                                        required
                                    />
                                </div>

                                {/* Password Change Section */}
                                <div className="border-t pt-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="font-medium text-gray-800">Ubah Password</h4>
                                        <button
                                            type="button"
                                            onClick={() => setIsChangePasswordMode(!isChangePasswordMode)}
                                            className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
                                        >
                                            {isChangePasswordMode ? 'Batal Ubah Password' : 'Ubah Password'}
                                        </button>
                                    </div>

                                    {isChangePasswordMode && (
                                        <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                                            {/* Current Password */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Password Saat Ini
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type={showCurrentPassword ? "text" : "password"}
                                                        value={currentPassword}
                                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                                                        placeholder="Masukkan password saat ini"
                                                    />
                                                    <button
                                                        type="button"
                                                        className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                    >
                                                        {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* New Password */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Password Baru
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type={showNewPassword ? "text" : "password"}
                                                        value={newPassword}
                                                        onChange={(e) => setNewPassword(e.target.value)}
                                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                                                        placeholder="Masukkan password baru (minimal 6 karakter)"
                                                        minLength={6}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                                    >
                                                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Confirm Password */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Konfirmasi Password Baru
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type={showConfirmPassword ? "text" : "password"}
                                                        value={confirmPassword}
                                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                                                        placeholder="Konfirmasi password baru"
                                                    />
                                                    <button
                                                        type="button"
                                                        className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    >
                                                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <div className="flex justify-end pt-4">
                                    <button
                                        type="submit"
                                        disabled={updating}
                                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        {updating ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                                                Menyimpan...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-5 h-5 mr-2" />
                                                Simpan Perubahan
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}