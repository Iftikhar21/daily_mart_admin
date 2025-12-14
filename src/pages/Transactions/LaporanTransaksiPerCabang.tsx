import { useEffect, useState, useRef } from "react";
import api, { setAuthToken } from "../../api";
import {
    CircleAlert,
    Search,
    RefreshCcw,
    Download,
    Filter,
    TrendingUp,
    DollarSign,
    Package,
    ShoppingCart,
    Calendar,
    Building,
    Printer,
    FileText,
    ChevronDown,
    Eye,
    User,
    Truck,
    CheckCircle,
    XCircle,
    Clock,
    CreditCard,
    Wallet
} from "lucide-react";
import Layout from "../../components/layout/Layout";
import Modal from "../../components/Modal";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface Branch {
    id: number;
    nama_cabang: string;
    alamat: string;
    no_telp: string;
}

interface Transaction {
    id: number;
    branch_id: number;
    pelanggan_id: number | null;
    petugas_id: number | null;
    kurir_id: number | null;
    is_online: boolean;
    total: number;
    payment_method: string;
    status: 'pending' | 'paid' | 'completed' | 'cancelled';
    delivery_status: string;
    created_at: string;
    updated_at: string;
    details: TransactionDetail[];
    pelanggan: {
        id: number;
        no_hp: string;
        user: {
            name: string;
        };
    } | null;
    petugas: {
        id: number;
        user: {
            name: string;
            email: string;
        };
    } | null;
    kurir: {
        id: number;
        user: {
            name: string;
            email: string;
        };
    } | null;
    branch: {
        id: number;
        nama_cabang: string;
    };
}

interface TransactionDetail {
    id: number;
    product: {
        id: number;
        nama_produk: string;
        harga: number;
        kategori: {
            nama_kategori: string;
        };
    };
    qty: number;
    subtotal: number;
}

interface SummaryData {
    total_transactions: number;
    total_revenue: number;
    average_transaction: number;
    completed_count: number;
    cancelled_count: number;
    pending_count: number;
    paid_count: number;
}

interface DailySalesData {
    date: string;
    transaction_count: number;
    total_sales: number;
    average_sales: number;
}

export default function LaporanTransaksiPerCabang() {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [selectedBranch, setSelectedBranch] = useState<string>("");
    const [selectedBranchData, setSelectedBranchData] = useState<Branch | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [summary, setSummary] = useState<SummaryData | null>(null);
    const [dailySales, setDailySales] = useState<DailySalesData[]>([]);

    const [loading, setLoading] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);
    const [loadingBranches, setLoadingBranches] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filter states
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [searchTerm, setSearchTerm] = useState("");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // Modal
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

    // Ref untuk chart
    const chartRef = useRef(null);

    // Ambil daftar cabang
    const fetchBranches = async () => {
        setLoadingBranches(true);
        try {
            const res = await api.get("/branches");
            setBranches(res.data || []);
        } catch (err: any) {
            console.error(err);
            setError("Gagal mengambil data cabang");
        } finally {
            setLoadingBranches(false);
        }
    };

    // Ambil laporan transaksi
    const fetchReport = async (page = 1) => {
        if (!selectedBranch) return;

        setLoading(true);
        setError(null);

        try {
            const params: any = {
                branch_id: selectedBranch,
                page,
                per_page: itemsPerPage
            };

            if (startDate) {
                params.start_date = format(startDate, 'yyyy-MM-dd');
            }
            if (endDate) {
                params.end_date = format(endDate, 'yyyy-MM-dd');
            }
            if (statusFilter !== "all") {
                params.status = statusFilter;
            }
            if (typeFilter !== "all") {
                params.is_online = typeFilter === "online" ? 1 : 0;
            }

            console.log('Fetching report with params:', params);

            const res = await api.get("/laporan/branch-transactions", { params });

            console.log('API Response:', res.data); 

            if (res.data && res.data.transactions) {
                setTransactions(res.data.transactions.data || []);
                setTotalPages(res.data.transactions.last_page || 1);
                setTotalItems(res.data.transactions.total || 0);
            } else {
                setTransactions(res.data || []);
                setTotalPages(1);
                setTotalItems(res.data?.length || 0);
            }

            setSummary(res.data.summary || null);

            // Ambil data cabang yang dipilih
            const branch = branches.find(b => b.id.toString() === selectedBranch);
            setSelectedBranchData(branch || null);

            // Ambil data harian untuk chart jika ada filter tanggal
            if (startDate && endDate) {
                fetchDailySalesData();
            }
        } catch (err: any) {
            console.error('Error details:', {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status
            });
            setError(err.response?.data?.message || "Gagal mengambil data laporan");
        } finally {
            setLoading(false);
        }
    };

    // Hitung summary manual dari data transaksi
    const calculateSummary = (data: Transaction[]) => {
        const summary: SummaryData = {
            total_transactions: data.length,
            total_revenue: data.reduce((sum, item) => sum + item.total, 0),
            average_transaction: data.length > 0
                ? data.reduce((sum, item) => sum + item.total, 0) / data.length
                : 0,
            completed_count: data.filter(item => item.status === 'completed').length,
            cancelled_count: data.filter(item => item.status === 'cancelled').length,
            pending_count: data.filter(item => item.status === 'pending').length,
            paid_count: data.filter(item => item.status === 'paid').length
        };
        setSummary(summary);
    };

    // Ambil data harian untuk chart
    const fetchDailySalesData = async () => {
        if (!selectedBranch || !startDate || !endDate) return;

        try {
            const params = {
                branch_id: selectedBranch,
                start_date: format(startDate, 'yyyy-MM-dd'),
                end_date: format(endDate, 'yyyy-MM-dd')
            };

            const res = await api.get("/laporan/daily-sales", { params });
            setDailySales(res.data || []);
        } catch (err) {
            console.error("Error fetching chart data:", err);
        }
    };

    // Filter transaksi berdasarkan search term
    const filteredTransactions = transactions.filter(transaction => {
        const searchLower = searchTerm.toLowerCase();
        return (
            transaction.id.toString().includes(searchLower) ||
            transaction.pelanggan?.nama.toLowerCase().includes(searchLower) ||
            transaction.payment_method.toLowerCase().includes(searchLower) ||
            transaction.status.toLowerCase().includes(searchLower)
        );
    });

    // Pagination untuk transaksi yang sudah difilter
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentTransactions = filteredTransactions.slice(indexOfFirstItem, Math.min(indexOfLastItem, filteredTransactions.length));
    const filteredTotalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

    // Export to Excel dengan XLSX
    const exportToExcel = () => {
        if (!selectedBranch || transactions.length === 0) {
            alert("Tidak ada data untuk diekspor");
            return;
        }

        setExportLoading(true);
        try {
            // Siapkan data untuk excel
            const excelData = [];

            // Header utama
            excelData.push(["LAPORAN TRANSAKSI PER CABANG"]);
            excelData.push([`Cabang: ${selectedBranchData?.nama_cabang}`]);
            excelData.push([`Periode: ${startDate ? format(startDate, 'dd/MM/yyyy') : 'Semua'} - ${endDate ? format(endDate, 'dd/MM/yyyy') : 'Semua'}`]);
            excelData.push([`Tanggal Ekspor: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`]);
            excelData.push([]);

            // Summary
            excelData.push(["SUMMARY"]);
            excelData.push(["Total Transaksi", summary?.total_transactions || 0]);
            excelData.push(["Total Pendapatan", formatCurrency(summary?.total_revenue || 0, false)]);
            excelData.push(["Rata-rata Transaksi", formatCurrency(summary?.average_transaction || 0, false)]);
            excelData.push(["Transaksi Selesai", summary?.completed_count || 0]);
            excelData.push(["Transaksi Dibatalkan", summary?.cancelled_count || 0]);
            excelData.push(["Transaksi Pending", summary?.pending_count || 0]);
            excelData.push(["Transaksi Dibayar", summary?.paid_count || 0]);
            excelData.push([]);

            // Header tabel
            excelData.push([
                "No",
                "ID Transaksi",
                "Tanggal",
                "Jenis",
                "Pelanggan",
                "Petugas",
                "Kurir",
                "Total",
                "Pembayaran",
                "Status",
                "Pengiriman",
                "Produk",
                "Qty",
                "Subtotal"
            ]);

            // Data transaksi
            transactions.forEach((transaction, index) => {
                if (transaction.details.length > 0) {
                    transaction.details.forEach((detail, detailIndex) => {
                        excelData.push([
                            detailIndex === 0 ? index + 1 : "",
                            detailIndex === 0 ? transaction.id : "",
                            detailIndex === 0 ? format(new Date(transaction.created_at), 'dd/MM/yyyy HH:mm') : "",
                            detailIndex === 0 ? (transaction.is_online ? "Online" : "Offline") : "",
                            detailIndex === 0 ? (transaction.pelanggan?.user?.name || "Walk-in") : "",
                            detailIndex === 0 ? (transaction.petugas?.user.name || "-") : "",
                            detailIndex === 0 ? (transaction.kurir?.user.name || "-") : "",
                            detailIndex === 0 ? formatCurrency(transaction.total, false) : "",
                            detailIndex === 0 ? formatPaymentMethod(transaction.payment_method) : "",
                            detailIndex === 0 ? formatStatus(transaction.status) : "",
                            detailIndex === 0 ? formatDeliveryStatus(transaction.delivery_status) : "",
                            detail.product.nama_produk,
                            detail.qty,
                            formatCurrency(detail.subtotal, false)
                        ]);
                    });
                } else {
                    excelData.push([
                        index + 1,
                        transaction.id,
                        format(new Date(transaction.created_at), 'dd/MM/yyyy HH:mm'),
                        transaction.is_online ? "Online" : "Offline",
                        transaction.pelanggan?.user?.name || "Walk-in",
                        transaction.petugas?.user.name || "-",
                        transaction.kurir?.user.name || "-",
                        formatCurrency(transaction.total, false),
                        formatPaymentMethod(transaction.payment_method),
                        formatStatus(transaction.status),
                        formatDeliveryStatus(transaction.delivery_status),
                        "-",
                        0,
                        "Rp 0"
                    ]);
                }

                // Baris kosong antar transaksi
                if (index < transactions.length - 1) {
                    excelData.push([]);
                }
            });

            // Total summary
            excelData.push([]);
            excelData.push(["TOTAL KESELURUHAN", "", "", "", "", "", "",
                formatCurrency(summary?.total_revenue || 0, false)]);

            // Buat worksheet
            const ws = XLSX.utils.aoa_to_sheet(excelData);

            // Atur lebar kolom
            const wscols = [
                { wch: 5 },  // No
                { wch: 10 }, // ID
                { wch: 18 }, // Tanggal
                { wch: 8 },  // Jenis
                { wch: 20 }, // Pelanggan
                { wch: 15 }, // Petugas
                { wch: 15 }, // Kurir
                { wch: 15 }, // Total
                { wch: 12 }, // Pembayaran
                { wch: 12 }, // Status
                { wch: 15 }, // Pengiriman
                { wch: 25 }, // Produk
                { wch: 8 },  // Qty
                { wch: 15 }, // Subtotal
            ];
            ws['!cols'] = wscols;

            // Buat workbook
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Laporan Transaksi");

            // Generate file
            const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

            // Nama file
            const branchName = selectedBranchData?.nama_cabang.replace(/\s+/g, '_') || 'cabang';
            const fileName = `Laporan_Transaksi_${branchName}_${format(new Date(), 'yyyy-MM-dd_HHmm')}.xlsx`;

            // Download file
            saveAs(data, fileName);

        } catch (err) {
            console.error("Export error:", err);
            alert("Gagal mengekspor data");
        } finally {
            setExportLoading(false);
        }
    };

    // Export to PDF (menggunakan print)
    const exportToPDF = () => {
        window.print();
    };

    // Export to CSV
    const exportToCSV = () => {
        if (!selectedBranch || transactions.length === 0) {
            alert("Tidak ada data untuk diekspor");
            return;
        }

        try {
            const csvData = [];

            // Header
            csvData.push([
                "ID Transaksi",
                "Tanggal",
                "Jenis",
                "Pelanggan",
                "Total",
                "Pembayaran",
                "Status",
                "Pengiriman",
                "Produk",
                "Qty",
                "Subtotal"
            ].join(','));

            // Data
            transactions.forEach(transaction => {
                if (transaction.details.length > 0) {
                    transaction.details.forEach(detail => {
                        csvData.push([
                            transaction.id,
                            format(new Date(transaction.created_at), 'dd/MM/yyyy HH:mm'),
                            transaction.is_online ? "Online" : "Offline",
                            transaction.pelanggan?.user?.name || "Walk-in",
                            transaction.total,
                            transaction.payment_method,
                            transaction.status,
                            transaction.delivery_status,
                            detail.product.nama_produk,
                            detail.qty,
                            detail.subtotal
                        ].join(','));
                    });
                }
            });

            // Create CSV file
            const csvContent = csvData.join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const branchName = selectedBranchData?.nama_cabang.replace(/\s+/g, '_') || 'cabang';
            const fileName = `Laporan_Transaksi_${branchName}_${format(new Date(), 'yyyy-MM-dd')}.csv`;

            saveAs(blob, fileName);
        } catch (err) {
            console.error("CSV export error:", err);
            alert("Gagal mengekspor ke CSV");
        }
    };

    // Format currency
    const formatCurrency = (amount: number, withSymbol = true) => {
        if (!amount) return withSymbol ? 'Rp 0' : '0';
        const formatted = new Intl.NumberFormat('id-ID').format(amount);
        return withSymbol ? `Rp ${formatted}` : formatted;
    };

    // Format status
    const formatStatus = (status: string) => {
        switch (status) {
            case 'pending': return 'Pending';
            case 'paid': return 'Dibayar';
            case 'completed': return 'Selesai';
            case 'cancelled': return 'Dibatalkan';
            default: return status;
        }
    };

    // Format payment method
    const formatPaymentMethod = (method: string) => {
        switch (method) {
            case 'cash': return 'Tunai';
            case 'transfer': return 'Transfer';
            case 'ewallet': return 'E-Wallet';
            default: return method;
        }
    };

    // Format delivery status
    const formatDeliveryStatus = (status: string) => {
        return status.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    // Get status icon
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircle className="w-4 h-4" />;
            case 'cancelled': return <XCircle className="w-4 h-4" />;
            case 'pending': return <Clock className="w-4 h-4" />;
            case 'paid': return <CheckCircle className="w-4 h-4" />;
            default: return null;
        }
    };

    // Get payment method icon
    const getPaymentMethodIcon = (method: string) => {
        switch (method) {
            case 'cash': return <Wallet className="w-4 h-4" />;
            case 'transfer': return <CreditCard className="w-4 h-4" />;
            case 'ewallet': return <CreditCard className="w-4 h-4" />;
            default: return <CreditCard className="w-4 h-4" />;
        }
    };

    // Handle branch change
    const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const branchId = e.target.value;
        setSelectedBranch(branchId);
        setCurrentPage(1);

        // Find branch data
        const branch = branches.find(b => b.id.toString() === branchId);
        setSelectedBranchData(branch || null);
    };

    // Apply filters
    const applyFilters = () => {
        setCurrentPage(1);
        fetchReport(1);
        setIsFilterModalOpen(false);
    };

    // Reset filters
    const resetFilters = () => {
        setStartDate(null);
        setEndDate(null);
        setStatusFilter("all");
        setTypeFilter("all");
        setSearchTerm("");
        setCurrentPage(1);
    };

    // Open transaction detail
    const openTransactionDetail = (transaction: Transaction) => {
        setSelectedTransaction(transaction);
        setIsDetailModalOpen(true);
    };

    // Initialize
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            setAuthToken(token);
            fetchBranches();
        } else {
            setError("Silakan login terlebih dahulu.");
        }
    }, []);

    // Fetch report when branch changes
    useEffect(() => {
        if (selectedBranch) {
            fetchReport();
        }
    }, [selectedBranch]);

    // Chart data
    const chartData = {
        labels: dailySales.map(item => format(new Date(item.date), 'dd/MM')),
        datasets: [
            {
                label: 'Total Penjualan (Rp)',
                data: dailySales.map(item => item.total_sales),
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4,
                yAxisID: 'y',
            },
            {
                label: 'Jumlah Transaksi',
                data: dailySales.map(item => item.transaction_count),
                borderColor: 'rgb(16, 185, 129)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4,
                yAxisID: 'y1',
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        interaction: {
            mode: 'index' as const,
            intersect: false,
        },
        stacked: false,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: 'Trend Penjualan Harian'
            }
        },
        scales: {
            y: {
                type: 'linear' as const,
                display: true,
                position: 'left' as const,
                title: {
                    display: true,
                    text: 'Total Penjualan (Rp)'
                },
                ticks: {
                    callback: function (value: any) {
                        return 'Rp ' + new Intl.NumberFormat('id-ID').format(value);
                    }
                }
            },
            y1: {
                type: 'linear' as const,
                display: true,
                position: 'right' as const,
                title: {
                    display: true,
                    text: 'Jumlah Transaksi'
                },
                grid: {
                    drawOnChartArea: false,
                },
            },
        },
    };

    return (
        <Layout title="Laporan Transaksi Per Cabang">
            <div className="flex flex-col lg:flex-row justify-between lg:items-center bg-white rounded-xl shadow-sm p-6 mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Laporan Transaksi Per Cabang</h1>
                    <p className="text-gray-600">Analisis dan monitoring transaksi per cabang</p>
                    {error && <p className="text-red-500 mt-1">{error}</p>}
                </div>

                <div className="flex items-center space-x-2">
                    <button
                        onClick={exportToExcel}
                        disabled={exportLoading || !selectedBranch || transactions.length === 0}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        {exportLoading ? "Mengekspor..." : "Excel"}
                    </button>

                    <button
                        onClick={exportToCSV}
                        disabled={!selectedBranch || transactions.length === 0}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FileText className="w-4 h-4 mr-2" />
                        CSV
                    </button>

                    <button
                        onClick={exportToPDF}
                        disabled={!selectedBranch || transactions.length === 0}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Printer className="w-4 h-4 mr-2" />
                        Print
                    </button>
                </div>
            </div>

            {/* Branch Selection Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="w-full md:w-auto">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Pilih Cabang <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <select
                                value={selectedBranch}
                                onChange={handleBranchChange}
                                className="block w-full md:w-64 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer"
                                disabled={loadingBranches}
                            >
                                <option value="">-- Pilih Cabang --</option>
                                {branches.map((branch) => (
                                    <option key={branch.id} value={branch.id}>
                                        {branch.nama_cabang}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setIsFilterModalOpen(true)}
                            className="flex items-center px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                        >
                            <Filter className="w-4 h-4 mr-2" />
                            Filter
                        </button>

                        <button
                            onClick={resetFilters}
                            className="flex items-center px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                        >
                            <RefreshCcw className="w-4 h-4 mr-2" />
                            Reset
                        </button>
                    </div>
                </div>

                {/* Branch Info */}
                {selectedBranchData && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex flex-col md:flex-row md:items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">{selectedBranchData.nama_cabang}</h3>
                                <p className="text-gray-600 text-sm mt-1">{selectedBranchData.alamat}</p>
                                <p className="text-gray-600 text-sm">Telp: {selectedBranchData.no_telp}</p>
                            </div>
                            <div className="mt-2 md:mt-0">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                    <Building className="w-4 h-4 mr-1" />
                                    Cabang Aktif
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Summary Cards */}
            {summary && selectedBranch && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Transaksi</p>
                                <p className="text-2xl font-bold text-gray-900 mt-2">{summary.total_transactions}</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <ShoppingCart className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Pendapatan</p>
                                <p className="text-2xl font-bold text-gray-900 mt-2">
                                    {formatCurrency(summary.total_revenue)}
                                </p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-lg">
                                <DollarSign className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Rata-rata Transaksi</p>
                                <p className="text-2xl font-bold text-gray-900 mt-2">
                                    {formatCurrency(summary.average_transaction)}
                                </p>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <TrendingUp className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Transaksi Selesai</p>
                                <p className="text-2xl font-bold text-gray-900 mt-2">{summary.completed_count}</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    {summary.total_transactions > 0
                                        ? `${Math.round((summary.completed_count / summary.total_transactions) * 100)}% selesai`
                                        : '0% selesai'
                                    }
                                </p>
                            </div>
                            <div className="p-3 bg-emerald-100 rounded-lg">
                                <CheckCircle className="w-6 h-6 text-emerald-600" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Chart Section */}
            {dailySales.length > 0 && selectedBranch && (
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-800">Grafik Tren Penjualan</h3>
                        <div className="text-sm text-gray-500">
                            Periode: {startDate && format(startDate, 'dd/MM/yyyy')} - {endDate && format(endDate, 'dd/MM/yyyy')}
                        </div>
                    </div>
                    <div className="h-80">
                        <Line ref={chartRef} data={chartData} options={chartOptions} />
                    </div>
                </div>
            )}

            {/* Transactions Table */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div className="relative w-full md:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Cari transaksi..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>

                    <div className="text-sm text-gray-500">
                        Menampilkan {currentTransactions.length} dari {filteredTransactions.length} transaksi
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : !selectedBranch ? (
                    <div className="text-center py-12">
                        <Building className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900">Pilih Cabang</h3>
                        <p className="mt-1 text-gray-500">Silakan pilih cabang untuk melihat laporan transaksi</p>
                    </div>
                ) : filteredTransactions.length === 0 ? (
                    <div className="text-center py-12">
                        <CircleAlert className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900">Tidak ada transaksi</h3>
                        <p className="mt-1 text-gray-500">
                            {searchTerm
                                ? "Tidak ada transaksi yang sesuai dengan pencarian Anda."
                                : "Tidak ada transaksi pada periode yang dipilih."
                            }
                        </p>
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
                                            Tanggal
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Jenis
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Pelanggan
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="bg-white divide-y divide-gray-200">
                                    {currentTransactions.map((transaction) => (
                                        <tr key={transaction.id} className="hover:bg-gray-50 transition-colors duration-150">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                #{transaction.id}
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {format(new Date(transaction.created_at), 'dd/MM/yyyy HH:mm')}
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${transaction.is_online
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : 'bg-purple-100 text-purple-800'
                                                    }`}>
                                                    {transaction.is_online ? 'Online' : 'Offline'}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <div className="flex items-center">
                                                    <User className="w-4 h-4 mr-2 text-gray-400" />
                                                    {transaction.pelanggan?.user?.name || "Walk-in"}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                                {formatCurrency(transaction.total)}
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col gap-1">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                            transaction.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                                transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                    'bg-blue-100 text-blue-800'
                                                        }`}>
                                                        {getStatusIcon(transaction.status)}
                                                        <span className="ml-1">{formatStatus(transaction.status)}</span>
                                                    </span>

                                                    {transaction.is_online && (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                            <Truck className="w-3 h-3 mr-1" />
                                                            {formatDeliveryStatus(transaction.delivery_status)}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => openTransactionDetail(transaction)}
                                                    className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 flex items-center cursor-pointer"
                                                >
                                                    <Eye className="w-4 h-4 mr-1" />
                                                    Detail
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {filteredTotalPages > 1 && (
                            <div className="flex items-center justify-between mt-6">
                                <div className="text-sm text-gray-700">
                                    Menampilkan <span className="font-medium">{indexOfFirstItem + 1}</span> sampai{" "}
                                    <span className="font-medium">
                                        {Math.min(indexOfLastItem, filteredTransactions.length)}
                                    </span> dari{" "}
                                    <span className="font-medium">{filteredTransactions.length}</span> transaksi
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
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, filteredTotalPages))}
                                        disabled={currentPage === filteredTotalPages}
                                        className={`px-3 py-1.5 rounded-md text-sm font-medium ${currentPage === filteredTotalPages
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

            {/* Filter Modal */}
            <Modal isOpen={isFilterModalOpen} title="Filter Laporan" onClose={() => setIsFilterModalOpen(false)}>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tanggal Mulai
                            </label>
                            <DatePicker
                                selected={startDate}
                                onChange={(date) => setStartDate(date)}
                                dateFormat="dd/MM/yyyy"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholderText="Pilih tanggal mulai"
                                isClearable
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tanggal Akhir
                            </label>
                            <DatePicker
                                selected={endDate}
                                onChange={(date) => setEndDate(date)}
                                dateFormat="dd/MM/yyyy"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholderText="Pilih tanggal akhir"
                                isClearable
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Status Transaksi
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Semua Status</option>
                            <option value="pending">Pending</option>
                            <option value="paid">Dibayar</option>
                            <option value="completed">Selesai</option>
                            <option value="cancelled">Dibatalkan</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Jenis Transaksi
                        </label>
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Semua Jenis</option>
                            <option value="online">Online</option>
                            <option value="offline">Offline</option>
                        </select>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            onClick={() => setIsFilterModalOpen(false)}
                            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                        >
                            Batal
                        </button>
                        <button
                            onClick={applyFilters}
                            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200 cursor-pointer"
                        >
                            Terapkan Filter
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Transaction Detail Modal */}
            <Modal isOpen={isDetailModalOpen} title="Detail Transaksi" onClose={() => setIsDetailModalOpen(false)} size="lg">
                {selectedTransaction && (
                    <div className="space-y-6">
                        {/* Transaction Header */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">ID Transaksi</p>
                                    <p className="font-semibold">#{selectedTransaction.id}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Tanggal</p>
                                    <p className="font-semibold">{format(new Date(selectedTransaction.created_at), 'dd/MM/yyyy HH:mm:ss')}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Jenis</p>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedTransaction.is_online
                                            ? 'bg-blue-100 text-blue-800'
                                            : 'bg-purple-100 text-purple-800'
                                        }`}>
                                        {selectedTransaction.is_online ? 'Online' : 'Offline'}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Status</p>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedTransaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                                            selectedTransaction.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                selectedTransaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-blue-100 text-blue-800'
                                        }`}>
                                        {getStatusIcon(selectedTransaction.status)}
                                        <span className="ml-1">{formatStatus(selectedTransaction.status)}</span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Customer & Payment Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-medium text-gray-900 mb-3">Informasi Pelanggan</h4>
                                <div className="space-y-2">
                                    <p className="text-sm">
                                        <span className="text-gray-500">Nama:</span>{' '}
                                        <span className="font-medium">{selectedTransaction.pelanggan?.user?.name || "Walk-in"}</span>
                                    </p>
                                    {selectedTransaction.pelanggan?.no_hp && (
                                        <p className="text-sm">
                                            <span className="text-gray-500">No. HP:</span>{' '}
                                            <span>
                                                {selectedTransaction.pelanggan.no_hp.replace(
                                                    /(\d{4})(\d{4})(\d+)/,
                                                    '$1-$2-$3'
                                                )}
                                            </span>
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium text-gray-900 mb-3">Informasi Pembayaran</h4>
                                <div className="space-y-2">
                                    <p className="text-sm">
                                        <span className="text-gray-500">Metode:</span>{' '}
                                        <span className="font-medium inline-flex items-center">
                                            {getPaymentMethodIcon(selectedTransaction.payment_method)}
                                            <span className="ml-1">{formatPaymentMethod(selectedTransaction.payment_method)}</span>
                                        </span>
                                    </p>
                                    <p className="text-sm">
                                        <span className="text-gray-500">Total:</span>{' '}
                                        <span className="font-semibold text-lg">{formatCurrency(selectedTransaction.total)}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Delivery Info for Online Orders */}
                        {selectedTransaction.is_online && (
                            <div>
                                <h4 className="font-medium text-gray-900 mb-3">Informasi Pengiriman</h4>
                                <div className="bg-blue-50 rounded-lg p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-500">Status Pengiriman</p>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                <Truck className="w-3 h-3 mr-1" />
                                                {formatDeliveryStatus(selectedTransaction.delivery_status)}
                                            </span>
                                        </div>
                                        {selectedTransaction.kurir && (
                                            <div>
                                                <p className="text-sm text-gray-500">Kurir</p>
                                                <p className="font-medium">{selectedTransaction.kurir.user.name}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Transaction Items */}
                        <div>
                            <h4 className="font-medium text-gray-900 mb-3">Daftar Produk</h4>
                            <div className="border rounded-lg overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Harga</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {selectedTransaction.details.map((detail) => (
                                            <tr key={detail.id}>
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <p className="font-medium text-sm">{detail.product.nama_produk}</p>
                                                        <p className="text-xs text-gray-500">{detail.product.kategori?.nama_kategori}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm">{formatCurrency(detail.product.harga)}</td>
                                                <td className="px-4 py-3 text-sm">{detail.qty}</td>
                                                <td className="px-4 py-3 text-sm font-semibold">{formatCurrency(detail.subtotal)}</td>
                                            </tr>
                                        ))}
                                        <tr className="bg-gray-50">
                                            <td colSpan={3} className="px-4 py-3 text-right text-sm font-semibold">
                                                Total
                                            </td>
                                            <td className="px-4 py-3 text-sm font-bold text-blue-600">
                                                {formatCurrency(selectedTransaction.total)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                onClick={() => setIsDetailModalOpen(false)}
                                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200 cursor-pointer"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </Layout>
    );
}