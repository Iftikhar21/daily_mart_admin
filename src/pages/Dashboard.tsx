// pages/admin/Dashboard.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/layout/Layout';

export default function Dashboard() {
    const { user } = useAuth();
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update setiap detik
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Format jam dan tanggal
    const formattedTime = currentTime.toLocaleTimeString(); // HH:MM:SS
    const formattedDate = currentTime.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    return (
        <Layout title="Dashboard">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="mb-4 md:mb-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                        Selamat Datang, {user?.name || 'Admin'}!
                    </h1>
                    <p className="text-gray-600 text-sm sm:text-base">
                        Selamat datang di dashboard Daily Mart !
                    </p>
                </div>
                <div className="text-left md:text-right">
                    <p className="font-medium text-2xl sm:text-3xl text-green-800">{formattedTime}</p>
                    <p className="text-xs sm:text-sm text-gray-700">{formattedDate}</p>
                </div>
            </div>
        </Layout>
    );
}