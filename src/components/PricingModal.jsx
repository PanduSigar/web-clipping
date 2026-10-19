import React, { useState, useEffect } from 'react';
import { CreditCard, X, Check, ShieldCheck, Zap, Sparkles, Star, Database, Settings, Upload } from 'lucide-react';
import { updateUserQuota } from '../services/supabaseClient';

// Base QRIS string payload from your uploaded static QR code
const BASE_QRIS = '00020101021126610014COM.GO-JEK.WWW01189360091436593209970210G6593209970303UMI51440014ID.CO.QRIS.WWW0215ID10265538575860303UMI5204563153033605802ID5925PANDU SIGAR ALAM, Aksesor6007MATARAM61058311562070703A0163049B08';

function calculateCRC16(str) {
  let crc = 0xFFFF;
  for (let c = 0; c < str.length; c++) {
    const charCode = str.charCodeAt(c);
    crc ^= (charCode << 8);
    for (let i = 0; i < 8; i++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  crc &= 0xFFFF;
  let hex = crc.toString(16).toUpperCase();
  return hex.padStart(4, '0');
}

function generateDynamicQris(baseQris, amount) {
  // 1. Strip the original CRC16 (last 8 characters)
  let cleanPayload = baseQris.substring(0, baseQris.length - 8);
  
  // 2. Format the amount tag (tag 54)
  const amountStr = String(amount);
  const amountTag = `54${String(amountStr.length).padStart(2, '0')}${amountStr}`;
  
  // 3. Check if tag 54 already exists in payload, if so replace it.
  // Otherwise, inject it before tag 58 (starts with "5802ID")
  if (cleanPayload.includes('5405') || cleanPayload.includes('5406')) {
    cleanPayload = cleanPayload.replace(/540[56]\d+/, amountTag);
  } else {
    const tag58Index = cleanPayload.indexOf('5802ID');
    if (tag58Index !== -1) {
      cleanPayload = cleanPayload.substring(0, tag58Index) + amountTag + cleanPayload.substring(tag58Index);
    } else {
      cleanPayload += amountTag;
    }
  }
  
  // 4. Append CRC placeholder "6304"
  const finalPayloadWithoutCrc = cleanPayload + '6304';
  
  // 5. Calculate new CRC16
  const newCrc = calculateCRC16(finalPayloadWithoutCrc);
  
  // 6. Return the fully signed dynamic QRIS string
  return finalPayloadWithoutCrc + newCrc;
}

export default function PricingModal({ isOpen, onClose, user, onQuotaUpdated, onOpenAuth }) {
  const [loadingPackage, setLoadingPackage] = useState(null);
  const [showConfig, setShowConfig] = useState(false);
  
  // Midtrans Keys Config
  const [clientKey, setClientKey] = useState('');
  const [serverKey, setServerKey] = useState('');
  const [configSaved, setConfigSaved] = useState(false);

  // Mock checkout state for simulation mode
  const [simulatingTransaction, setSimulatingTransaction] = useState(null);

  // Struk / Receipt Upload States
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState('');

  const handleReceiptChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    setClientKey(localStorage.getItem('midtrans_client_key') || '');
    setServerKey(localStorage.getItem('midtrans_server_key') || '');

    // Load Midtrans Snap JS Script dynamically
    if (isOpen) {
      const scriptId = 'midtrans-snap-script';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        // Defaults to Sandbox snap URL
        script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
        script.setAttribute('data-client-key', localStorage.getItem('midtrans_client_key') || '');
        document.body.appendChild(script);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const packages = [
    {
      id: 'pkg_starter',
      name: 'Starter Package',
      price: 15000,
      tokens: 100000,
      icon: Zap,
      color: '#06b6d4',
      features: [
        '100.000 Token Gemini AI',
        'Cocok untuk 10+ Jurnal Ilmiah',
        'Akses Pemutar YouTube Clipper',
        'Tanpa masa kedaluwarsa'
      ]
    },
    {
      id: 'pkg_pro',
      name: 'Professional Creator',
      price: 50000,
      tokens: 500000,
      icon: Sparkles,
      color: '#a855f7',
      isPopular: true,
      features: [
        '500.000 Token Gemini AI',
        'Cocok untuk analisis data besar',
        'Clipper video dengan resolusi 720p',
        'Prioritas akses model Gemini Pro',
        'Tanpa masa kedaluwarsa'
      ]
    },
    {
      id: 'pkg_business',
      name: 'Business Agent',
      price: 150000,
      tokens: 2000000,
      icon: Star,
      color: '#ec4899',
      features: [
        '2.000.000 Token Gemini AI',
        'Untuk penggunaan komersial / agensi',
        'Dukungan penuh multi-dataset',
        'Bisa memproses puluhan video YT',
        'Tanpa masa kedaluwarsa'
      ]
    }
  ];

  const handleBuy = async (pkg) => {
    if (!user) {
      alert('Silakan masuk atau daftarkan akun terlebih dahulu untuk melakukan pembelian.');
      onOpenAuth();
      return;
    }

    setLoadingPackage(pkg.id);

    try {
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price: pkg.price,
          tokens: pkg.tokens,
          email: user.email,
          userId: user.id
        })
      });

      if (!response.ok) {
        throw new Error('Gagal menghubungi gateway pembayaran.');
      }

      const result = await response.json();

      if (result.isSimulation) {
        // Trigger simulated popup window
        setSimulatingTransaction({
          pkg,
          token: result.token
        });
      } else {
        // PRODUCTION: Trigger real Midtrans Snap popup
        if (window.snap) {
          window.snap.pay(result.token, {
            onSuccess: async (snapResult) => {
              console.log('Payment success:', snapResult);
              // In production, the webhook handles database update,
              // but we also update frontend here immediately for instant UI feedback
              await updateUserQuota(user.id, pkg.tokens);
              alert(`Pembayaran berhasil! Kuota Anda telah ditambahkan sebanyak ${pkg.tokens.toLocaleString('id-ID')} token.`);
              onQuotaUpdated();
              onClose();
            },
            onPending: (snapResult) => {
              alert('Menunggu pembayaran Anda. Silakan selesaikan instruksi pembayaran.');
            },
            onError: (snapResult) => {
              alert('Gagal memproses pembayaran Anda.');
            },
            onClose: () => {
              console.log('Customer closed payment window without finishing.');
            }
          });
        } else {
          alert('Gagal memuat modul pembayaran Midtrans. Pastikan koneksi internet aktif.');
        }
      }
    } catch (err) {
      console.error(err);
      alert('Gagal memproses transaksi: ' + err.message);
    } finally {
      setLoadingPackage(null);
    }
  };

  const handleSaveConfig = (e) => {
    e.preventDefault();
    if (clientKey) localStorage.setItem('midtrans_client_key', clientKey.trim());
    else localStorage.removeItem('midtrans_client_key');

    if (serverKey) {
      localStorage.setItem('midtrans_server_key', serverKey.trim());
      // We also save server key dynamically in process env via backend request
      // (For this prototype demo, we store it locally)
    } else {
      localStorage.removeItem('midtrans_server_key');
    }

    setConfigSaved(true);
    setTimeout(() => {
      setConfigSaved(false);
      setShowConfig(false);
    }, 1000);
  };

  const handleSimulationSuccess = async () => {
    if (!simulatingTransaction) return;
    const { pkg } = simulatingTransaction;
    
    try {
      const orderId = `QRIS-${Date.now().toString().substring(8)}-${Math.floor(Math.random() * 1000)}`;
      
      if (import.meta.env.VITE_USE_LOCAL_DB === 'true') {
        const res = await fetch('/api/db/transaction/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: orderId,
            userId: user.id,
            email: user.email,
            packageName: pkg.name,
            price: pkg.price,
            tokens: pkg.tokens,
            receipt: receiptPreview
          })
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Gagal menyimpan transaksi.');
        
        alert(`[BUKTI TERKIRIM] Bukti transfer berhasil dikirim dengan Order ID: ${orderId}. Transaksi Anda saat ini sedang diverifikasi oleh admin. Silakan masuk (login) menggunakan akun Admin resmi (admin@dataflow.com) untuk menyetujui transaksi ini.`);
      } else {
        // Fallback for simulation mode without local DB
        await updateUserQuota(user.id, pkg.tokens);
        alert(`[TRANSAKSI BERHASIL] Bukti transfer/resi berhasil dikirim! (Untuk kemudahan pengujian demo, kuota +${pkg.tokens.toLocaleString('id-ID')} token telah ditambahkan secara otomatis).`);
        onQuotaUpdated();
      }
      
      setSimulatingTransaction(null);
      setReceiptFile(null);
      setReceiptPreview('');
      onClose();
    } catch (err) {
      alert('Gagal memproses pengiriman bukti bayar: ' + err.message);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      zIndex: 105,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      overflowY: 'auto'
    }}>
      
      {simulatingTransaction ? (
        /* SIMULATION CHECKOUT SCREEN */
        <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '24px', textAlign: 'center', border: '2px solid var(--accent-purple)', boxShadow: 'var(--shadow-glow)' }}>
          <div style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 6px 0', color: '#c084fc' }}>Pembayaran QRIS Instan</h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>Silakan scan QR code di bawah menggunakan aplikasi e-wallet Anda (GoPay, OVO, Dana, LinkAja, atau Mobile Banking).</p>
          </div>

          <img 
            src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(generateDynamicQris(BASE_QRIS, simulatingTransaction.pkg.price))}`}
            alt="QRIS Code" 
            style={{ 
              width: '240px', 
              height: '240px', 
              margin: '10px auto 16px auto', 
              display: 'block', 
              borderRadius: '8px', 
              border: '6px solid white',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
            }} 
          />

          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 4px 0' }}>{simulatingTransaction.pkg.name}</h3>
          <p style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: '4px 0 16px 0' }}>
            Rp {simulatingTransaction.pkg.price.toLocaleString('id-ID')}
          </p>

          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'left', marginBottom: '16px', lineHeight: '1.5' }}>
            <strong>Rincian Pembelian:</strong>
            <ul style={{ paddingLeft: '16px', margin: '4px 0 0 0' }}>
              <li>Top Up Kuota: +{simulatingTransaction.pkg.tokens.toLocaleString('id-ID')} Token</li>
              <li>Order ID: QRIS-{Date.now().toString().substring(8)}</li>
              <li>Email Pembeli: {user.email}</li>
            </ul>
          </div>

          {/* Upload Bukti Pembayaran */}
          <div style={{ marginBottom: '20px', textAlign: 'left' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
              Unggah Bukti Transfer / Struk QRIS (Wajib)
            </label>
            
            {!receiptPreview ? (
              <label 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  border: '2px dashed var(--border-color)', 
                  borderRadius: '8px', 
                  padding: '16px', 
                  cursor: 'pointer',
                  background: 'rgba(255,255,255,0.02)',
                  transition: 'all 0.2s ease',
                  textAlign: 'center'
                }}
              >
                <Upload size={20} color="var(--text-dim)" style={{ marginBottom: '6px' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Klik untuk pilih screenshot bukti bayar</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleReceiptChange} 
                  style={{ display: 'none' }} 
                  required
                />
              </label>
            ) : (
              <div style={{ position: 'relative', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '6px', background: 'rgba(0,0,0,0.3)' }}>
                <img 
                  src={receiptPreview} 
                  alt="Receipt Preview" 
                  style={{ width: '100%', maxHeight: '140px', objectFit: 'contain', borderRadius: '6px', display: 'block' }} 
                />
                <button
                  type="button"
                  onClick={() => { setReceiptFile(null); setReceiptPreview(''); }}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: '#f43f5e',
                    border: 'none',
                    color: 'white',
                    borderRadius: '50%',
                    padding: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                  }}
                  title="Hapus Bukti"
                >
                  <X size={12} />
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button 
              onClick={handleSimulationSuccess} 
              className={receiptFile ? "btn-primary" : "btn-secondary"} 
              style={{ 
                justifyContent: 'center', 
                padding: '12px',
                opacity: receiptFile ? 1 : 0.6,
                cursor: receiptFile ? 'pointer' : 'not-allowed'
              }}
              disabled={!receiptFile}
            >
              <ShieldCheck size={16} />
              Konfirmasi Saya Sudah Bayar
            </button>
            <button 
              onClick={() => { 
                setSimulatingTransaction(null); 
                setReceiptFile(null); 
                setReceiptPreview(''); 
              }} 
              className="btn-secondary" 
              style={{ justifyContent: 'center', padding: '10px' }}
            >
              Batalkan Pembayaran
            </button>
          </div>
        </div>
      ) : (
        /* STANDARD PRICING SCREEN */
        <div className="glass-panel" style={{ width: '100%', maxWidth: '960px', padding: '28px', position: 'relative' }}>
          
          <button 
            onClick={onClose} 
            style={{ position: 'absolute', top: '18px', right: '18px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>

          {/* Title Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard color="#a855f7" size={24} />
                <span>Top Up Kuota Token Gemini AI</span>
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Token digunakan untuk membiayai pembuatan Jurnal, Jawaban Soal, Presentasi, & Video Clipper.
              </p>
            </div>
            
            <button
              onClick={() => setShowConfig(!showConfig)}
              style={{
                border: 'none',
                color: showConfig ? 'var(--text-main)' : 'var(--text-muted)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                background: showConfig ? 'rgba(255,255,255,0.06)' : 'none'
              }}
            >
              <Settings size={14} />
              Pengaturan Merchant
            </button>
          </div>

          {showConfig ? (
            /* CONFIG PANEL FOR MIDTRANS MERCHANT KEYS */
            <form onSubmit={handleSaveConfig} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '480px', margin: '20px auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <CreditCard size={18} color="#a855f7" />
                <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Pengaturan API Key Midtrans</h4>
              </div>
              
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>
                Kosongkan kotak input di bawah untuk tetap menggunakan **Mode Simulasi Sandbox**. Jika ingin menggunakan akun Midtrans Anda sendiri, isi kunci di bawah.
              </p>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>Midtrans Client Key (Sandbox)</label>
                <input 
                  type="text"
                  value={clientKey}
                  onChange={(e) => setClientKey(e.target.value)}
                  placeholder="SB-Mid-client-..."
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>Midtrans Server Key (Sandbox)</label>
                <input 
                  type="password"
                  value={serverKey}
                  onChange={(e) => setServerKey(e.target.value)}
                  placeholder="SB-Mid-server-..."
                  className="input-field"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowConfig(false)} className="btn-secondary" style={{ fontSize: '0.85rem', padding: '8px 14px' }}>
                  Batal
                </button>
                <button type="submit" className="btn-primary" style={{ fontSize: '0.85rem', padding: '8px 16px' }}>
                  {configSaved ? <Check size={14} /> : <Database size={14} />}
                  {configSaved ? 'Tersimpan!' : 'Simpan Kunci'}
                </button>
              </div>
            </form>
          ) : (
            /* PACKAGES GRID */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', alignItems: 'stretch' }}>
              {packages.map((pkg) => {
                const IconComponent = pkg.icon;
                
                return (
                  <div 
                    key={pkg.id} 
                    className="glass-panel" 
                    style={{ 
                      padding: '24px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      position: 'relative',
                      border: pkg.isPopular ? `1.5px solid ${pkg.color}` : '1px solid var(--border-color)',
                      boxShadow: pkg.isPopular ? `0 0 15px rgba(168, 85, 247, 0.15)` : 'none'
                    }}
                  >
                    {pkg.isPopular && (
                      <span style={{ 
                        position: 'absolute', 
                        top: '-12px', 
                        left: '50%', 
                        transform: 'translateX(-50%)', 
                        background: pkg.color, 
                        color: 'white', 
                        fontSize: '0.7rem', 
                        fontWeight: 800, 
                        padding: '4px 12px', 
                        borderRadius: '999px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        Paling Hemat
                      </span>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                      <div style={{ padding: '8px', borderRadius: '10px', background: `rgba(255,255,255,0.04)`, border: `1px solid var(--border-color)` }}>
                        <IconComponent color={pkg.color} size={20} />
                      </div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>{pkg.name}</h4>
                    </div>

                    <div style={{ margin: '8px 0 18px 0' }}>
                      <span style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-main)' }}>
                        Rp {pkg.price.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: 0, margin: '0 0 24px 0', listStyle: 'none', flex: 1 }}>
                      {pkg.features.map((feature, idx) => (
                        <li key={idx} style={{ display: 'flex', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', alignItems: 'center' }}>
                          <Check size={14} color="#10b981" style={{ shrink: 0 }} />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <button 
                      onClick={() => handleBuy(pkg)}
                      className="btn-primary" 
                      style={{ 
                        width: '100%', 
                        justifyContent: 'center', 
                        background: pkg.isPopular ? `linear-gradient(135deg, ${pkg.color} 0%, #d946ef 100%)` : 'rgba(255,255,255,0.06)',
                        border: pkg.isPopular ? 'none' : '1px solid var(--border-color)',
                        color: 'white',
                        padding: '12px'
                      }}
                      disabled={loadingPackage !== null}
                    >
                      {loadingPackage === pkg.id ? (
                        'Memproses...'
                      ) : (
                        <>
                          <CreditCard size={14} />
                          Beli Kuota
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Secure disclaimer */}
          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <ShieldCheck size={14} color="#10b981" />
            <span>Sistem pembayaran aman didukung oleh Midtrans Sandbox simulator.</span>
          </div>

        </div>
      )}

    </div>
  );
}
