import React, { useState, useRef, useEffect } from 'react';
import { Bot, User, Send, Sparkles, Copy, Check, AlertTriangle, Key } from 'lucide-react';
import { marked } from 'marked';
import { askAgentAboutData } from '../services/gemini';

export default function AgentChat({ dataset, apiKey, selectedModel, onOpenApiKeyModal, verifyAndConsumeQuota }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'agent',
      text: `Halo! Saya adalah **DataFlow AI Agent**. Saya telah mempelajari dataset **${dataset.fileName}** (${dataset.audit.rowCount} baris, ${dataset.audit.colCount} kolom).\n\nAda yang bisa saya bantu atau analisiskan dari data ini?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const quickPrompts = [
    '📊 Berikan ringkasan statistik paling penting dari dataset ini',
    '🏆 Tampilkan 5 item/baris dengan nilai tertinggi',
    '⚠️ Apakah ada anomali atau data yang mencurigakan?',
    '💡 Berikan 3 rekomendasi strategis berdasarkan data ini'
  ];

  const handleSend = async (queryText) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || loading) return;

    if (verifyAndConsumeQuota) {
      try {
        await verifyAndConsumeQuota(1000);
      } catch (quotaErr) {
        alert(quotaErr.message);
        return;
      }
    }

    if (!apiKey) {
      onOpenApiKeyModal();
      return;
    }

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const responseText = await askAgentAboutData({
        query: textToSend,
        fileName: dataset.fileName,
        headers: dataset.headers,
        audit: dataset.audit,
        dataSample: dataset.rawData,
        chatHistory: messages,
        apiKey,
        modelName: selectedModel
      });

      const agentMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, agentMsg]);
    } catch (err) {
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        text: `⚠️ **Terjadi Kesalahan**: ${err.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
      {/* API Key Alert Notice if Missing */}
      {!apiKey && (
        <div style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 'var(--radius-md)', padding: '12px 18px', marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={18} color="#f59e0b" />
            <span style={{ fontSize: '0.85rem', color: '#fcd34d', fontWeight: 600 }}>
              Gemini API Key belum dikonfigurasi. Hubungkan kunci Anda untuk memulai percakapan.
            </span>
          </div>
          <button onClick={onOpenApiKeyModal} className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.775rem' }}>
            <Key size={13} /> Set Key Sekarang
          </button>
        </div>
      )}

      {/* Chat Messages Log */}
      <div className="glass-panel" style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {messages.map((msg) => {
          const isAgent = msg.sender === 'agent';
          return (
            <div key={msg.id} style={{ display: 'flex', gap: '14px', flexDirection: isAgent ? 'row' : 'row-reverse' }}>
              {/* Avatar */}
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '12px',
                background: isAgent ? 'var(--gradient-primary)' : 'rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {isAgent ? <Bot size={20} color="white" /> : <User size={18} color="white" />}
              </div>

              {/* Message Bubble */}
              <div style={{
                maxWidth: '82%',
                background: isAgent ? 'rgba(15, 23, 42, 0.85)' : 'rgba(99, 102, 241, 0.2)',
                border: `1px solid ${isAgent ? 'var(--border-color)' : 'rgba(99, 102, 241, 0.4)'}`,
                borderRadius: 'var(--radius-lg)',
                padding: '16px 20px',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isAgent ? '#a5b4fc' : '#6366f1' }}>
                    {isAgent ? 'DataFlow AI Agent' : 'Anda'}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{msg.timestamp}</span>
                    {isAgent && (
                      <button 
                        onClick={() => copyToClipboard(msg.text, msg.id)}
                        className="btn-ghost"
                        style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                        title="Salin Respons"
                      >
                        {copiedId === msg.id ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                      </button>
                    )}
                  </div>
                </div>

                <div 
                  className="markdown-body"
                  dangerouslySetInnerHTML={{ __html: marked.parse(msg.text) }}
                  style={{ fontSize: '0.9rem', lineHeight: '1.6' }}
                />
              </div>
            </div>
          );
        })}

        {loading && (
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={20} color="white" className="agent-thinking-glow" />
            </div>
            <div style={{ background: 'rgba(15, 23, 42, 0.85)', padding: '12px 18px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', color: '#a5b4fc', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sparkles size={16} className="agent-thinking-glow" color="#8b5cf6" />
              <span>AI Agent sedang menganalisis dataset Anda...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Quick Prompts Chips */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '10px 4px 6px 4px' }}>
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            disabled={loading}
            className="btn-secondary"
            style={{ fontSize: '0.75rem', padding: '6px 12px', whiteSpace: 'nowrap', borderRadius: '99px' }}
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
        <input 
          type="text" 
          placeholder="Tanyakan sesuatu pada AI Agent (misal: Berapa total transaksi wilayah Jakarta?)..."
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          className="input-field"
          style={{ flex: 1, padding: '14px 18px', fontSize: '0.925rem' }}
          disabled={loading}
        />
        <button type="submit" className="btn-primary" disabled={loading || !inputQuery.trim()} style={{ padding: '0 24px' }}>
          <Send size={18} />
          <span>Kirim</span>
        </button>
      </form>
    </div>
  );
}
