'use client';

import React, { useState, useEffect } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  BarChart3,
  Download,
  RefreshCw,
  Search,
  Star,
  Users,
  Lightbulb,
  FileSpreadsheet,
  CheckCircle2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface FeedbackItem {
  id: string;
  timestamp: string;
  studentName: string;
  priorExperience: string;
  rating: number;
  favoriteConcept: string;
  nextProjectWishlist: string;
  comments: string;
}

const COLORS = ['#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export default function AnalyticsDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authToken, setAuthToken] = useState('');
  const [authError, setAuthError] = useState('');

  const [loadingData, setLoadingData] = useState(false);
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    const savedToken = sessionStorage.getItem('admin_auth_token');
    if (savedToken) {
      setAuthToken(savedToken);
      setIsAuthenticated(true);
      fetchAnalytics(savedToken);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setAuthToken(data.token);
        sessionStorage.setItem('admin_auth_token', data.token);
        setIsAuthenticated(true);
        fetchAnalytics(data.token);
      } else {
        setAuthError(data.error || 'Incorrect password.');
      }
    } catch (err) {
      setAuthError('Authentication error. Try again.');
    }
  };

  const fetchAnalytics = async (token: string) => {
    setLoadingData(true);
    try {
      const res = await fetch('/api/analytics', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const json = await res.json();
        setFeedbackList(json.data || []);
        setMetrics(json.metrics || null);
      } else if (res.status === 401) {
        setIsAuthenticated(false);
        sessionStorage.removeItem('admin_auth_token');
      }
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleExportCsv = () => {
    if (!authToken) return;
    window.open(`/api/export?token=${encodeURIComponent(authToken)}`, '_blank');
  };

  if (!isAuthenticated) {
    return (
      <div className="main-container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
        <div className="glass-card auth-lock-card" style={{ maxWidth: '420px', margin: '0 auto', textAlign: 'center' }}>
          <div className="lock-icon-wrap" style={{ margin: '0 auto 1.5rem auto' }}>
            <Lock size={28} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Protected Admin Dashboard
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.75rem' }}>
            Enter password to view feedback submissions, CSV data & Google Sheets metrics.
          </p>

          <form onSubmit={handleLogin}>
            <div className="field-group" style={{ textAlign: 'left', marginBottom: '1.25rem' }}>
              <label className="field-label">Admin Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="field-input"
                  placeholder="Enter password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingRight: '2.75rem' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <span style={{ fontSize: '0.775rem', color: '#64748b', marginTop: '0.35rem', display: 'block' }}>
                💡 Default password: <code style={{ color: '#22d3ee' }}>admin123</code>
              </span>
            </div>

            {authError && (
              <div
                style={{
                  padding: '0.75rem',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#fca5a5',
                  fontSize: '0.85rem',
                  marginBottom: '1.25rem',
                }}
              >
                ⚠️ {authError}
              </div>
            )}

            <button type="submit" className="btn-submit">
              Unlock Analytics Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <div className="badge-pill" style={{ marginBottom: '0.5rem' }}>
            <FileSpreadsheet size={16} />
            <span>Database Sync: CSV + Google Sheets</span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>⚡ VIBE CODING Analytics Dashboard</h1>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => fetchAnalytics(authToken)}
            disabled={loadingData}
          >
            <RefreshCw size={16} className={loadingData ? 'spin' : ''} />
            Refresh
          </button>

          <button
            type="button"
            className="btn-submit"
            onClick={handleExportCsv}
            style={{ padding: '0.65rem 1.25rem', fontSize: '0.9rem', background: 'linear-gradient(135deg, #10b981, #059669)' }}
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'rgba(6, 182, 212, 0.2)', color: '#22d3ee' }}>
            <Users size={24} />
          </div>
          <div>
            <div className="metric-val">{metrics?.totalCount || 0}</div>
            <div className="metric-lbl">Total Responses Logged</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' }}>
            <Star size={24} />
          </div>
          <div>
            <div className="metric-val">{metrics?.avgRating || 0} / 5</div>
            <div className="metric-lbl">Avg Seminar Rating</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#c084fc' }}>
            <Lightbulb size={24} />
          </div>
          <div>
            <div className="metric-val" style={{ fontSize: '1.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '220px' }}>
              {metrics?.topConcept || 'N/A'}
            </div>
            <div className="metric-lbl">#1 Resonated Slide Concept</div>
          </div>
        </div>
      </div>

      {/* Google Sheets Sync Guide Card */}
      <div className="glass-card" style={{ marginBottom: '2rem', borderColor: 'rgba(16, 185, 129, 0.4)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10b981', marginBottom: '0.5rem' }}>
          🟢 Google Sheets Database Sync for Vercel Deployment
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          When deploying to Vercel, pass environment variable <code style={{ color: '#22d3ee' }}>GOOGLE_SHEET_WEBHOOK_URL</code> to save feedback straight to your Google Sheet without needing any paid database server!
        </p>

        <details style={{ cursor: 'pointer', fontSize: '0.85rem', color: '#cbd5e1' }}>
          <summary style={{ fontWeight: 700, color: '#22d3ee' }}>Click to view 30-Second Google Apps Script snippet</summary>
          <pre style={{ background: 'rgba(8, 3, 26, 0.9)', border: '1px solid rgba(6, 182, 212, 0.3)', padding: '1rem', borderRadius: '10px', marginTop: '0.75rem', overflowX: 'auto', color: '#a5f3fc' }}>
            <code>{`function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  sheet.appendRow([
    data.id,
    data.timestamp,
    data.studentName,
    data.priorExperience,
    data.rating,
    data.favoriteConcept,
    data.nextProjectWishlist,
    data.comments
  ]);
  return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
}`}</code>
          </pre>
        </details>
      </div>

      {/* Data Table */}
      <div className="chart-card">
        <h3 className="chart-title">CSV Submissions Log ({feedbackList.length})</h3>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Prior Experience (Slide 2)</th>
                <th>Rating</th>
                <th>Favorite Slide Concept</th>
                <th>Next Project Wishlist</th>
                <th>Comments</th>
              </tr>
            </thead>
            <tbody>
              {feedbackList.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.studentName}</strong></td>
                  <td><span className="badge-tag">{item.priorExperience}</span></td>
                  <td>⭐ {item.rating} / 5</td>
                  <td style={{ color: '#cbd5e1' }}>{item.favoriteConcept}</td>
                  <td style={{ color: '#22d3ee', fontWeight: 600 }}>{item.nextProjectWishlist}</td>
                  <td style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{item.comments || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
