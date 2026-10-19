import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import { BarChart3, LineChart, PieChart, Sparkles, Lightbulb } from 'lucide-react';
import { suggestCharts } from '../services/gemini';

// Register Chart.js Components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function DataVisualizer({ dataset, apiKey, selectedModel, verifyAndConsumeQuota }) {
  const { headers, rawData, audit } = dataset;

  const [chartType, setChartType] = useState('bar');
  const [xAxisCol, setXAxisCol] = useState(headers[0] || '');
  const [yAxisCol, setYAxisCol] = useState(headers.find(h => audit.colDetails[h]?.type === 'number') || headers[1] || headers[0]);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [loadingAi, setLoadingAi] = useState(false);

  // Auto pick good default axes
  useEffect(() => {
    const stringCol = headers.find(h => audit.colDetails[h]?.type === 'string');
    const numCol = headers.find(h => audit.colDetails[h]?.type === 'number');
    if (stringCol) setXAxisCol(stringCol);
    if (numCol) setYAxisCol(numCol);
  }, [dataset]);

  // Aggregate Data for Charting
  const generateChartData = () => {
    if (!xAxisCol || !yAxisCol || rawData.length === 0) {
      return { labels: [], datasets: [] };
    }

    const aggregated = {};
    rawData.forEach(row => {
      const key = String(row[xAxisCol] ?? 'N/A');
      const val = Number(row[yAxisCol]) || 0;
      aggregated[key] = (aggregated[key] || 0) + val;
    });

    const labels = Object.keys(aggregated).slice(0, 15); // limit top 15 categories for visual clarity
    const values = labels.map(l => aggregated[l]);

    const paletteColors = [
      'rgba(99, 102, 241, 0.85)',
      'rgba(6, 182, 212, 0.85)',
      'rgba(139, 92, 246, 0.85)',
      'rgba(16, 185, 129, 0.85)',
      'rgba(245, 158, 11, 0.85)',
      'rgba(244, 63, 94, 0.85)',
      'rgba(217, 70, 239, 0.85)'
    ];

    const borderColors = paletteColors.map(c => c.replace('0.85', '1'));

    return {
      labels,
      datasets: [
        {
          label: `${yAxisCol} per ${xAxisCol}`,
          data: values,
          backgroundColor: chartType === 'pie' || chartType === 'doughnut' ? paletteColors : 'rgba(99, 102, 241, 0.75)',
          borderColor: chartType === 'pie' || chartType === 'doughnut' ? borderColors : '#6366f1',
          borderWidth: 2,
          borderRadius: chartType === 'bar' ? 6 : 0
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#f8fafc', font: { family: 'Plus Jakarta Sans', size: 12 } }
      },
      title: {
        display: true,
        text: `Visualisasi: ${yAxisCol} berdasarkan ${xAxisCol}`,
        color: '#f8fafc',
        font: { family: 'Plus Jakarta Sans', size: 16, weight: 'bold' }
      }
    },
    scales: chartType === 'pie' || chartType === 'doughnut' ? {} : {
      x: {
        ticks: { color: '#94a3b8' },
        grid: { color: 'rgba(255,255,255,0.05)' }
      },
      y: {
        ticks: { color: '#94a3b8' },
        grid: { color: 'rgba(255,255,255,0.05)' }
      }
    }
  };

  const handleAiSuggest = async () => {
    if (verifyAndConsumeQuota) {
      try {
        await verifyAndConsumeQuota(1000);
      } catch (quotaErr) {
        alert(quotaErr.message);
        return;
      }
    }
    if (!apiKey) {
      alert('Masukkan Gemini API Key terlebih dahulu untuk fitur rekomendasi grafik AI.');
      return;
    }
    setLoadingAi(true);
    try {
      const suggestions = await suggestCharts({
        headers,
        audit,
        dataSample: rawData,
        apiKey,
        modelName: selectedModel
      });
      setAiSuggestions(suggestions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAi(false);
    }
  };

  const applySuggestion = (sug) => {
    if (sug.type) setChartType(sug.type);
    if (sug.xAxisColumn && headers.includes(sug.xAxisColumn)) setXAxisCol(sug.xAxisColumn);
    if (sug.yAxisColumn && headers.includes(sug.yAxisColumn)) setYAxisCol(sug.yAxisColumn);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Control Toolbar */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {/* Chart Type Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
              Tipe Grafik
            </label>
            <div style={{ display: 'flex', background: 'var(--bg-input)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <button 
                onClick={() => setChartType('bar')}
                className={`btn-ghost ${chartType === 'bar' ? 'active' : ''}`}
                style={{ padding: '6px 12px', background: chartType === 'bar' ? 'var(--accent-primary)' : 'transparent', color: chartType === 'bar' ? 'white' : 'var(--text-muted)' }}
              >
                <BarChart3 size={15} /> Bar
              </button>
              <button 
                onClick={() => setChartType('line')}
                className={`btn-ghost ${chartType === 'line' ? 'active' : ''}`}
                style={{ padding: '6px 12px', background: chartType === 'line' ? 'var(--accent-primary)' : 'transparent', color: chartType === 'line' ? 'white' : 'var(--text-muted)' }}
              >
                <LineChart size={15} /> Line
              </button>
              <button 
                onClick={() => setChartType('pie')}
                className={`btn-ghost ${chartType === 'pie' ? 'active' : ''}`}
                style={{ padding: '6px 12px', background: chartType === 'pie' ? 'var(--accent-primary)' : 'transparent', color: chartType === 'pie' ? 'white' : 'var(--text-muted)' }}
              >
                <PieChart size={15} /> Pie
              </button>
            </div>
          </div>

          {/* X Axis Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
              Sumbu X (Kategori)
            </label>
            <select 
              value={xAxisCol}
              onChange={(e) => setXAxisCol(e.target.value)}
              className="input-field"
              style={{ minWidth: '160px' }}
            >
              {headers.map(h => <option key={h} value={h} style={{ background: '#0f172a' }}>{h}</option>)}
            </select>
          </div>

          {/* Y Axis Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
              Sumbu Y (Nilai / Agregat)
            </label>
            <select 
              value={yAxisCol}
              onChange={(e) => setYAxisCol(e.target.value)}
              className="input-field"
              style={{ minWidth: '160px' }}
            >
              {headers.map(h => <option key={h} value={h} style={{ background: '#0f172a' }}>{h}</option>)}
            </select>
          </div>
        </div>

        {/* AI Auto Suggest Button */}
        <button onClick={handleAiSuggest} disabled={loadingAi} className="btn-primary" style={{ padding: '10px 18px', fontSize: '0.85rem' }}>
          <Sparkles size={16} />
          <span>{loadingAi ? 'Menganalisis...' : 'Rekomendasi Grafik AI'}</span>
        </button>
      </div>

      {/* AI Suggestions Row */}
      {aiSuggestions.length > 0 && (
        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Lightbulb size={16} color="#f59e0b" />
            <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>Rekomendasi Visualisasi dari AI Agent:</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            {aiSuggestions.map((sug, i) => (
              <button
                key={i}
                onClick={() => applySuggestion(sug)}
                className="glass-panel glass-panel-hover"
                style={{ padding: '12px 16px', textAlign: 'left', cursor: 'pointer', background: 'rgba(255,255,255,0.02)' }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#a5b4fc', marginBottom: '4px' }}>{sug.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sug.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chart Canvas Display */}
      <div className="glass-panel" style={{ padding: '24px', height: '480px', position: 'relative' }}>
        {chartType === 'bar' && <Bar data={generateChartData()} options={chartOptions} />}
        {chartType === 'line' && <Line data={generateChartData()} options={chartOptions} />}
        {chartType === 'pie' && <Pie data={generateChartData()} options={chartOptions} />}
        {chartType === 'doughnut' && <Doughnut data={generateChartData()} options={chartOptions} />}
      </div>
    </div>
  );
}
