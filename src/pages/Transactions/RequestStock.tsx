import { useEffect, useState } from "react";
import api, { setAuthToken } from "../../api";
import {
    CircleAlert,
    Plus,
    RefreshCcw,
    Search,
    SquarePen,
    Trash2,
    CheckCircle,
    XCircle,
    Clock,
    Package,
    Calendar,
    Filter
} from "lucide-react";
import Layout from "../../components/layout/Layout";
import Modal from "../../components/Modal";
import Badge from "../../components/Badge";

interface StockRequest {
    id: number;
    branch_id: number;
    petugas_id: number;
    product_id: number;
    qty_request: number;
    keterangan: string | null;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    updated_at: string;
    branch?: {
        id: number;
        nama_cabang: string;
    };
    product?: {
        id: number;
        nama_produk: string;
    };
    petugas?: {
        id: number;
        user_id: number;
        branch_id: number;
        no_hp: string;
        created_at: string;
        updated_at: string;
        user?: {
            id: number;
            name: string;
            email: string;
            role: string;
        };
    };
}

type TabType = 'all' | 'pending' | 'approved' | 'rejected';

export default function StockRequestPage() {
    const [requests, setRequests] = useState<StockRequest[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [currentRequest, setCurrentRequest] = useState<StockRequest | null>(null);
    const [rejectReason, setRejectReason] = useState("");

    // State untuk pencarian, tab, dan filter
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);
    const [activeTab, setActiveTab] = useState<TabType>('all');

    // State untuk filter tanggal
    const [dateFilter, setDateFilter] = useState<string>("");
    const [isDateFilterActive, setIsDateFilterActive] = useState(false);

    // Ambil data stock request
    const fetchStockRequests = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get("/stock-requests");
            setRequests(res.data || []);
        } catch (err: any) {
            console.error(err);
            if (err.response?.status === 401) {
                setError("Unauthorized: silakan login terlebih dahulu");
            } else {
                setError("Gagal mengambil data permintaan stok");
            }
            setRequests([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            setAuthToken(token);
            fetchStockRequests();
        } else {
            setError("Silakan login terlebih dahulu.");
        }
    }, []);

    // Filter data berdasarkan tab aktif, pencarian, dan tanggal
    const filteredRequests = requests.filter(request => {
        // Filter berdasarkan tab
        const matchesTab = activeTab === 'all' || request.status === activeTab;

        // Filter berdasarkan pencarian
        const matchesSearch =
            request.branch?.nama_cabang.toLowerCase().includes(searchTerm.toLowerCase()) ||
            request.product?.nama_produk.toLowerCase().includes(searchTerm.toLowerCase()) ||
            request.petugas?.user?.name.toLowerCase().includes(searchTerm.toLowerCase());

        // Filter berdasarkan tanggal
        let matchesDate = true;
        if (isDateFilterActive && dateFilter) {
            const requestDate = new Date(request.created_at).toISOString().split('T')[0];
            matchesDate = requestDate === dateFilter;
        }

        return matchesTab && matchesSearch && matchesDate;
    });

    // Hitung jumlah untuk setiap tab
    const countByStatus = {
        all: requests.length,
        pending: requests.filter(r => r.status === 'pending').length,
        approved: requests.filter(r => r.status === 'approved').length,
        rejected: requests.filter(r => r.status === 'rejected').length,
    };

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentRequests = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

    // Handle Approve
    const handleApprove = async (id: number) => {
        try {
            await api.put(`/stock-requests/${id}/approve`);
            fetchStockRequests();
            setIsApproveModalOpen(false);
            alert("Permintaan stok berhasil disetujui!");
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.message || "Gagal menyetujui permintaan");
        }
    };

    // Handle Reject
    const handleReject = async (id: number) => {
        if (!rejectReason.trim()) {
            alert("Alasan penolakan harus diisi");
            return;
        }

        try {
            await api.put(`/stock-requests/${id}/reject`, { reason: rejectReason });
            fetchStockRequests();
            setIsRejectModalOpen(false);
            setRejectReason("");
            alert("Permintaan stok berhasil ditolak!");
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.message || "Gagal menolak permintaan");
        }
    };

    const openDetailModal = (request: StockRequest) => {
        setCurrentRequest(request);
        setModalTitle("Detail Permintaan Stok");
        setIsModalOpen(true);
    };

    const openApproveModal = (request: StockRequest) => {
        setCurrentRequest(request);
        setIsApproveModalOpen(true);
    };

    const openRejectModal = (request: StockRequest) => {
        setCurrentRequest(request);
        setIsRejectModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setIsApproveModalOpen(false);
        setIsRejectModalOpen(false);
        setCurrentRequest(null);
        setRejectReason("");
    };

    // Reset semua filter
    const handleResetFilters = () => {
        setSearchTerm("");
        setActiveTab('all');
        setDateFilter("");
        setIsDateFilterActive(false);
        setCurrentPage(1);
    };

    // Toggle filter tanggal
    const toggleDateFilter = () => {
        setIsDateFilterActive(!isDateFilterActive);
        if (!isDateFilterActive) {
            // Set tanggal default ke hari ini jika mengaktifkan filter
            const today = new Date().toISOString().split('T')[0];
            setDateFilter(today);
        }
    };

    // Format tanggal
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Status badge
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge type="warning" text="Pending" icon={<Clock className="w-3 h-3" />} />;
            case 'approved':
                return <Badge type="success" text="Disetujui" icon={<CheckCircle className="w-3 h-3" />} />;
            case 'rejected':
                return <Badge type="danger" text="Ditolak" icon={<XCircle className="w-3 h-3" />} />;
            default:
                return <Badge type="default" text={status} />;
        }
    };

    // Komponen Tab
    const TabButton = ({ tab, label, count }: { tab: TabType, label: string, count: number }) => (
        <button
            onClick={() => {
                setActiveTab(tab);
                setCurrentPage(1);
            }}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === tab
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-100'
                }`}
        >
            {label}
            <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${activeTab === tab
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700'
                }`}>
                {count}
            </span>
        </button>
    );

    return (
        <Layout title="Permintaan Stok">
            <div className="flex flex-col lg:flex-row justify-between lg:items-center bg-white rounded-xl shadow-sm p-6 mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Kelola Permintaan Stok</h1>
                    <p className="text-gray-600">Daftar permintaan stok dari cabang-cabang</p>
                    {error && <p className="text-red-500 mt-1">{error}</p>}
                </div>

                <div className="text-gray-700 text-sm lg:text-base flex flex-col text-left lg:text-right">
                    <span className="font-medium text-2xl text-blue-700">{requests.length}</span>
                    <span>Total Permintaan</span>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm">
                {/* Tabs Navigation */}
                <div className="border-b border-gray-200">
                    <div className="px-6 pt-6">
                        <div className="flex flex-wrap gap-2">
                            <TabButton tab="all" label="Semua" count={countByStatus.all} />
                            <TabButton tab="pending" label="Pending" count={countByStatus.pending} />
                            <TabButton tab="approved" label="Disetujui" count={countByStatus.approved} />
                            <TabButton tab="rejected" label="Ditolak" count={countByStatus.rejected} />
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    {/* Search and Filter Bar */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <div className="flex flex-col md:flex-row gap-4 w-full">
                            <div className="relative w-full md:w-64">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Cari cabang/produk/petugas..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                />
                            </div>

                            {/* Filter Tanggal */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={toggleDateFilter}
                                    className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-all duration-200 ${isDateFilterActive
                                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    <Calendar className="h-5 w-5" />
                                    <span className="text-sm font-medium">Filter Tanggal</span>
                                </button>

                                {isDateFilterActive && (
                                    <input
                                        type="date"
                                        className="border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={dateFilter}
                                        onChange={(e) => {
                                            setDateFilter(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                    />
                                )}
                            </div>

                            {/* Reset Filter Button */}
                            {(searchTerm || activeTab !== 'all' || isDateFilterActive) && (
                                <button
                                    onClick={handleResetFilters}
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                                >
                                    <RefreshCcw className="h-4 w-4" />
                                    Reset Filter
                                </button>
                            )}
                        </div>

                        <div className="text-sm text-gray-500 whitespace-nowrap">
                            Menampilkan {currentRequests.length} dari {filteredRequests.length} permintaan
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    ) : filteredRequests.length === 0 ? (
                        <div className="text-center py-12">
                            <Package className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-4 text-lg font-medium text-gray-900">Tidak ada permintaan stok</h3>
                            <p className="mt-1 text-gray-500">
                                {searchTerm || activeTab !== 'all' || isDateFilterActive
                                    ? "Tidak ada permintaan stok yang sesuai dengan filter Anda."
                                    : "Belum ada permintaan stok yang dibuat."}
                            </p>
                            {(searchTerm || activeTab !== 'all' || isDateFilterActive) && (
                                <button
                                    onClick={handleResetFilters}
                                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                                >
                                    Reset Filter
                                </button>
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
                                                Cabang
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Produk
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Jumlah
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Petugas
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Tanggal
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {currentRequests.map((request) => (
                                            <tr key={request.id} className="hover:bg-gray-50 transition-colors duration-150">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    #{request.id}
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {request.branch?.nama_cabang}
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {request.product?.nama_produk}
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                    {request.qty_request} pcs
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {request.petugas?.user?.name}
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getStatusBadge(request.status)}
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatDate(request.created_at)}
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex justify-end space-x-2">
                                                        <button
                                                            onClick={() => openDetailModal(request)}
                                                            className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 flex items-center cursor-pointer"
                                                        >
                                                            <SquarePen className="w-4 h-4 mr-1" />
                                                            Detail
                                                        </button>

                                                        {request.status === 'pending' && (
                                                            <>
                                                                <button
                                                                    onClick={() => openApproveModal(request)}
                                                                    className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 flex items-center cursor-pointer"
                                                                >
                                                                    <CheckCircle className="w-4 h-4 mr-1" />
                                                                    Approve
                                                                </button>

                                                                <button
                                                                    onClick={() => openRejectModal(request)}
                                                                    className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 flex items-center cursor-pointer"
                                                                >
                                                                    <XCircle className="w-4 h-4 mr-1" />
                                                                    Reject
                                                                </button>
                                                            </>
                                                        )}
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
                                        Menampilkan <span className="font-medium">{indexOfFirstItem + 1}</span> sampai{" "}
                                        <span className="font-medium">
                                            {Math.min(indexOfLastItem, filteredRequests.length)}
                                        </span> dari{" "}
                                        <span className="font-medium">{filteredRequests.length}</span> hasil
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                            className={`px-3 py-1.5 rounded-md text-sm font-medium ${currentPage === 1
                                                ? "text-gray-400 cursor-not-allowed"
                                                : "text-gray-700 hover:bg-gray-100"
                                                }`}
                                        >
                                            Sebelumnya
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                            className={`px-3 py-1.5 rounded-md text-sm font-medium ${currentPage === totalPages
                                                ? "text-gray-400 cursor-not-allowed"
                                                : "text-gray-700 hover:bg-gray-100"
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
            </div>

            {/* Detail Modal */}
            <Modal isOpen={isModalOpen} title={modalTitle} onClose={closeModal}>
                {currentRequest && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-500">ID Permintaan</label>
                                <p className="mt-1 text-sm text-gray-900">#{currentRequest.id}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Status</label>
                                <div className="mt-1">{getStatusBadge(currentRequest.status)}</div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Cabang</label>
                                <p className="mt-1 text-sm text-gray-900">{currentRequest.branch?.nama_cabang}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Produk</label>
                                <p className="mt-1 text-sm text-gray-900">{currentRequest.product?.nama_produk}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Jumlah</label>
                                <p className="mt-1 text-sm text-gray-900 font-medium">
                                    {currentRequest.qty_request} pcs
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Petugas</label>
                                <p className="mt-1 text-sm text-gray-900">{currentRequest.petugas?.user?.name}</p>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-500">Keterangan</label>
                                <p className="mt-1 text-sm text-gray-900">
                                    {currentRequest.keterangan || "-"}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Dibuat</label>
                                <p className="mt-1 text-sm text-gray-500">
                                    {formatDate(currentRequest.created_at)}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Diupdate</label>
                                <p className="mt-1 text-sm text-gray-500">
                                    {formatDate(currentRequest.updated_at)}
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                onClick={closeModal}
                                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200 cursor-pointer"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Approve Confirmation Modal */}
            <Modal isOpen={isApproveModalOpen} title="Konfirmasi Persetujuan" onClose={closeModal}>
                {currentRequest && (
                    <div className="space-y-4">
                        <p className="text-gray-700">
                            Apakah Anda yakin ingin menyetujui permintaan stok ini?
                        </p>
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                            <div className="flex">
                                <div className="ml-3">
                                    <p className="text-sm text-yellow-700">
                                        <strong>Produk:</strong> {currentRequest.product?.nama_produk}<br />
                                        <strong>Jumlah:</strong> {currentRequest.qty_request} pcs<br />
                                        <strong>Cabang:</strong> {currentRequest.branch?.nama_cabang}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3 pt-4">
                            <button
                                onClick={closeModal}
                                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => handleApprove(currentRequest.id)}
                                className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors duration-200 cursor-pointer"
                            >
                                Ya, Setujui
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Reject Modal */}
            <Modal isOpen={isRejectModalOpen} title="Tolak Permintaan Stok" onClose={closeModal}>
                {currentRequest && (
                    <div className="space-y-4">
                        <p className="text-gray-700">
                            Silakan berikan alasan penolakan untuk permintaan stok ini:
                        </p>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-700">
                                <strong>Produk:</strong> {currentRequest.product?.nama_produk}<br />
                                <strong>Jumlah:</strong> {currentRequest.qty_request} pcs<br />
                                <strong>Cabang:</strong> {currentRequest.branch?.nama_cabang}
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Alasan Penolakan *
                            </label>
                            <textarea
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={3}
                                placeholder="Masukkan alasan penolakan..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-end space-x-3 pt-4">
                            <button
                                onClick={closeModal}
                                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => handleReject(currentRequest.id)}
                                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors duration-200 cursor-pointer"
                            >
                                Tolak Permintaan
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </Layout>
    );
}