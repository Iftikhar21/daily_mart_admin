import { useEffect, useState } from "react";
import api, { setAuthToken } from "../../api";
import { CircleAlert, Plus, RefreshCcw, Search, SquarePen, Trash2 } from "lucide-react";
import Layout from "../../components/layout/Layout";
import Modal from "../../components/Modal";

interface Branch {
    id: number;
    nama_cabang: string;
    alamat: string;
    no_telp: string;
    latitude: string;
    longitude: string;
    created_at: string;
    updated_at: string;
}

export default function Branch() {
    const [branch, setBranch] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
    const [branchName, setBranchName] = useState("");
    const [alamat, setAlamat] = useState("");
    const [noTelp, setNoTelp] = useState("");
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");


    // State untuk pencarian dan pagination
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);

    // Ambil data cabang
    const fetchBranches = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get("/branches");
            setBranch(res.data || []);
        } catch (err: any) {
            console.error(err);
            if (err.response?.status === 401) {
                setError("Unauthorized: silakan login terlebih dahulu");
            } else {
                setError("Gagal mengambil data cabang");
            }
            setBranch([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            setAuthToken(token); // pasang token
            fetchBranches();
        } else {
            setError("Silakan login terlebih dahulu.");
        }
    }, []);

    // Filter data berdasarkan pencarian
    const filteredBranches = branch.filter(branch =>
        branch.nama_cabang.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentBranches = filteredBranches.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredBranches.length / itemsPerPage);

    // Create / Update
    const handleSave = async () => {
        if (!branchName.trim()) return alert("Nama cabang tidak boleh kosong");
        try {
            if (currentBranch) {
                await api.put(`/branches/${currentBranch.id}`, {
                    nama_cabang: branchName,
                    alamat: alamat,
                    no_telp: noTelp,
                    latitude: latitude,
                    longitude: longitude
                });
            } else {
                await api.post("/branches", {
                    nama_cabang: branchName,
                    alamat: alamat,
                    no_telp: noTelp,
                    latitude: latitude,
                    longitude: longitude
                });
            }
            fetchBranches();
            closeModal();
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.message || "Gagal menyimpan cabang");
        }
    };

    // Delete
    const handleDelete = async (id: number) => {
        if (!confirm("Yakin ingin menghapus cabang ini?")) return;
        try {
            await api.delete(`/branches/${id}`);
            fetchBranches();
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.message || "Gagal menghapus cabang");
        }
    };

    const openModal = (branch?: Branch) => {
        setCurrentBranch(branch || null);
        setBranchName(branch?.nama_cabang || "");
        setAlamat(branch?.alamat || "");
        setNoTelp(branch?.no_telp || "");
        setLatitude(branch?.latitude || "");
        setLongitude(branch?.longitude || "");
        setModalTitle(branch ? "Edit Cabang" : "Tambah Cabang");
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentBranch(null);
        setBranchName("");
        setAlamat("");
        setNoTelp("");
        setLatitude("");
        setLongitude("");
    };

    // Reset pencarian
    const handleSearchReset = () => {
        setSearchTerm("");
        setCurrentPage(1);
    };

    return (
        <Layout title="Cabang">
            <div className="flex flex-col lg:flex-row justify-between lg:items-center bg-white rounded-xl shadow-sm p-6 mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Kelola Cabang</h1>
                    <p className="text-gray-600">Daftar cabang yang tersedia di sistem</p>
                    {error && <p className="text-red-500 mt-1">{error}</p>}
                </div>

                <div className="text-gray-700 text-sm lg:text-base flex flex-col text-left lg:text-right">
                    <span className="font-medium text-2xl text-blue-700">{branch.length}</span>
                    <span>Cabang tersedia</span>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-end mb-4">
                    <button
                        onClick={() => openModal()}
                        className="bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center shadow-sm cursor-pointer"
                    >
                        <Plus className="mr-2" />
                        Tambah Cabang
                    </button>
                </div>
                {/* Search and Stats Bar */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                    <div className="relative w-full md:w-64 mb-4 md:mb-0">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Cari cabang..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                        {searchTerm && (
                            <button
                                onClick={handleSearchReset}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                            >
                                <RefreshCcw className="h-5 w-5 text-gray-400" />
                            </button>
                        )}
                    </div>
                    <div className="text-sm text-gray-500">
                        Menampilkan {currentBranches.length} dari {filteredBranches.length} cabang
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : filteredBranches.length === 0 ? (
                    <div className="text-center py-12">
                        <CircleAlert className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900">Tidak ada cabang</h3>
                        <p className="mt-1 text-gray-500">
                            {searchTerm ? "Tidak ada cabang yang sesuai dengan pencarian Anda." : "Mulai dengan menambahkan cabang pertama Anda."}
                        </p>
                        {!searchTerm && (
                            <div className="mt-6">
                                <button
                                    onClick={() => openModal()}
                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                                >
                                    <Plus className="mr-2" />
                                    Tambah Cabang
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            ID
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Nama Cabang
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Alamat
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            No. Telp
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Latitude
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Longitude
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="bg-white divide-y divide-gray-200">
                                    {currentBranches.map((branch) => (
                                        <tr key={branch.id} className="hover:bg-gray-50 transition-colors duration-150">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                #{branch.id}
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {branch.nama_cabang}
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {branch.alamat}
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {branch.no_telp}
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {branch.latitude}
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {branch.longitude}
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end space-x-2">
                                                    <button
                                                        onClick={() => openModal(branch)}
                                                        className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 flex items-center cursor-pointer"
                                                    >
                                                        <SquarePen className="w-4 h-4 mr-1" />
                                                        Edit
                                                    </button>

                                                    <button
                                                        onClick={() => handleDelete(branch.id)}
                                                        className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 flex items-center cursor-pointer"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-1" />
                                                        Hapus
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-6">
                                <div className="text-sm text-gray-700">
                                    Menampilkan <span className="font-medium">{indexOfFirstItem + 1}</span> sampai <span className="font-medium">
                                        {Math.min(indexOfLastItem, filteredBranches.length)}
                                    </span> dari <span className="font-medium">{filteredBranches.length}</span> hasil
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className={`px-3 py-1.5 rounded-md text-sm font-medium ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
                                    >
                                        Sebelumnya
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className={`px-3 py-1.5 rounded-md text-sm font-medium ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
                                    >
                                        Selanjutnya
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <Modal isOpen={isModalOpen} title={modalTitle} onClose={closeModal}>
                <div className="flex flex-col space-y-4">

                    {/* Nama Cabang */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nama Cabang
                        </label>
                        <input
                            type="text"
                            className="border border-gray-300 px-3 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Masukkan nama cabang"
                            value={branchName}
                            onChange={(e) => setBranchName(e.target.value)}
                            autoFocus
                        />
                    </div>

                    {/* Alamat */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Alamat
                        </label>
                        <input
                            type="text"
                            className="border border-gray-300 px-3 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Masukkan alamat cabang"
                            value={alamat}
                            onChange={(e) => setAlamat(e.target.value)}
                        />
                    </div>

                    {/* No Telp */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nomor Telepon
                        </label>
                        <input
                            type="text"
                            className="border border-gray-300 px-3 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Masukkan nomor telepon"
                            value={noTelp}
                            onChange={(e) => setNoTelp(e.target.value)}
                        />
                    </div>

                    {/* Latitude */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Latitude
                        </label>
                        <input
                            type="text"
                            className="border border-gray-300 px-3 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Contoh: -6.9177093"
                            value={latitude}
                            onChange={(e) => setLatitude(e.target.value)}
                        />
                    </div>

                    {/* Longitude */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Longitude
                        </label>
                        <input
                            type="text"
                            className="border border-gray-300 px-3 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Contoh: 107.6094112"
                            value={longitude}
                            onChange={(e) => setLongitude(e.target.value)}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-3 pt-2">
                        <button
                            onClick={closeModal}
                            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200 cursor-pointer"
                        >
                            Simpan
                        </button>
                    </div>
                </div>
            </Modal>
        </Layout>
    );
}