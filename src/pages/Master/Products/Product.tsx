import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Plus, Search, RefreshCcw, SquarePen, Trash2, CircleAlert, Package } from "lucide-react";
import api, { setAuthToken } from "../../../api";
import Layout from "../../../components/layout/Layout";
import Modal from "../../../components/Modal";

interface Product {
    id: number;
    nama_produk: string;
    harga: number;
    kode_produk: string;
    satuan: string;
    stocks?: { qty: number }[];
    kategori: { nama_kategori: string };
    gambar_url: string;
}

interface Category {
    id: number;
    nama_kategori: string;
}

interface Branch {
    id: number;
    nama_cabang: string;
}

export default function ProductList() {
    const { branchId } = useParams();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [branch, setBranch] = useState<Branch | null>(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState("");

    // Product fields
    const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
    const [namaProduk, setNamaProduk] = useState("");
    const [harga, setHarga] = useState("");
    const [kodeProduk, setKodeProduk] = useState("");
    const [satuan, setSatuan] = useState("");
    const [kategoriId, setKategoriId] = useState("");
    const [gambar, setGambar] = useState<File | null>(null);

    // Search & pagination
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const fetchProducts = async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await api.get(`/products/branch/${branchId}`);

            const items = res.data || [];
            setProducts(items);

            // Ambil branch dari produk pertama
            if (items.length > 0) {
                setBranch(items[0].branch);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Gagal memuat produk");
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await api.get("/kategori-produk"); // sesuaikan dengan route backend kamu
            setCategories(res.data || []);
        } catch (err: any) {
            console.error("Gagal memuat kategori");
        }
    };

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            setAuthToken(token);
            fetchProducts();
            fetchCategories();
        }
    }, []);

    const filteredProducts = products.filter((p) =>
        p.nama_produk.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const currentProducts = filteredProducts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

    // Open Modal
    const openModal = (product?: Product) => {
        setCurrentProduct(product || null);
        setModalTitle(product ? "Edit Produk" : "Tambah Produk");

        setNamaProduk(product?.nama_produk || "");
        setHarga(product?.harga.toString() || "");
        setKodeProduk(product?.kode_produk || "");
        setSatuan(product?.satuan || "");
        setKategoriId(product?.kategori?.id || "");
        setGambar(null);

        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const handleSave = async () => {
        const formData = new FormData();
        formData.append("nama_produk", namaProduk);
        formData.append("kode_produk", kodeProduk);
        formData.append("satuan", satuan);
        formData.append("harga", harga);
        formData.append("kategori_id", kategoriId);
        formData.append("branch_id", branchId!);

        if (gambar) formData.append("gambar", gambar);

        try {
            if (currentProduct) {
                await api.post(`/products/${currentProduct.id}?_method=PUT`, formData);
            } else {
                await api.post("/products", formData);
            }
            fetchProducts();
            closeModal();
        } catch (err: any) {
            alert(err.response?.data?.message || "Gagal menyimpan produk");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Yakin ingin menghapus produk ini?")) return;

        try {
            await api.delete(`/products/${id}`);
            fetchProducts();
        } catch (err: any) {
            alert("Gagal menghapus produk");
        }
    };

    const handleSearchReset = () => {
        setSearchTerm("");
        setCurrentPage(1);
    };

    return (
        <Layout title="Produk">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row justify-between lg:items-center bg-white rounded-xl shadow-sm p-6 mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Kelola Produk</h1>
                    <p className="text-gray-600">Daftar produk yang tersedia di cabang {branch?.nama_cabang}</p>
                    {error && <p className="text-red-500 mt-1">{error}</p>}
                </div>

                <div className="text-gray-700 text-sm lg:text-base flex flex-col text-left lg:text-right">
                    <span className="font-medium text-2xl text-blue-700">{products.length}</span>
                    <span>Produk tersedia</span>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
                {/* Action Bar */}
                <div className="flex justify-end mb-4">
                    <button
                        onClick={() => openModal()}
                        className="bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center shadow-sm cursor-pointer"
                    >
                        <Plus className="mr-2" />
                        Tambah Produk
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
                            placeholder="Cari produk..."
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
                        Menampilkan {currentProducts.length} dari {filteredProducts.length} produk
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-12">
                        <Package className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900">Tidak ada produk</h3>
                        <p className="mt-1 text-gray-500">
                            {searchTerm ? "Tidak ada produk yang sesuai dengan pencarian Anda." : "Mulai dengan menambahkan produk pertama Anda."}
                        </p>
                        {!searchTerm && (
                            <div className="mt-6">
                                <button
                                    onClick={() => openModal()}
                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                                >
                                    <Plus className="mr-2" />
                                    Tambah Produk
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
                                            Gambar
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Kode
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Nama Produk
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Harga
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Satuan
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Stok
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Kategori
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="bg-white divide-y divide-gray-200">
                                    {currentProducts.map((product) => (
                                        <tr key={product.id} className="hover:bg-gray-50 transition-colors duration-150">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <img
                                                        src={product.gambar_url}
                                                        className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                                                        alt={product.nama_produk}
                                                    />
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {product.kode_produk}
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {product.nama_produk}
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {new Intl.NumberFormat('id-ID', {
                                                    style: 'currency',
                                                    currency: 'IDR',
                                                    minimumFractionDigits: 2
                                                }).format(product.harga)}
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {product.satuan}
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {(product.stocks?.[0]?.qty ?? 0) < 5 ? (
                                                    <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded-full">
                                                        {product.stocks?.[0]?.qty ?? 0}
                                                    </span>
                                                ) : (
                                                    product.stocks?.[0]?.qty ?? 0
                                                )}
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {product.kategori?.nama_kategori}
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end space-x-2">
                                                    <button
                                                        onClick={() => openModal(product)}
                                                        className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 flex items-center cursor-pointer"
                                                    >
                                                        <SquarePen className="w-4 h-4 mr-1" />
                                                        Edit
                                                    </button>

                                                    <button
                                                        onClick={() => handleDelete(product.id)}
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
                                    Menampilkan <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> sampai <span className="font-medium">
                                        {Math.min(currentPage * itemsPerPage, filteredProducts.length)}
                                    </span> dari <span className="font-medium">{filteredProducts.length}</span> hasil
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

            {/* Modal */}
            <Modal isOpen={isModalOpen} title={modalTitle} onClose={closeModal}>
                <div className="flex flex-col space-y-4">
                    {/* Nama Produk */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nama Produk
                        </label>
                        <input
                            type="text"
                            className="border border-gray-300 px-3 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Masukkan nama produk"
                            value={namaProduk}
                            onChange={(e) => setNamaProduk(e.target.value)}
                            autoFocus
                        />
                    </div>

                    {/* Kode Produk */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Kode Produk
                        </label>
                        <input
                            type="text"
                            className="border border-gray-300 px-3 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Masukkan kode produk"
                            value={kodeProduk}
                            onChange={(e) => setKodeProduk(e.target.value)}
                        />
                    </div>

                    {/* Harga */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Harga
                        </label>
                        <input
                            type="number"
                            className="border border-gray-300 px-3 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Masukkan harga"
                            value={harga}
                            onChange={(e) => setHarga(e.target.value)}
                        />
                    </div>

                    {/* Satuan */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Satuan
                        </label>
                        <input
                            type="text"
                            className="border border-gray-300 px-3 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Masukkan satuan"
                            value={satuan}
                            onChange={(e) => setSatuan(e.target.value)}
                        />
                    </div>

                    {/* Kategori ID */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Kategori
                        </label>
                        <select
                            className="border border-gray-300 px-3 py-2 rounded-lg w-full focus:outline-none 
        focus:ring-2 focus:ring-blue-500"
                            value={kategoriId}
                            onChange={(e) => setKategoriId(e.target.value)}
                        >
                            <option value="">Pilih kategori</option>

                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.nama_kategori}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Gambar */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Gambar
                        </label>
                        <input
                            type="file"
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            onChange={(e) => setGambar(e.target.files?.[0] || null)}
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