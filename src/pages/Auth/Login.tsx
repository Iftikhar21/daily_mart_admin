import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import { useAuth } from "../../context/AuthContext";
import { Eye, EyeOff } from "lucide-react";
import logo from "@/assets/img/logo-daily-mart.svg";

const Login = () => {
    const nav = useNavigate();
    const { login } = useAuth();
    const [msg, setMsg] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    const [form, setForm] = useState({
        email: "",
        password: "",
    });

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await api.post("/login", form);

            if (res.data.user.role !== "admin") {
                setMsg("Hanya admin yang bisa login di web ini.");
                setIsLoading(false);
                return;
            }

            await login(form.email, form.password);

            if (rememberMe) {
                localStorage.setItem('rememberMe', 'true');
            }

            nav("/admin/dashboard");
        } catch (err: any) {
            setMsg(err.response?.data?.message ?? "Gagal login");
        } finally {
            setIsLoading(false);
        }
    };

    const togglePassword = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
            {/* Left Side - Image Section */}
            <div className="w-full md:w-1/2 bg-white flex items-center justify-center p-8 md:p-12 order-1 md:order-1">
                <div className="text-center text-white max-w-md">
                    <div className="mb-6">
                        <img src={logo} alt="Logo" className="w-40 mb-4" />
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full md:w-1/2 bg-[#009145] flex items-center justify-center p-8 md:p-12 order-2 md:order-2">
                <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="p-8">
                        <div className="text-start mb-8">
                            <h1 className="text-3xl font-bold text-[#009145] mb-2">Masuk</h1>
                            <p className="text-gray-600">Silahkan login dengan akun anda</p>
                        </div>

                        {msg && (
                            <div className="mb-4 p-4 rounded-lg bg-red-100 border border-red-400 text-red-700 text-sm">
                                {msg}
                            </div>
                        )}

                        <form onSubmit={submit}>
                            {/* Email */}
                            <div className="mb-6">
                                <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    className="w-full pl-3 pr-3 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#009145] focus:border-transparent transition-colors duration-200"
                                    placeholder="Masukkan email anda"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    required
                                />
                            </div>

                            {/* Password */}
                            <div className="mb-6">
                                <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        name="password"
                                        className="w-full pl-3 pr-12 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#009145] focus:border-transparent transition-colors duration-200"
                                        placeholder="Masukkan password anda"
                                        value={form.password}
                                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={togglePassword}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200 cursor-pointer"
                                    >
                                        {showPassword ? (
                                            <Eye className="w-5 h-5" />
                                        ) : (
                                            <EyeOff className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Remember Me - Redesigned */}
                            <div className="mb-6">
                                <label className="flex items-center cursor-pointer group">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            className="sr-only"
                                            checked={rememberMe}
                                            onChange={(e) => setRememberMe(e.target.checked)}
                                        />
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${rememberMe
                                            ? 'bg-[#009145] border-[#009145] group-hover:bg-[#009145] group-hover:border-[#009145]'
                                            : 'bg-white border-gray-300 group-hover:border-[#009145]'
                                            }`}>
                                            {rememberMe && (
                                                <svg
                                                    className="w-3 h-3 text-white"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={3}
                                                        d="M5 13l4 4L19 7"
                                                    />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                    <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900 transition-colors duration-200">
                                        Ingat Saya
                                    </span>
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-[#009145] cursor-pointer hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Memproses...
                                    </div>
                                ) : (
                                    "Login"
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;