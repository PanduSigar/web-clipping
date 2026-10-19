import React, { useState } from 'react';
import { Search, ArrowUpDown, ShieldCheck, Hash, AlignLeft, Info, ChevronLeft, ChevronRight } from 'lucide-react';

export default function DataTable({ data, headers, audit, fileName }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortCol, setSortCol] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Filtered rows
  const filteredRows = data.filter(row => {
    if (!searchTerm) return true;
    return headers.some(col => String(row[col] ?? '').toLowerCase().includes(searchTerm.toLowerCase()));
  });

  // Sorted rows
  const sortedRows = [...filteredRows].sort((a, b) => {
    if (!sortCol) return 0;
    const valA = a[sortCol];
    const valB = b[sortCol];

    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortAsc ? valA - valB : valB - valA;
    }
    return sortAsc 
      ? String(valA ?? '').localeCompare(String(valB ?? ''))
      : String(valB ?? '').localeCompare(String(valA ?? ''));
  });

  // Pagination
  const totalPages = Math.ceil(sortedRows.length / rowsPerPage) || 1;
  const paginatedRows = sortedRows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(col);
      setSortAsc(true);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Metadata Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Kesehatan Data</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: audit.healthScore > 80 ? '#10b981' : '#f59e0b' }}>
              {audit.healthScore}%
            </span>
            <span className={audit.healthScore > 80 ? "badge badge-emerald" : "badge badge-amber"}>
              {audit.healthScore > 80 ? 'Sangat Baik' : 'Cukup Baik'}
            </span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Jumlah Baris</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#a5b4fc' }}>
            {audit.rowCount.toLocaleString()}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Jumlah Kolom</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#06b6d4' }}>
            {audit.colCount} Kolom
          </div>
        </div>
      </div>

      {/* Column Details Chips */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-muted)' }}>
          🔍 Detail & Ringkasan Tiap Kolom:
        </h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {headers.map(col => {
            const detail = audit.colDetails[col];
            return (
              <div key={col} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '8px 12px', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--text-main)' }}>
                  {detail?.type === 'number' ? <Hash size={13} color="#06b6d4" /> : <AlignLeft size={13} color="#a5b4fc" />}
                  <span>{col}</span>
                </div>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                  Tipe: {detail?.type} | Nilai Unik: {detail?.uniqueCount}
                  {detail?.stats && (
                    <div style={{ color: '#6ee7b7', marginTop: '2px' }}>
                      Rata-rata: {detail.stats.avg.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Table Container */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Search Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Cari kata kunci dalam tabel..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="input-field"
              style={{ paddingLeft: '36px' }}
            />
          </div>

          <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
            Menampilkan {filteredRows.length} dari {data.length} baris
          </div>
        </div>

        {/* Table Element */}
        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>#</th>
                {headers.map(col => (
                  <th key={col} onClick={() => handleSort(col)} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{col}</span>
                      <ArrowUpDown size={13} color={sortCol === col ? 'var(--accent-primary)' : 'var(--text-dim)'} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length > 0 ? (
                paginatedRows.map((row, rIdx) => (
                  <tr key={rIdx}>
                    <td style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                      {(currentPage - 1) * rowsPerPage + rIdx + 1}
                    </td>
                    {headers.map(col => (
                      <td key={col}>
                        {row[col] !== null && row[col] !== undefined ? String(row[col]) : <span style={{ color: 'var(--accent-rose)', fontStyle: 'italic' }}>null</span>}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={headers.length + 1} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    Tidak ada baris yang cocok dengan kata kunci pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Halaman {currentPage} dari {totalPages}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            >
              <ChevronLeft size={16} /> Sebelum
            </button>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            >
              Sesudah <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
