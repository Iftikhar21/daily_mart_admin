import { useEffect, useState } from "react";
import { ChevronRight, CircleAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api, { setAuthToken } from "../../../api";
import Layout from "../../../components/layout/Layout";

interface Branch {
    id: number;
    nama_cabang: string;
    total_produk?: number;
}

export default function BranchSelect() {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();

    const fetchBranches = async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await api.get("/branches");
            const branchData = res.data || [];

            // Fetch total produk untuk setiap cabang
            const withProductCount = await Promise.all(
                branchData.map(async (branch: Branch) => {
                    try {
                        const productRes = await api.get(`/products/branch/${branch.id}`);
                        const total = productRes.data?.length || 0;

                        return { ...branch, total_produk: total };
                    } catch {
                        return { ...branch, total_produk: 0 };
                    }
                })
            );

            setBranches(withProductCount);
        } catch (err) {
            setError("Gagal memuat data cabang");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            setAuthToken(token);
            fetchBranches();
        } else {
            setError("Silakan login terlebih dahulu.");
        }
    }, []);

    return (
        <Layout title="Pilih Cabang">
            <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-3">Pilih Cabang Produk</h1>
                    <p className="text-gray-500">Silakan pilih cabang untuk melihat daftar produk.</p>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : error ? (
                    <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 rounded-full mb-4">
                            <CircleAlert className="h-8 w-8 text-red-600" />
                        </div>
                        <p className="text-red-600 font-medium text-lg">{error}</p>
                    </div>
                ) : branches.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
                            <CircleAlert className="h-10 w-10 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">Tidak ada cabang</h3>
                        <p className="text-gray-500">Belum ada cabang yang terdaftar</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {branches.map((cabang) => (
                            <button
                                key={cabang.id}
                                onClick={() => navigate(`/admin/produk/${cabang.id}`)}
                                className="group relative p-6 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 text-left cursor-pointer hover:-translate-y-2 overflow-hidden"
                            >
                                {/* Background gradient effect on hover */}
                                <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50 group-hover:from-[#f0f9f4] group-hover:to-[#e0f3e9] transition-all duration-300"></div>

                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <p className="text-xl font-bold text-gray-800 group-hover:text-[#009145] transition-colors">
                                                {cabang.nama_cabang}
                                            </p>
                                            <div className="flex items-center mt-1">
                                                <div className="w-2 h-2 bg-[#009145] rounded-full mr-2 group-hover:scale-110 transition-transform"></div>
                                                <p className="text-gray-600 text-sm font-medium">
                                                    Total produk: {cabang.total_produk}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-gray-400 group-hover:text-[#009145] transition-colors">
                                            <ChevronRight className="h-6 w-6" />
                                        </div>
                                    </div>
                                    <p className="text-gray-500 text-sm font-medium mt-4 group-hover:text-gray-700 transition-colors">
                                        Klik untuk melihat produk
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
}