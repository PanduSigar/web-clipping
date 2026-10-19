import React, { useState } from 'react';
import { UploadCloud, FileSpreadsheet, FileText, FileCode, Sparkles, AlertCircle } from 'lucide-react';
import { parseFile } from '../services/dataParser';

export default function FileUploader({ onFileLoaded }) {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = async (file) => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const parsedData = await parseFile(file);
      onFileLoaded(parsedData);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Gagal membaca file tersebut.');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Preset Sample Dataset for instant testing without uploading files
  const loadSampleDataset = (type) => {
    setLoading(true);
    let sampleRows = [];
    let fileName = '';

    if (type === 'sales') {
      fileName = 'Laporan_Penjualan_2026.xlsx';
      sampleRows = [
        { ID: 'TRX-101', Tanggal: '2026-01-05', Produk: 'Laptop Pro 15"', Kategori: 'Elektronik', Jumlah: 3, Harga_Satuan: 15000000, Total: 45000000, Status: 'Selesai', Wilayah: 'Jakarta' },
        { ID: 'TRX-102', Tanggal: '2026-01-07', Produk: 'Monitor 27" 4K', Kategori: 'Elektronik', Jumlah: 5, Harga_Satuan: 4500000, Total: 22500000, Status: 'Selesai', Wilayah: 'Surabaya' },
        { ID: 'TRX-103', Tanggal: '2026-01-10', Produk: 'Keyboard Mekanikal', Kategori: 'Aksesoris', Jumlah: 12, Harga_Satuan: 850000, Total: 10200000, Status: 'Selesai', Wilayah: 'Bandung' },
        { ID: 'TRX-104', Tanggal: '2026-01-12', Produk: 'Mouse Wireless', Kategori: 'Aksesoris', Jumlah: 20, Harga_Satuan: 350000, Total: 7000000, Status: 'Pending', Wilayah: 'Medan' },
        { ID: 'TRX-105', Tanggal: '2026-01-15', Produk: 'Meja Kerja Ergonomis', Kategori: 'Furnitur', Jumlah: 2, Harga_Satuan: 3200000, Total: 6400000, Status: 'Selesai', Wilayah: 'Jakarta' },
        { ID: 'TRX-106', Tanggal: '2026-01-18', Produk: 'Kursi Ergonomis Mesh', Kategori: 'Furnitur', Jumlah: 4, Harga_Satuan: 2400000, Total: 9600000, Status: 'Selesai', Wilayah: 'Semarang' },
        { ID: 'TRX-107', Tanggal: '2026-01-20', Produk: 'Webcam 1080p', Kategori: 'Elektronik', Jumlah: 8, Harga_Satuan: 650000, Total: 5200000, Status: 'Selesai', Wilayah: 'Surabaya' },
        { ID: 'TRX-108', Tanggal: '2026-01-22', Produk: 'Headset Noise Cancelling', Kategori: 'Aksesoris', Jumlah: 6, Harga_Satuan: 1800000, Total: 10800000, Status: 'Pending', Wilayah: 'Makassar' },
        { ID: 'TRX-109', Tanggal: '2026-01-25', Produk: 'Standing Desk Dual Motor', Kategori: 'Furnitur', Jumlah: 1, Harga_Satuan: 5800000, Total: 5800000, Status: 'Selesai', Wilayah: 'Jakarta' },
        { ID: 'TRX-110', Tanggal: '2026-01-28', Produk: 'USB Hub Type-C 7-in-1', Kategori: 'Aksesoris', Jumlah: 15, Harga_Satuan: 420000, Total: 6300000, Status: 'Selesai', Wilayah: 'Bandung' }
      ];
    } else {
      fileName = 'Data_Karyawan_KPI.csv';
      sampleRows = [
        { NIK: 'EMP-01', Nama: 'Budi Santoso', Departemen: 'Engineering', Jabatan: 'Senior Developer', Gaji: 18000000, Jam_Lembur: 14, KPI_Score: 92, Status_Kerja: 'Tetap' },
        { NIK: 'EMP-02', Nama: 'Siti Rahma', Departemen: 'Marketing', Jabatan: 'Digital Lead', Gaji: 15000000, Jam_Lembur: 8, KPI_Score: 88, Status_Kerja: 'Tetap' },
        { NIK: 'EMP-03', Nama: 'Dewi Lestari', Departemen: 'Product', Jabatan: 'UI/UX Designer', Gaji: 14000000, Jam_Lembur: 5, KPI_Score: 95, Status_Kerja: 'Tetap' },
        { NIK: 'EMP-04', Nama: 'Rian Hidayat', Departemen: 'Engineering', Jabatan: 'Backend Eng', Gaji: 12500000, Jam_Lembur: 20, KPI_Score: 84, Status_Kerja: 'Kontrak' },
        { NIK: 'EMP-05', Nama: 'Andi Wijaya', Departemen: 'Sales', Jabatan: 'Account Exec', Gaji: 11000000, Jam_Lembur: 12, KPI_Score: 78, Status_Kerja: 'Kontrak' },
        { NIK: 'EMP-06', Nama: 'Maya Indah', Departemen: 'HR', Jabatan: 'HR Specialist', Gaji: 10500000, Jam_Lembur: 2, KPI_Score: 90, Status_Kerja: 'Tetap' }
      ];
    }

    const headers = Object.keys(sampleRows[0]);
    // Create audit
    const audit = {
      rowCount: sampleRows.length,
      colCount: headers.length,
      healthScore: 100,
      colDetails: {}
    };
    headers.forEach(h => {
      audit.colDetails[h] = {
        type: typeof sampleRows[0][h] === 'number' ? 'number' : 'string',
        missingCount: 0,
        missingPct: 0,
        uniqueCount: new Set(sampleRows.map(r => r[h])).size
      };
    });

    onFileLoaded({
      fileName,
      fileType: type === 'sales' ? 'XLSX' : 'CSV',
      fileSize: '18 KB',
      rawData: sampleRows,
      headers,
      audit
    });
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '850px', margin: '0 auto' }}>
      {/* Upload Zone */}
      <div 
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className="glass-panel"
        style={{
          border: `2px dashed ${isDragging ? 'var(--accent-primary)' : 'var(--border-color-glow)'}`,
          padding: '48px 32px',
          textAlign: 'center',
          borderRadius: 'var(--radius-xl)',
          background: isDragging ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-card)',
          transition: 'all 0.25s ease'
        }}
      >
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '24px',
          background: 'rgba(99, 102, 241, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px auto',
          border: '1px solid rgba(99, 102, 241, 0.3)'
        }}>
          <UploadCloud size={36} color="#a5b4fc" />
        </div>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>
          Tarik & Lepas File Anda di Sini
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
          Dukung format Excel (.xlsx, .xls), CSV, PDF, TXT, dan JSON untuk dianalisis oleh AI Agent.
        </p>

        <label className="btn-primary" style={{ padding: '12px 28px', fontSize: '0.95rem' }}>
          <input 
            type="file" 
            accept=".xlsx, .xls, .csv, .pdf, .txt, .json" 
            onChange={(e) => handleFileChange(e.target.files[0])}
            style={{ display: 'none' }}
          />
          Pilih File dari Komputer
        </label>

        {loading && (
          <div style={{ marginTop: '20px', color: '#06b6d4', fontWeight: 600, fontSize: '0.9rem' }}>
            ⏳ Membaca & Menganalisis Struktur File...
          </div>
        )}

        {error && (
          <div style={{ marginTop: '20px', display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--accent-rose)', background: 'rgba(244,63,94,0.1)', padding: '8px 16px', borderRadius: 'var(--radius-md)' }}>
            <AlertCircle size={16} />
            <span style={{ fontSize: '0.85rem' }}>{error}</span>
          </div>
        )}
      </div>

      {/* Preset Samples */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Sparkles size={18} color="#f59e0b" />
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Uji Coba Langsung dengan Sample Dataset</h3>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Belum punya file? Klik salah satu sampel dataset berikut untuk langsung menguji kecerdasan AI Agent:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
          <button 
            onClick={() => loadSampleDataset('sales')}
            className="glass-panel glass-panel-hover"
            style={{ padding: '16px', textAlign: 'left', cursor: 'pointer', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '14px' }}
          >
            <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.15)' }}>
              <FileSpreadsheet size={22} color="#06b6d4" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Penjualan & Keuangan</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>10 transaksi Excel (.xlsx)</div>
            </div>
          </button>

          <button 
            onClick={() => loadSampleDataset('employee')}
            className="glass-panel glass-panel-hover"
            style={{ padding: '16px', textAlign: 'left', cursor: 'pointer', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '14px' }}
          >
            <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)' }}>
              <FileCode size={22} color="#10b981" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>SDM & KPI Karyawan</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>6 data karyawan CSV (.csv)</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
