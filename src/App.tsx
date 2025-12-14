import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// Import CSS
import './index.css';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard';
import Branch from './pages/Master/Cabang';
import BranchSelect from './pages/Master/Products/BranchSelect';
import ProductList from './pages/Master/Products/Product';
import Category from './pages/Master/Kategori';
import KelolaPetugas from './pages/Manage User/Petugas';
import User from './pages/Manage User/User';
import KelolaKurir from './pages/Manage User/Kurir';
import KelolaPelanggan from './pages/Manage User/Pelanggan';
import StockRequestPage from './pages/Transactions/RequestStock';
import LaporanTransaksiPerCabang from './pages/Transactions/LaporanTransaksiPerCabang';
import ProfileAdmin from './pages/Profile';

function App() {
  return (
    <AuthProvider>
      <Router basename="/dm">
        <div className="App">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/cabang" element={<Branch />} />
            <Route path="/admin/produk" element={<BranchSelect />} />
            <Route path="/admin/produk/:branchId" element={<ProductList />} />
            <Route path="/admin/kategori-produk" element={<Category />} />
            <Route path="/admin/kelola-pengguna" element={<User />} />
            <Route path="/admin/kelola-petugas" element={<KelolaPetugas />} />
            <Route path="/admin/kelola-kurir" element={<KelolaKurir />} />
            <Route path="/admin/kelola-pelanggan" element={<KelolaPelanggan />} />
            <Route path="/admin/request-stok" element={<StockRequestPage />} />
            <Route path="/admin/laporan-penjualan-cabang" element={<LaporanTransaksiPerCabang />} />
            <Route path="/admin/profil" element={<ProfileAdmin />} />

            {/* <Route path="*" element={<div>404</div>} /> */}
            <Route
              path="*"
              element={
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                    <p className="text-xl text-gray-600 mb-8">Halaman tidak ditemukan</p>
                    <Link 
                      to="/admin/dashboard"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors duration-200"
                    >
                      Kembali ke Dashboard
                    </Link>
                  </div>
                </div>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;