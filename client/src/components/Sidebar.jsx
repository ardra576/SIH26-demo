import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  UserCheck,
  ClipboardCheck,
  PieChart,
  FolderArchive,
  BrainCircuit,
  Compass,
  TrendingUp,
  Settings,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { storage } from '../utils/storage';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/profile', label: 'My Profile', icon: UserCheck },
  { path: '/assessment', label: 'Assessments', icon: ClipboardCheck },
  { path: '/skill-gaps', label: 'Skill Gaps', icon: PieChart },
  { path: '/learning-hub', label: 'Learning Hub', icon: FolderArchive },
  { path: '/quiz-generator', label: 'Quiz Generator', icon: BrainCircuit, highlight: true },
  { path: '/recommendations', label: 'Recommendations', icon: Compass },
  { path: '/progress', label: 'Progress', icon: TrendingUp },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ isOpen, onClose }) {
  const profile = storage.getProfile() || {};

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 40
          }}
          className="sidebar-backdrop"
        />
      )}

      <aside
        className={`app-sidebar ${isOpen ? 'open' : ''}`}
        style={{
          width: 260,
          background: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          transition: 'transform 0.3s ease',
          zIndex: 45
        }}
      >
        {/* Sidebar Brand Header */}
        <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'var(--grad-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-glow)'
            }}>
              <Sparkles size={20} color="#FFFFFF" />
            </div>
            <div>
              <div style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.15rem',
                fontWeight: 800,
                color: '#FFFFFF',
                letterSpacing: '-0.02em'
              }}>
                SkillBridge AI
              </div>
              <div style={{ fontSize: '0.7rem', color: '#A78BFA', fontWeight: 600 }}>
                SIH 2026 EDITION
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation links */}
        <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', overflowY: 'auto' }}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''} ${item.highlight ? 'highlight' : ''}`}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                  background: isActive
                    ? 'linear-gradient(90deg, rgba(139, 92, 246, 0.25) 0%, rgba(99, 102, 241, 0.1) 100%)'
                    : 'transparent',
                  borderLeft: isActive ? '3px solid #8B5CF6' : '3px solid transparent',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.9rem',
                  transition: 'all 0.2s ease',
                  textDecoration: 'none'
                })}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Icon size={18} color={item.highlight ? '#A78BFA' : undefined} />
                  <span>{item.label}</span>
                </div>
                {item.highlight && (
                  <span style={{
                    fontSize: '0.65rem',
                    background: 'var(--grad-primary)',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: 6,
                    fontWeight: 700
                  }}>
                    AI
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Mini Profile Footer */}
        <div style={{
          padding: '1.25rem',
          borderTop: '1px solid var(--border-subtle)',
          background: 'rgba(15, 23, 42, 0.4)'
        }}>
          <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 700,
              fontSize: '0.95rem'
            }}>
              {profile.name ? profile.name.charAt(0) : 'U'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {profile.name || 'Demo Learner'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {profile.role || 'AI Learner'}
              </div>
            </div>
            <ChevronRight size={16} color="var(--text-muted)" />
          </Link>
        </div>
      </aside>

      <style>{`
        @media (max-width: 1024px) {
          .app-sidebar {
            position: fixed;
            top: 0;
            bottom: 0;
            left: 0;
            transform: translateX(-100%);
          }
          .app-sidebar.open {
            transform: translateX(0);
          }
        }
        .sidebar-link:hover {
          background: rgba(255, 255, 255, 0.05) !important;
          color: #FFFFFF !important;
        }
      `}</style>
    </>
  );
}
