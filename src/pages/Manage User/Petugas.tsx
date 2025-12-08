import { useEffect, useState } from "react";
import api, { setAuthToken } from "../../api";
import { CircleAlert, RefreshCcw, Search, Eye, User2, Phone, CheckCircle } from "lucide-react";
import Layout from "../../components/layout/Layout";
import Modal from "../../components/Modal";

// ==========================
// INTERFACE SESUAI API
// ==========================
interface Petugas {
    id: number;
    user_id: number;
    no_hp: string;
    user: {
        id: number;
        name: string;
        email: string;
        role: string;
    };
    branch: {
        id: number;
        nama_cabang: string;
    } | null;
}

export default function KelolaPetugas() {
    const [petugas, setPetugas] = useState<Petugas[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [detailModal, setDetailModal] = useState(false);
    const [currentPetugas, setCurrentPetugas] = useState<Petugas | null>(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // ==========================
    // FETCH DATA
    // ==========================
    const fetchPetugas = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get("/petugas");
            setPetugas(res.data || []);
        } catch (err: any) {
            console.error(err);
            setError("Gagal mengambil data petugas");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            setAuthToken(token);
            fetchPetugas();
        } else {
            setError("Silakan login terlebih dahulu.");
        }
    }, []);

    // ==========================
    // FILTER & PAGINATION
    // ==========================
    const filteredPetugas = petugas.filter((p) => {
        const s = searchTerm.toLowerCase();
        return (
            p.user.name.toLowerCase().includes(s) ||
            p.user.email.toLowerCase().includes(s) ||
            (p.branch?.nama_cabang?.toLowerCase() || "").includes(s)
        );
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredPetugas.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredPetugas.length / itemsPerPage);

    return (
        <Layout title="Kelola Petugas">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between lg:items-center bg-white rounded-xl shadow-sm p-6 mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Kelola Petugas</h1>
                    <p className="text-gray-600">Daftar Petugas (Read Only)</p>
                    {error && <p className="text-red-500 mt-1">{error}</p>}
                </div>

                <div className="text-gray-700 text-sm lg:text-base flex flex-col text-left lg:text-right">
                    <span className="font-medium text-2xl text-blue-700">{petugas.length}</span>
                    <span>Total Petugas</span>
                </div>
            </div>

            {/* Table controls */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                {/* Search */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-2 md:space-y-0 md:space-x-4">
                    <div className="relative w-full md:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Cari Petugas..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => {
                                    setSearchTerm("");
                                    setCurrentPage(1);
                                }}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                                <RefreshCcw className="h-5 w-5 text-gray-400" />
                            </button>
                        )}
                    </div>

                    {/* Reset */}
                    <button
                        onClick={() => {
                            setSearchTerm("");
                            setCurrentPage(1);
                        }}
                        className="px-4 py-3 rounded-lg border border-gray-500 hover:bg-gray-300 text-sm font-medium text-blue-700 flex items-center"
                    >
                        <RefreshCcw className="h-4 w-4 mr-2" />
                        Reset
                    </button>

                    <div className="text-sm text-gray-500 md:ml-auto">
                        Menampilkan {currentItems.length} dari {filteredPetugas.length} petugas
                    </div>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-blue-500 rounded-full"></div>
                    </div>
                ) : filteredPetugas.length === 0 ? (
                    <div className="text-center py-12">
                        <CircleAlert className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900">Tidak ada petugas</h3>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cabang</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">No HP</th>
                                        {/* <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th> */}
                                    </tr>
                                </thead>

                                <tbody className="bg-white divide-y divide-gray-200">
                                    {currentItems.map((p) => (
                                        <tr key={p.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">#{p.id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{p.user.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{p.user.email}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {p.branch ? (
                                                    <span className="px-2 inline-flex text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                                        {p.branch.nama_cabang}
                                                    </span>
                                                ) : (
                                                    "-"
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">{p.no_hp || "-"}</td>

                                            {/* Detail only */}
                                            {/* <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => {
                                                        setCurrentPetugas(p);
                                                        setDetailModal(true);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md text-sm flex items-center ml-auto"
                                                >
                                                    <Eye className="w-4 h-4 mr-1" /> Detail
                                                </button>
                                            </td> */}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-6">
                                <div className="text-sm text-gray-700">
                                    Menampilkan {indexOfFirstItem + 1} -{" "}
                                    {Math.min(indexOfLastItem, filteredPetugas.length)} dari{" "}
                                    {filteredPetugas.length}
                                </div>

                                <div className="flex space-x-2">
                                    <button
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                        className={`px-3 py-1.5 rounded-md text-sm ${currentPage === 1 ? "text-gray-400 cursor-not-allowed" : "text-gray-700 hover:bg-gray-100"
                                            }`}
                                    >
                                        Sebelumnya
                                    </button>

                                    <button
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                                        className={`px-3 py-1.5 rounded-md text-sm ${currentPage === totalPages ? "text-gray-400 cursor-not-allowed" : "text-gray-700 hover:bg-gray-100"
                                            }`}
                                    >
                                        Selanjutnya
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modal Detail */}
            <Modal isOpen={detailModal} title="Detail Petugas" onClose={() => setDetailModal(false)}>
                {currentPetugas && (
                    <div className="space-y-6 p-1">
                        <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-full">
                                <User2 className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg text-gray-800">{currentPetugas.user.name}</h3>
                                <p className="text-gray-600">{currentPetugas.user.email}</p>
                            </div>
                            <div className="ml-auto">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                                    {currentPetugas.user.role}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-4">
                                <h4 className="font-medium text-gray-700 border-b pb-2">Informasi Kontak</h4>
                                {currentPetugas.no_hp && (
                                    <div className="flex items-start space-x-3">
                                        <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-gray-500 text-sm">Telepon</p>
                                            <p className="font-medium text-gray-800">{currentPetugas.no_hp}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-medium text-gray-700 border-b pb-2">Informasi Cabang</h4>
                                {currentPetugas.branch && (
                                    <div className="flex items-start space-x-3">
                                        <CheckCircle className="w-5 h-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-gray-500 text-sm">Cabang</p>
                                            <p className="font-medium text-gray-800">{currentPetugas.branch.nama_cabang}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </Layout>
    );
}