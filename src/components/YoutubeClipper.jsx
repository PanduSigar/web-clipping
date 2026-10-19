import React, { useState, useEffect, useRef } from 'react';
import { Youtube, Scissors, Play, Check, Copy, Flame, Clock, Sparkles, AlertCircle, Info, ChevronDown, ChevronUp, RefreshCw, Key, Share2, Music, Download } from 'lucide-react';
import { analyzeYoutubeVideoForClips } from '../services/gemini';

export default function YoutubeClipper({ apiKey, selectedModel, onOpenApiKeyModal, verifyAndConsumeQuota, onOpenAuth, user }) {
  const [videoUrl, setVideoUrl] = useState('');
  const [videoId, setVideoId] = useState('');
  const [videoMeta, setVideoMeta] = useState(null);
  const [transcript, setTranscript] = useState('');
  
  // Local File States
  const [clipperSource, setClipperSource] = useState('youtube'); // 'youtube' | 'local'
  const [localFile, setLocalFile] = useState(null);
  const [localFilePath, setLocalFilePath] = useState('');
  const [localFileUrl, setLocalFileUrl] = useState('');
  const [localDuration, setLocalDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const localVideoRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // UI states
  const [isFetchingMeta, setIsFetchingMeta] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState('');
  const [clips, setClips] = useState([]);
  const [activeClip, setActiveClip] = useState(null);
  const [expandedClipIndex, setExpandedClipIndex] = useState(null);
  const [copiedClipIndex, setCopiedClipIndex] = useState(null);
  const [downloadingIndex, setDownloadingIndex] = useState(null);
  const [downloadStatus, setDownloadStatus] = useState('');

  // Editing Clip States
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');

  // Custom Clip States
  const [customTitle, setCustomTitle] = useState('');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Sync active clip times to editable inputs
  useEffect(() => {
    if (activeClip) {
      setEditStart(activeClip.start.toString());
      setEditEnd(activeClip.end.toString());
    } else {
      setEditStart('');
      setEditEnd('');
    }
  }, [activeClip]);

  const handleApplyTimeChange = () => {
    if (!activeClip) return;
    const newStart = parseFloat(editStart);
    const newEnd = parseFloat(editEnd);

    if (isNaN(newStart) || isNaN(newEnd)) {
      alert('Waktu mulai dan selesai harus berupa angka yang valid!');
      return;
    }

    if (newStart < 0) {
      alert('Waktu mulai tidak boleh kurang dari 0!');
      return;
    }

    if (newEnd <= newStart) {
      alert('Waktu selesai harus lebih besar dari waktu mulai!');
      return;
    }

    if (clipperSource === 'local' && localDuration && newEnd > localDuration) {
      alert(`Waktu selesai tidak boleh melebihi durasi video lokal (${formatTime(localDuration)})!`);
      return;
    }

    const updatedClip = {
      ...activeClip,
      start: newStart,
      end: newEnd,
      duration: Math.round((newEnd - newStart) * 10) / 10
    };

    setActiveClip(updatedClip);

    // Update inside clips list
    setClips(prevClips => 
      prevClips.map(c => 
        (c.title === activeClip.title && c.viralityScore === activeClip.viralityScore) ? updatedClip : c
      )
    );
  };

  const handleAddCustomClip = () => {
    if (!customTitle.trim()) {
      alert('Judul klip kustom tidak boleh kosong!');
      return;
    }
    const startVal = parseFloat(customStart);
    const endVal = parseFloat(customEnd);

    if (isNaN(startVal) || isNaN(endVal)) {
      alert('Waktu mulai dan selesai harus berupa angka!');
      return;
    }

    if (startVal < 0) {
      alert('Waktu mulai tidak boleh kurang dari 0!');
      return;
    }

    if (endVal <= startVal) {
      alert('Waktu selesai harus lebih besar dari waktu mulai!');
      return;
    }

    if (clipperSource === 'local' && localDuration && endVal > localDuration) {
      alert(`Waktu selesai tidak boleh melebihi durasi video lokal (${formatTime(localDuration)})!`);
      return;
    }

    const newClip = {
      title: customTitle.trim(),
      start: startVal,
      end: endVal,
      duration: Math.round((endVal - startVal) * 10) / 10,
      viralityScore: 99,
      fypLevel: 'Kustom',
      hookStrategy: 'Klip kustom buatan sendiri.',
      rationale: 'Segmen video pilihan kustom Anda.',
      editingStyle: 'Gaya editing bebas sesuai kebutuhan.',
      caption: `Tonton segmen menarik ini dari video!`,
      hashtags: '#klipkustom #viral #trending'
    };

    setClips(prev => [newClip, ...prev]);
    setActiveClip(newClip);
    setExpandedClipIndex(0);

    // Reset form
    setCustomTitle('');
    setCustomStart('');
    setCustomEnd('');
  };

  const handleStartManualClipping = () => {
    const duration = localDuration || 300;
    const defaultClip = {
      title: 'Klip Pertama',
      start: 0,
      end: Math.min(30, Math.round(duration)),
      duration: Math.min(30, Math.round(duration)),
      viralityScore: 100,
      fypLevel: 'Manual',
      hookStrategy: 'Klip manual pilihan Anda.',
      rationale: 'Klip manual pilihan Anda.',
      editingStyle: 'Gaya bebas.',
      caption: '',
      hashtags: ''
    };
    setClips([defaultClip]);
    setActiveClip(defaultClip);
    setExpandedClipIndex(0);
  };

  // Local MySQL History States
  const [clipperHistory, setClipperHistory] = useState([]);

  const fetchClipperHistory = async () => {
    if (import.meta.env.VITE_USE_LOCAL_DB !== 'true' || !user) return;
    try {
      const res = await fetch(`/api/db/clipper/history?userId=${user.id}`);
      if (res.ok) {
        const history = await res.json();
        setClipperHistory(history);
      }
    } catch (err) {
      console.warn('Failed to fetch clipper history:', err);
    }
  };

  useEffect(() => {
    fetchClipperHistory();
  }, [user]);

  // Cleanup object URL
  useEffect(() => {
    return () => {
      if (localFileUrl) {
        URL.revokeObjectURL(localFileUrl);
      }
    };
  }, [localFileUrl]);

  // Sync local video playback time range
  useEffect(() => {
    if (clipperSource === 'local' && activeClip && localVideoRef.current) {
      localVideoRef.current.currentTime = activeClip.start;
      localVideoRef.current.play().catch(err => console.log('Video play interrupted:', err));
    }
  }, [activeClip, clipperSource]);

  const handleLocalVideoTimeUpdate = () => {
    if (!localVideoRef.current || !activeClip) return;
    const video = localVideoRef.current;
    if (video.currentTime >= activeClip.end) {
      video.pause();
      video.currentTime = activeClip.start;
    }
  };

  const handleSelectLocalFile = (file) => {
    const fileUrl = URL.createObjectURL(file);
    setLocalFile(file);
    setLocalFileUrl(fileUrl);
    
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.src = fileUrl;
    tempVideo.onloadedmetadata = () => {
      setLocalDuration(tempVideo.duration);
      setVideoMeta({
        title: file.name.replace(/\.[^/.]+$/, ""), // strip extension
        authorName: 'Video Lokal',
        thumbnailUrl: '',
        description: `Berkas video lokal (${(file.size / (1024 * 1024)).toFixed(2)} MB)`
      });
      setVideoId('local_file');
    };
  };

  const handleLoadLocalPath = async () => {
    if (!localFilePath.trim()) {
      alert('Silakan masukkan path file lokal Anda terlebih dahulu!');
      return;
    }

    const cleanPath = localFilePath.replace(/^"|"$/g, '').trim();
    setIsFetchingMeta(true);
    setVideoMeta(null);
    try {
      const res = await fetch(`/api/local-video-duration?path=${encodeURIComponent(cleanPath)}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal memuat durasi berkas dari disk.');
      }
      const data = await res.json();
      setLocalFile(null); // Unset binary file to flag using path
      setLocalDuration(data.duration);
      setLocalFileUrl(`/api/serve-local-video?path=${encodeURIComponent(cleanPath)}`);
      setVideoMeta({
        title: cleanPath.split(/[\\/]/).pop(),
        authorName: 'Disk Lokal',
        thumbnailUrl: '',
        description: `Berkas disk lokal di: ${cleanPath}`
      });
      setVideoId('local_file');
    } catch (err) {
      alert('Gagal memuat berkas lokal: ' + err.message);
    } finally {
      setIsFetchingMeta(false);
    }
  };

  // Parse YouTube video ID from URL
  const extractVideoId = (url) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : '';
  };

  // Fetch YouTube Metadata via noembed.com (CORS friendly)
  const handleFetchMetadata = async (url) => {
    const id = extractVideoId(url);
    if (!id) {
      alert('Tautan YouTube tidak valid. Pastikan format tautan benar (contoh: https://www.youtube.com/watch?v=...)');
      return;
    }
    
    setVideoId(id);
    setIsFetchingMeta(true);
    setVideoMeta(null);
    setClips([]);
    setActiveClip(null);
    setExpandedClipIndex(null);

    try {
      const response = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${id}`);
      const data = await response.json();
      
      if (data && data.title) {
        setVideoMeta({
          title: data.title,
          authorName: data.author_name,
          thumbnailUrl: data.thumbnail_url,
          description: data.author_name + ' - Video YouTube'
        });
      } else {
        // Fallback metadata
        setVideoMeta({
          title: `Video YouTube (ID: ${id})`,
          authorName: 'YouTube Creator',
          thumbnailUrl: `https://img.youtube.com/vi/${id}/0.jpg`,
          description: 'Berhasil dimuat secara langsung'
        });
      }
    } catch (err) {
      console.warn('Error fetching oEmbed metadata:', err);
      // Fallback
      setVideoMeta({
        title: `Video YouTube (ID: ${id})`,
        authorName: 'YouTube Creator',
        thumbnailUrl: `https://img.youtube.com/vi/${id}/0.jpg`,
        description: 'Metadata gagal dimuat secara dinamis, menggunakan fallback'
      });
    } finally {
      setIsFetchingMeta(false);
    }
  };

  // Extract metadata immediately if valid link pasted
  useEffect(() => {
    const id = extractVideoId(videoUrl);
    if (id && id !== videoId) {
      handleFetchMetadata(videoUrl);
    }
  }, [videoUrl]);

  // Run Clipper Analysis
  const handleAnalyzeClips = async () => {
    if (!videoId) {
      alert(clipperSource === 'local' ? 'Silakan unggah video lokal terlebih dahulu!' : 'Masukkan link YouTube terlebih dahulu!');
      return;
    }

    if (verifyAndConsumeQuota) {
      try {
        await verifyAndConsumeQuota(2500);
      } catch (quotaErr) {
        alert(quotaErr.message);
        if (onOpenAuth && quotaErr.message.includes('masuk')) {
          onOpenAuth();
        }
        return;
      }
    }

    if (!apiKey) {
      onOpenApiKeyModal();
      return;
    }

    setIsAnalyzing(true);
    setAnalysisStep('Mengirim metadata ke Gemini API...');
    
    setTimeout(() => setAnalysisStep('Menganalisis konten video & mencari hook terbaik...'), 1500);
    setTimeout(() => setAnalysisStep('Menghitung skor virality (FYP) & merumuskan caption...'), 3500);
    setTimeout(() => setAnalysisStep('Menyusun detail pengeditan klip video...'), 5000);

    try {
      const result = await analyzeYoutubeVideoForClips({
        videoTitle: videoMeta?.title || 'Video YouTube',
        videoDescription: videoMeta?.description || '',
        transcript: transcript,
        apiKey,
        modelName: selectedModel
      });

      setClips(result);
      
      // Auto-set the first clip as active if any are found
      if (result && result.length > 0) {
        setActiveClip(result[0]);
        setExpandedClipIndex(0);
      }
    } catch (err) {
      alert('Analisis gagal: ' + (err.message || 'Terjadi kesalahan pada server.'));
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep('');
    }
  };

  // Format seconds to MM:SS
  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Play a specific clip segment
  const handlePlayClip = (clip) => {
    setActiveClip(clip);
  };

  // Copy Caption to Clipboard
  const handleCopyCaption = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedClipIndex(index);
    setTimeout(() => setCopiedClipIndex(null), 2000);
  };

  // Handle cutting and downloading the video clip
  const handleDownloadClip = async (clip, index) => {
    if (downloadingIndex !== null) {
      alert('Silakan tunggu proses pengunduhan klip lain selesai.');
      return;
    }

    const isLocal = clipperSource === 'local';

    setDownloadingIndex(index);
    setDownloadStatus(isLocal ? 'Mengunggah video ke server lokal...' : 'Menghubungkan ke server lokal...');

    const statusSteps = isLocal
      ? [
          'Mengunggah berkas video...',
          'Memproses pemotongan segmen (FFmpeg)...',
          'Menyelesaikan berkas MP4...'
        ]
      : [
          'Memeriksa mesin pengunduh (yt-dlp)...',
          'Mengunduh segmen video dari YouTube...',
          'Menggabungkan dan memotong video/audio (FFmpeg)...',
          'Menyelesaikan berkas MP4...'
        ];

    let stepIdx = 0;
    const interval = setInterval(() => {
      if (stepIdx < statusSteps.length) {
        setDownloadStatus(statusSteps[stepIdx]);
        stepIdx++;
      }
    }, 3000);

    try {
      let response;
      if (isLocal) {
        if (!localFile && localFilePath) {
          // Direct local file path clipping (Super fast, no upload)
          response = await fetch('/api/clip-local-video-path', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              filePath: localFilePath,
              start: clip.start,
              end: clip.end,
              title: clip.title
            })
          });
        } else {
          // Upload localFile as raw binary stream to /api/clip-local-video
          response = await fetch(`/api/clip-local-video?start=${clip.start}&end=${clip.end}&title=${encodeURIComponent(clip.title)}`, {
            method: 'POST',
            headers: {
              'Content-Type': localFile.type || 'video/mp4'
            },
            body: localFile
          });
        }
      } else {
        response = await fetch('/api/clip-video', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: `https://www.youtube.com/watch?v=${videoId}`,
            start: clip.start,
            end: clip.end,
            title: clip.title
          })
        });
      }

      clearInterval(interval);

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Gagal memotong video.');
      }

      const result = await response.json();
      setDownloadStatus('Mengunduh klip ke komputer...');

      const a = document.createElement('a');
      a.href = result.downloadUrl;
      a.download = result.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setDownloadStatus('Selesai!');

      // Save clipper log to database
      if (import.meta.env.VITE_USE_LOCAL_DB === 'true' && user) {
        try {
          await fetch('/api/db/clipper/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              videoUrl: isLocal ? `Berkas Lokal: ${localFile.name}` : `https://www.youtube.com/watch?v=${videoId}`,
              title: clip.title || 'Klip Video',
              startTime: clip.start,
              endTime: clip.end,
              clipPath: result.downloadUrl || ''
            })
          });
          fetchClipperHistory();
        } catch (dbErr) {
          console.warn('Failed to save clipper history to database:', dbErr);
        }
      }

      setTimeout(() => {
        setDownloadingIndex(null);
        setDownloadStatus('');
      }, 1500);

    } catch (err) {
      clearInterval(interval);
      console.error('Download clip error:', err);
      alert('Gagal mengunduh klip: ' + err.message);
      setDownloadingIndex(null);
      setDownloadStatus('');
    }
  };

  // Reset all
  const handleReset = () => {
    setVideoUrl('');
    setVideoId('');
    setVideoMeta(null);
    setTranscript('');
    setClips([]);
    setActiveClip(null);
    setExpandedClipIndex(null);
    setLocalFile(null);
    setLocalFilePath('');
    if (localFileUrl && !localFileUrl.startsWith('/api/serve-local-video')) {
      URL.revokeObjectURL(localFileUrl);
    }
    setLocalFileUrl('');
    setLocalDuration(0);
  };

  // Get color for FYP score
  const getFypColor = (score) => {
    if (score >= 90) return '#f43f5e'; // rose
    if (score >= 80) return '#a855f7'; // purple
    return '#06b6d4'; // cyan
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Scissors color="#8b5cf6" size={26} />
            <span className="gradient-text">YouTube Clipper & FYP Recommender</span>
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Temukan segmen video paling viral secara otomatis menggunakan kecerdasan buatan Gemini AI.
          </p>
        </div>
        {videoId && (
          <button onClick={handleReset} className="btn-secondary" style={{ padding: '8px 14px', fontSize: '0.8rem' }}>
            <RefreshCw size={14} />
            Mulai Ulang
          </button>
        )}
      </div>

      {!videoId ? (
        /* STEP 1: Input URL and Transcript or Drag & Drop local video */
        <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Clipper Source Tabs */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
            <button
              onClick={() => { setClipperSource('youtube'); handleReset(); }}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                background: clipperSource === 'youtube' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                color: clipperSource === 'youtube' ? '#c084fc' : 'var(--text-muted)',
                border: clipperSource === 'youtube' ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid transparent',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <Youtube size={18} />
              Video YouTube / Shorts
            </button>
            <button
              onClick={() => { setClipperSource('local'); handleReset(); }}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                background: clipperSource === 'local' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                color: clipperSource === 'local' ? '#c084fc' : 'var(--text-muted)',
                border: clipperSource === 'local' ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid transparent',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <Download size={18} style={{ transform: 'rotate(180deg)' }} />
              Video Lokal (Drag & Drop)
            </button>
          </div>

          {clipperSource === 'youtube' ? (
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-main)' }}>
                Masukkan Link Video YouTube / Shorts
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}>
                    <Youtube size={20} />
                  </div>
                  <input 
                    type="text" 
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="input-field"
                    style={{ paddingLeft: '44px', width: '100%' }}
                  />
                </div>
                <button 
                  onClick={() => handleFetchMetadata(videoUrl)} 
                  className="btn-primary" 
                  style={{ minWidth: '130px', justifyContent: 'center' }}
                  disabled={isFetchingMeta || !videoUrl}
                >
                  {isFetchingMeta ? 'Memuat...' : 'Mulai'}
                </button>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                Mendukung URL YouTube standar, tautan pendek (youtu.be), dan YouTube Shorts.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div 
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith('video/')) {
                  handleSelectLocalFile(file);
                } else {
                  alert('Mohon unggah file video saja (seperti .mp4, .webm, .mov)!');
                }
              }}
              style={{
                border: isDragging ? '2px dashed #8b5cf6' : '2px dashed var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '40px 20px',
                textAlign: 'center',
                background: isDragging ? 'rgba(139, 92, 246, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                boxShadow: isDragging ? 'var(--shadow-glow)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px'
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept="video/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) handleSelectLocalFile(file);
                }}
              />
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'rgba(139, 92, 246, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#8b5cf6'
              }}>
                <Sparkles size={28} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Tarik & lepas file video Anda di sini
                </h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  atau klik untuk menjelajah file dari komputer Anda
                </p>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '20px' }}>
                Format didukung: MP4, WebM, MOV
              </span>
            </div>

            {/* Local File Path Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Info size={14} color="#8b5cf6" />
                Atau Masukkan Path Berkas Disk Lokal (Sangat Cepat & Tanpa Upload):
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  placeholder="Contoh: D:\videos\presentation.mp4" 
                  value={localFilePath} 
                  onChange={(e) => setLocalFilePath(e.target.value)}
                  className="input-field"
                  style={{ flex: 1, padding: '10px 14px' }}
                />
                <button 
                  onClick={handleLoadLocalPath}
                  className="btn-primary"
                  style={{ padding: '10px 18px', background: 'var(--gradient-primary)', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  Muat Berkas
                </button>
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
                💡 Tips: Klik kanan file video Anda di Windows, pilih <strong>"Copy as path"</strong>, lalu paste di sini.
              </p>
            </div>
          </div>
        )}

          <div style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.15)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <Info size={20} color="#8b5cf6" style={{ shrink: 0, marginTop: '2px' }} />
            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#a5b4fc', margin: '0 0 4px 0' }}>Cara Kerja Fitur Clipper:</h4>
              <ol style={{ fontSize: '0.8rem', color: 'var(--text-muted)', paddingLeft: '18px', margin: 0, lineHeight: '1.5' }}>
                <li>{clipperSource === 'youtube' ? 'Tempelkan tautan video YouTube Anda.' : 'Pilih atau seret berkas video lokal Anda.'}</li>
                <li>AI akan memindai percakapan video (transkrip) untuk mencari klip viral dengan potensi FYP tinggi.</li>
                <li>Gunakan Timing Editor di bawah player untuk menyunting stempel waktu secara presisi secara mandiri.</li>
                <li>Mulai pemotongan instan dan simpan klip video langsung ke komputer Anda.</li>
              </ol>
            </div>
          </div>
        </div>
      ) : (
        /* STEP 2: Metadata Loaded & Analysis Trigger */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Metadata Card */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
            {clipperSource === 'local' ? (
              <div style={{ width: '160px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'rgba(139, 92, 246, 0.05)', color: '#8b5cf6' }}>
                <Sparkles size={32} />
              </div>
            ) : (
              videoMeta?.thumbnailUrl && (
                <img 
                  src={videoMeta.thumbnailUrl} 
                  alt="thumbnail" 
                  style={{ width: '160px', height: '90px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }} 
                />
              )
            )}
            <div style={{ flex: 1, minWidth: '250px' }}>
              <span className="badge badge-indigo" style={{ marginBottom: '8px' }}>
                {clipperSource === 'local' ? 'Video Lokal Dimuat' : 'YouTube Loaded'}
              </span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--text-main)' }}>{videoMeta?.title}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                {clipperSource === 'local' ? videoMeta?.description : `Pembuat: ${videoMeta?.authorName}`}
              </p>
            </div>
            
            {!clips.length && !isAnalyzing && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={handleAnalyzeClips} 
                  className="btn-primary" 
                  style={{ alignSelf: 'center', background: 'var(--gradient-primary)' }}
                >
                  <Sparkles size={16} />
                  Analisis Potensi FYP
                </button>
                <button 
                  onClick={handleStartManualClipping} 
                  className="btn-secondary" 
                  style={{ alignSelf: 'center' }}
                >
                  <Scissors size={14} />
                  Mulai Pemotongan Manual
                </button>
              </div>
            )}
          </div>

          {/* Setup Analysis Input & Process Loader */}
          {!clips.length && (
            <div className="glass-panel" style={{ padding: '24px' }}>
              {isAnalyzing ? (
                /* Loading State */
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', gap: '16px' }}>
                  <div className="spinner" style={{ 
                    border: '4px solid rgba(255, 255, 255, 0.1)', 
                    width: '50px', 
                    height: '50px', 
                    borderRadius: '50%', 
                    borderLeftColor: '#8b5cf6', 
                    animation: 'spin 1s linear infinite' 
                  }}></div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Sedang Menganalisis Klip Viral...</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, animation: 'pulse 1.5s infinite' }}>{analysisStep}</p>
                  
                  {/* Style block for loading animations if needed */}
                  <style>{`
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                    @keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
                  `}</style>
                </div>
              ) : (
                /* Transcript Input & Details before running AI */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        Transkrip / Subtitel Video <span style={{ color: 'var(--text-dim)', fontWeight: 500 }}>(Sangat Direkomendasikan)</span>
                      </label>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Format bebas (bisa dengan/tanpa timestamp)</span>
                    </div>
                    <textarea 
                      value={transcript}
                      onChange={(e) => setTranscript(e.target.value)}
                      placeholder="Tempel transkrip percakapan video di sini untuk membantu AI mendeteksi stempel waktu awal dan akhir klip secara akurat...&#10;&#10;Contoh:&#10;[00:15] Jadi hari ini kita mau bahas rahasia algoritma TikTok...&#10;[00:45] Dan itulah cara pertama agar video kalian masuk fyp..."
                      className="input-field font-mono"
                      rows={8}
                      style={{ width: '100%', resize: 'vertical', fontSize: '0.825rem', padding: '12px' }}
                    />
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertCircle size={12} color="#f59e0b" />
                      Jika tidak menyertakan transkrip, Gemini AI akan membuat klip perkiraan berdasarkan analisis dari judul dan deskripsi video.
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <button 
                      onClick={handleStartManualClipping} 
                      className="btn-secondary" 
                      style={{ padding: '12px 24px', fontSize: '0.95rem' }}
                    >
                      <Scissors size={14} />
                      Mulai Pemotongan Manual
                    </button>
                    <button 
                      onClick={handleAnalyzeClips} 
                      className="btn-primary" 
                      style={{ padding: '12px 24px', fontSize: '0.95rem' }}
                    >
                      <Sparkles size={18} />
                      Mulai Analisis AI Sekarang
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Clipper Dashboard (Main Split Screen View) */}
          {clips.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'start', flexWrap: 'wrap' }}>
              
              {/* Left Side: Video Player & Active Clip Preview */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Embedded Video Player */}
                <div className="glass-panel" style={{ padding: '12px', overflow: 'hidden' }}>
                  <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: '#000' }}>
                    {clipperSource === 'local' ? (
                      <video
                        ref={localVideoRef}
                        src={localFileUrl}
                        controls
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain' }}
                        onTimeUpdate={handleLocalVideoTimeUpdate}
                      />
                    ) : (
                      <iframe
                        key={activeClip ? `${videoId}-${activeClip.start}-${activeClip.end}` : videoId}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                        src={
                          activeClip 
                            ? `https://www.youtube.com/embed/${videoId}?start=${activeClip.start}&end=${activeClip.end}&autoplay=1&rel=0` 
                            : `https://www.youtube.com/embed/${videoId}?rel=0`
                        }
                        title="YouTube video player"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      ></iframe>
                    )}
                  </div>
                  
                  {activeClip ? (
                    <div style={{ marginTop: '16px', padding: '4px 8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
                        <div>
                          <span className="badge" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc', marginBottom: '6px' }}>Klip Terpilih</span>
                          <h4 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>{activeClip.title}</h4>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          {activeClip.fypLevel === 'Manual' || activeClip.fypLevel === 'Kustom' ? (
                            <span className="badge" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc', border: '1px solid rgba(139, 92, 246, 0.3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Scissors size={12} />
                              Manual
                            </span>
                          ) : (
                            <span className="badge" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Flame size={12} fill="#f43f5e" />
                              {activeClip.viralityScore}% FYP
                            </span>
                          )}
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Durasi: {activeClip.duration} detik</p>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(15, 23, 42, 0.4)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginTop: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 700 }}>
                          <Clock size={16} color="#8b5cf6" />
                          <span>Sesuaikan Rentang Waktu (Detik)</span>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                          <div style={{ flex: 1, minWidth: '100px' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Mulai:</label>
                            <input 
                              type="number" 
                              step="0.1"
                              min="0"
                              value={editStart}
                              onChange={(e) => setEditStart(e.target.value)}
                              className="input-field"
                              style={{ width: '100%', padding: '6px 10px', fontSize: '0.85rem' }}
                            />
                          </div>
                          <div style={{ flex: 1, minWidth: '100px' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Selesai:</label>
                            <input 
                              type="number" 
                              step="0.1"
                              min="0"
                              value={editEnd}
                              onChange={(e) => setEditEnd(e.target.value)}
                              className="input-field"
                              style={{ width: '100%', padding: '6px 10px', fontSize: '0.85rem' }}
                            />
                          </div>
                          <div>
                            <button
                              onClick={handleApplyTimeChange}
                              className="btn-primary"
                              style={{ padding: '8px 14px', fontSize: '0.8rem', background: 'var(--gradient-primary)', border: 'none', height: '36px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                            >
                              <Check size={14} />
                              Terapkan & Putar
                            </button>
                          </div>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Rentang saat ini: <strong style={{ color: '#c084fc' }}>{formatTime(activeClip.start)}</strong> s.d. <strong style={{ color: '#c084fc' }}>{formatTime(activeClip.end)}</strong> ({activeClip.duration}s)
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p style={{ margin: '12px 8px', fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      Pilih salah satu rekomendasi klip di sebelah kanan untuk mulai memutar segmen spesifik.
                    </p>
                  )}
                </div>

                {/* Active Clip Strategic Rationale Panel */}
                {activeClip && activeClip.fypLevel !== 'Manual' && activeClip.fypLevel !== 'Kustom' && (
                  <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 800, borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkles size={16} color="#8b5cf6" />
                      Strategi Viral & Arahan Klip
                    </h4>

                    {activeClip.hookStrategy && (
                      <div>
                        <h5 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                          Taktik Hook (3 Detik Pertama)
                        </h5>
                        <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>{activeClip.hookStrategy}</p>
                      </div>
                    )}

                    {activeClip.rationale && (
                      <div>
                        <h5 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                          Alasan Rekomendasi FYP
                        </h5>
                        <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>{activeClip.rationale}</p>
                      </div>
                    )}

                    {activeClip.editingStyle && (
                      <div style={{ padding: '12px', background: 'rgba(6, 182, 212, 0.04)', border: '1px solid rgba(6, 182, 212, 0.15)', borderRadius: 'var(--radius-sm)' }}>
                        <h5 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#22d3ee', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Music size={12} />
                          Saran Edit & Audio
                        </h5>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>{activeClip.editingStyle}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Side: Recommender List & Copy Sections */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Form to Add Custom Clip */}
                <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px dashed var(--border-color)' }}>
                  <h5 style={{ fontSize: '0.875rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)' }}>
                    <Scissors size={14} color="#8b5cf6" />
                    Buat Klip Kustom Baru
                  </h5>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <input 
                      type="text" 
                      placeholder="Judul klip..." 
                      value={customTitle} 
                      onChange={(e) => setCustomTitle(e.target.value)}
                      className="input-field"
                      style={{ flex: '2 1 150px', padding: '6px 10px', fontSize: '0.8rem' }}
                    />
                    <input 
                      type="number" 
                      step="0.1"
                      min="0"
                      placeholder="Mulai (detik)" 
                      value={customStart} 
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="input-field"
                      style={{ flex: '1 1 80px', padding: '6px 10px', fontSize: '0.8rem' }}
                    />
                    <input 
                      type="number" 
                      step="0.1"
                      min="0"
                      placeholder="Selesai (detik)" 
                      value={customEnd} 
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="input-field"
                      style={{ flex: '1 1 80px', padding: '6px 10px', fontSize: '0.8rem' }}
                    />
                    <button 
                      onClick={handleAddCustomClip}
                      className="btn-primary"
                      style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc', border: '1px solid rgba(139, 92, 246, 0.3)', cursor: 'pointer', height: '32px' }}
                    >
                      + Tambah
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    Rekomendasi Segmen ({clips.length} Klip)
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Diurutkan berdasarkan virality</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {clips.map((clip, index) => {
                    const isSelected = activeClip && activeClip.start === clip.start && activeClip.end === clip.end;
                    const isExpanded = expandedClipIndex === index;

                    return (
                      <div 
                        key={index} 
                        className="glass-panel" 
                        style={{ 
                          border: isSelected ? '1.5px solid var(--accent-purple)' : '1px solid var(--border-color)',
                          boxShadow: isSelected ? 'var(--shadow-glow)' : 'none',
                          background: isSelected ? 'rgba(139, 92, 246, 0.03)' : 'var(--bg-card)',
                          overflow: 'hidden',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {downloadingIndex === index && (
                          <div style={{ 
                            background: 'rgba(99, 102, 241, 0.12)', 
                            borderBottom: '1px solid rgba(99, 102, 241, 0.2)', 
                            padding: '8px 16px', 
                            fontSize: '0.75rem', 
                            color: '#a5b4fc', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px' 
                          }}>
                            <span className="spinner-mini" style={{
                              display: 'inline-block',
                              width: '12px',
                              height: '12px',
                              border: '2px solid rgba(255,255,255,0.2)',
                              borderRadius: '50%',
                              borderTopColor: '#a5b4fc',
                              animation: 'spin 1s linear infinite'
                            }}></span>
                            <span>Progres: {downloadStatus}</span>
                          </div>
                        )}
                        {/* Summary Header */}
                        <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                              <span style={{ 
                                display: 'inline-flex',
                                width: '22px',
                                height: '22px',
                                borderRadius: '50%',
                                background: getFypColor(clip.viralityScore),
                                color: 'white',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                {index + 1}
                              </span>
                              <span className="font-mono" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                                {formatTime(clip.start)} - {formatTime(clip.end)} ({clip.duration}s)
                              </span>
                            </div>
                            
                            <h5 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                              {clip.title}
                            </h5>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {clip.fypLevel === 'Manual' || clip.fypLevel === 'Kustom' ? (
                                <span style={{ fontSize: '0.75rem', color: '#c084fc', fontWeight: 700, background: 'rgba(139, 92, 246, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                                  Manual
                                </span>
                              ) : (
                                <>
                                  <Flame size={14} color={getFypColor(clip.viralityScore)} fill={getFypColor(clip.viralityScore)} />
                                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: getFypColor(clip.viralityScore) }}>
                                    {clip.viralityScore}%
                                  </span>
                                </>
                              )}
                            </div>
                            
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button 
                                onClick={() => handlePlayClip(clip)}
                                className="btn-secondary" 
                                style={{ 
                                  padding: '6px 10px', 
                                  fontSize: '0.75rem',
                                  background: isSelected ? 'var(--gradient-primary)' : 'rgba(255,255,255,0.05)',
                                  color: isSelected ? '#fff' : 'var(--text-main)',
                                  border: 'none'
                                }}
                              >
                                <Play size={12} fill={isSelected ? '#fff' : 'currentColor'} />
                                Putar
                              </button>

                              <button 
                                onClick={() => handleDownloadClip(clip, index)}
                                className="btn-secondary" 
                                style={{ 
                                  padding: '6px 10px', 
                                  fontSize: '0.75rem',
                                  background: 'rgba(99, 102, 241, 0.15)',
                                  color: '#a5b4fc',
                                  border: '1px solid rgba(99, 102, 241, 0.3)',
                                  cursor: downloadingIndex !== null ? 'not-allowed' : 'pointer'
                                }}
                                disabled={downloadingIndex !== null}
                                title="Potong dan unduh segmen video ini secara fisik"
                              >
                                {downloadingIndex === index ? (
                                  <>
                                    <span className="spinner-mini" style={{
                                      display: 'inline-block',
                                      width: '10px',
                                      height: '10px',
                                      border: '2px solid rgba(255,255,255,0.2)',
                                      borderRadius: '50%',
                                      borderTopColor: '#fff',
                                      animation: 'spin 1s linear infinite',
                                      marginRight: '6px'
                                    }}></span>
                                    Proses...
                                  </>
                                ) : (
                                  <>
                                    <Download size={12} />
                                    Potong & Unduh
                                  </>
                                )}
                              </button>
                              
                              <button 
                                onClick={() => setExpandedClipIndex(isExpanded ? null : index)}
                                style={{ 
                                  background: 'none', 
                                  border: 'none', 
                                  color: 'var(--text-muted)', 
                                  cursor: 'pointer',
                                  padding: '4px',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                              >
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Collapsible Details */}
                        {isExpanded && (
                          <div style={{ padding: '0 16px 16px 16px', borderTop: '1px solid var(--border-color)', background: 'rgba(0, 0, 0, 0.15)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            
                            {/* Hook, Rationale, and Edit recommendations in brief */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78rem', marginTop: '12px' }}>
                              {clip.hookStrategy && (
                                <div>
                                  <strong style={{ color: 'var(--text-main)' }}>FYP Hook:</strong>{' '}
                                  <span style={{ color: 'var(--text-muted)' }}>{clip.hookStrategy}</span>
                                </div>
                              )}
                              {clip.editingStyle && (
                                <div>
                                  <strong style={{ color: 'var(--text-main)' }}>Rekomendasi Edit:</strong>{' '}
                                  <span style={{ color: 'var(--text-muted)' }}>{clip.editingStyle}</span>
                                </div>
                              )}
                            </div>

                            {/* Caption & Hashtags Container */}
                            {(clip.caption || clip.hashtags) && (
                              <div style={{ background: 'rgba(15, 23, 42, 0.7)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a5b4fc', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Share2 size={12} />
                                    Caption & Hashtags Viral
                                  </span>
                                  <button 
                                    onClick={() => handleCopyCaption(`${clip.caption}\n\n${clip.hashtags}`, index)}
                                    style={{ 
                                      background: 'none', 
                                      border: 'none', 
                                      color: copiedClipIndex === index ? '#10b981' : 'var(--text-muted)', 
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      fontSize: '0.72rem',
                                      fontWeight: 600
                                    }}
                                  >
                                    {copiedClipIndex === index ? (
                                      <>
                                        <Check size={12} />
                                        Disalin!
                                      </>
                                    ) : (
                                      <>
                                        <Copy size={12} />
                                        Salin
                                      </>
                                    )}
                                  </button>
                                </div>
                                {clip.caption && (
                                  <p style={{ fontSize: '0.75rem', color: 'var(--text-main)', margin: 0, whiteSpace: 'pre-line', lineHeight: '1.4' }}>
                                    {clip.caption}
                                  </p>
                                )}
                                {clip.hashtags && (
                                  <p style={{ fontSize: '0.72rem', color: '#06b6d4', margin: 0, fontWeight: 600 }}>
                                    {clip.hashtags}
                                  </p>
                                )}
                              </div>
                            )}

                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

        </div>
      )}

      {/* Previously Clipped Videos History */}
      {clipperHistory && clipperHistory.length > 0 && (
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} color="#8b5cf6" />
            <span>Riwayat Pemotongan Video Anda</span>
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px 10px' }}>Tanggal</th>
                  <th style={{ padding: '12px 10px' }}>Judul Klip</th>
                  <th style={{ padding: '12px 10px' }}>Tautan Video</th>
                  <th style={{ padding: '12px 10px' }}>Segmen Waktu</th>
                  <th style={{ padding: '12px 10px', textAlign: 'right' }}>Unduh Ulang</th>
                </tr>
              </thead>
              <tbody>
                {clipperHistory.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '12px 10px', color: 'var(--text-muted)' }}>
                      {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '12px 10px', fontWeight: 800 }}>{item.title}</td>
                    <td style={{ padding: '12px 10px' }}>
                      {item.video_url && item.video_url.startsWith('Berkas Lokal:') ? (
                        <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{item.video_url}</span>
                      ) : (
                        <a href={item.video_url} target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 600 }}>
                          Lihat Video Asli ↗
                        </a>
                      )}
                    </td>
                    <td style={{ padding: '12px 10px', color: '#c084fc', fontWeight: 700 }}>
                      {item.start_time} - {item.end_time}
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                      <a 
                        href={item.clip_path} 
                        download 
                        className="btn-secondary" 
                        style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '6px', 
                          padding: '6px 12px', 
                          fontSize: '0.75rem',
                          textDecoration: 'none',
                          borderColor: 'rgba(99, 102, 241, 0.3)'
                        }}
                      >
                        <Download size={12} />
                        Unduh Klip
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
