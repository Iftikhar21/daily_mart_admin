import { useEffect, useState } from "react";
import api, { setAuthToken } from "../../api";
import { CircleAlert, RefreshCcw, Search, Eye, User2, Phone, MapPin, Building } from "lucide-react";
import Layout from "../../components/layout/Layout";
import Modal from "../../components/Modal";

// ==========================
// INTERFACE SESUAI API PELANGGAN
// ==========================
interface Pelanggan {
    id: number;
    user_id: number;
    branch_id: number;
    alamat: string;
    no_hp: string;
    is_guest: number;
    latitude: string;
    longitude: string;
    created_at: string;
    updated_at: string;
    user: {
        id: number;
        name: string;
        email: string;
        role: string;
        created_at: string;
        updated_at: string;
    };
    branch: {
        id: number;
        nama_cabang: string;
        alamat: string;
        no_telp: string;
        latitude: string;
        longitude: string;
        created_at: string;
        updated_at: string;
    };
}

export default function KelolaPelanggan() {
    const [pelanggan, setPelanggan] = useState<Pelanggan[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [detailModal, setDetailModal] = useState(false);
    const [currentPelanggan, setCurrentPelanggan] = useState<Pelanggan | null>(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // ==========================
    // FETCH DATA
    // ==========================
    const fetchPelanggan = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get("/pelanggan");
            setPelanggan(res.data || []);
        } catch (err: any) {
            console.error(err);
            setError("Gagal mengambil data pelanggan");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            setAuthToken(token);
            fetchPelanggan();
        } else {
            setError("Silakan login terlebih dahulu.");
        }
    }, []);

    // ==========================
    // FILTER & PAGINATION
    // ==========================
    const filteredPelanggan = pelanggan.filter((p) => {
        const s = searchTerm.toLowerCase();
        return (
            p.user.name.toLowerCase().includes(s) ||
            p.user.email.toLowerCase().includes(s) ||
            p.no_hp.toLowerCase().includes(s) ||
            p.alamat.toLowerCase().includes(s) ||
            p.branch.nama_cabang.toLowerCase().includes(s)
        );
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredPelanggan.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredPelanggan.length / itemsPerPage);

    return (
        <Layout title="Kelola Pelanggan">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between lg:items-center bg-white rounded-xl shadow-sm p-6 mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Kelola Pelanggan</h1>
                    <p className="text-gray-600">Daftar Pelanggan (Read Only)</p>
                    {error && <p className="text-red-500 mt-1">{error}</p>}
                </div>

                <div className="text-gray-700 text-sm lg:text-base flex flex-col text-left lg:text-right">
                    <span className="font-medium text-2xl text-blue-700">{pelanggan.length}</span>
                    <span>Total Pelanggan</span>
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
                            placeholder="Cari Pelanggan..."
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
                        Menampilkan {currentItems.length} dari {filteredPelanggan.length} pelanggan
                    </div>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-blue-500 rounded-full"></div>
                    </div>
                ) : filteredPelanggan.length === 0 ? (
                    <div className="text-center py-12">
                        <CircleAlert className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900">Tidak ada pelanggan</h3>
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
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">No HP</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cabang</th>
                                        {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th> */}
                                        {/* <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th> */}
                                    </tr>
                                </thead>

                                <tbody className="bg-white divide-y divide-gray-200">
                                    {currentItems.map((p) => (
                                        <tr key={p.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">#{p.id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{p.user.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{p.user.email}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{p.no_hp || "-"}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {p.branch ? (
                                                    <span className="px-2 inline-flex text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                                        {p.branch.nama_cabang}
                                                    </span>
                                                ) : (
                                                    "-"
                                                )}
                                            </td>
                                            {/* <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs font-semibold rounded-full ${p.is_guest === 1
                                                    ? "bg-yellow-100 text-yellow-800"
                                                    : "bg-blue-100 text-blue-800"
                                                    }`}>
                                                    {p.is_guest === 1 ? "Guest" : "Reguler"}
                                                </span>
                                            </td> */}
                                            {/* <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => {
                                                        setCurrentPelanggan(p);
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
                                    {Math.min(indexOfLastItem, filteredPelanggan.length)} dari{" "}
                                    {filteredPelanggan.length}
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
            <Modal isOpen={detailModal} title="Detail Pelanggan" onClose={() => setDetailModal(false)}>
                {currentPelanggan && (
                    <div className="space-y-6 p-1">
                        <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-full">
                                <User2 className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg text-gray-800">{currentPelanggan.user.name}</h3>
                                <p className="text-gray-600">{currentPelanggan.user.email}</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    {currentPelanggan.is_guest === 1 ? "Guest" : "Pelanggan Reguler"}
                                </p>
                            </div>
                            <div className="ml-auto">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                                    {currentPelanggan.user.role}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-4">
                                <h4 className="font-medium text-gray-700 border-b pb-2">Informasi Kontak</h4>
                                {currentPelanggan.no_hp && (
                                    <div className="flex items-start space-x-3">
                                        <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-gray-500 text-sm">Telepon</p>
                                            <p className="font-medium text-gray-800">{currentPelanggan.no_hp}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-start space-x-3">
                                    <User2 className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-gray-500 text-sm">ID User</p>
                                        <p className="font-medium text-gray-800">#{currentPelanggan.user_id}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-medium text-gray-700 border-b pb-2">Informasi Cabang</h4>
                                {currentPelanggan.branch && (
                                    <>
                                        <div className="flex items-start space-x-3">
                                            <Building className="w-5 h-5 text-gray-400 mt-0.5" />
                                            <div>
                                                <p className="text-gray-500 text-sm">Cabang</p>
                                                <p className="font-medium text-gray-800">{currentPelanggan.branch.nama_cabang}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start space-x-3">
                                            <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                                            <div>
                                                <p className="text-gray-500 text-sm">Telepon Cabang</p>
                                                <p className="font-medium text-gray-800">{currentPelanggan.branch.no_telp}</p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Alamat */}
                        <div className="space-y-4 pt-4 border-t">
                            <h4 className="font-medium text-gray-700">Alamat Lengkap</h4>
                            <div className="flex items-start space-x-3">
                                <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-gray-700">{currentPelanggan.alamat}</p>
                                    <div className="flex gap-4 mt-2 text-sm text-gray-500">
                                        <span>Lat: {currentPelanggan.latitude}</span>
                                        <span>Long: {currentPelanggan.longitude}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Informasi Waktu */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                            <div className="space-y-2">
                                <h4 className="font-medium text-gray-700 border-b pb-2">Informasi Waktu</h4>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 text-sm">Bergabung</span>
                                    <span className="font-medium">
                                        {new Date(currentPelanggan.user.created_at).toLocaleString('id-ID')}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 text-sm">Terakhir Diupdate</span>
                                    <span className="font-medium">
                                        {new Date(currentPelanggan.user.updated_at).toLocaleString('id-ID')}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-medium text-gray-700 border-b pb-2">Koordinat</h4>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 text-sm">Latitude</span>
                                    <span className="font-medium">{currentPelanggan.latitude}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 text-sm">Longitude</span>
                                    <span className="font-medium">{currentPelanggan.longitude}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </Layout>
    );
}