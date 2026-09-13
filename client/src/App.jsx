import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Menu, Sparkles, LayoutDashboard } from 'lucide-react';

import Sidebar from './components/Sidebar';
import AIChatbot from './components/AIChatbot';
import ToastContainer from './components/Toast';
import LandingPage from './pages/LandingPage';
import UserSetupPage from './pages/UserSetupPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import AssessmentPage from './pages/AssessmentPage';
import SkillGapsPage from './pages/SkillGapsPage';
import LearningHubPage from './pages/LearningHubPage';
import QuizGeneratorPage from './pages/QuizGeneratorPage';
import RecommendationsPage from './pages/RecommendationsPage';
import ProgressPage from './pages/ProgressPage';
import SettingsPage from './pages/SettingsPage';
import { api } from './services/api';

/**
 * Main Layout wrapper for dashboard pages
 */
function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [geminiActive, setGeminiActive] = useState(false);
  const location = useLocation();

  useEffect(() => {
    async function checkGemini() {
      const res = await api.checkHealth();
      if (res && res.geminiConfigured) {
        setGeminiActive(true);
      }
    }
    checkGemini();
  }, []);

  return (
    <div className="app-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-content">
        {/* Top Header Bar */}
        <header style={{
          padding: '1rem 2rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(7, 11, 20, 0.7)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 30
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                display: 'none',
                color: 'var(--text-main)',
                padding: '0.4rem',
                borderRadius: 8,
                background: 'rgba(255, 255, 255, 0.05)'
              }}
              className="top-menu-btn"
              aria-label="Toggle navigation drawer"
            >
              <Menu size={22} />
            </button>

            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              SkillBridge AI · Competency Intelligence Platform
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className={`badge ${geminiActive ? 'badge-strong' : 'badge-demo'}`}>
              <span style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: geminiActive ? '#10B981' : '#8B5CF6',
                boxShadow: geminiActive ? '0 0 8px #10B981' : '0 0 8px #8B5CF6'
              }} />
              <span>{geminiActive ? 'Live Gemini AI' : 'Demo Mode Active'}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1 }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .top-menu-btn { display: inline-flex !important; }
        }
      `}</style>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/setup" element={<UserSetupPage />} />

        {/* Dashboard Pages */}
        <Route path="/dashboard" element={<DashboardLayout><DashboardPage /></DashboardLayout>} />
        <Route path="/profile" element={<DashboardLayout><ProfilePage /></DashboardLayout>} />
        <Route path="/assessment" element={<DashboardLayout><AssessmentPage /></DashboardLayout>} />
        <Route path="/skill-gaps" element={<DashboardLayout><SkillGapsPage /></DashboardLayout>} />
        <Route path="/learning-hub" element={<DashboardLayout><LearningHubPage /></DashboardLayout>} />
        <Route path="/quiz-generator" element={<DashboardLayout><QuizGeneratorPage /></DashboardLayout>} />
        <Route path="/recommendations" element={<DashboardLayout><RecommendationsPage /></DashboardLayout>} />
        <Route path="/progress" element={<DashboardLayout><ProgressPage /></DashboardLayout>} />
        <Route path="/settings" element={<DashboardLayout><SettingsPage /></DashboardLayout>} />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <AIChatbot />
    </BrowserRouter>
  );
}
