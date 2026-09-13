import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  Layers,
  Clock,
  Zap,
  Sparkles,
  ArrowRight,
  BrainCircuit,
  BookOpen,
  Target,
  CheckCircle2,
  ChevronRight,
  FolderArchive
} from 'lucide-react';
import StatCard from '../components/StatCard';
import JourneyStepper from '../components/JourneyStepper';
import SkillMeter from '../components/SkillMeter';
import SkillChart from '../components/SkillChart';
import ProgressChart from '../components/ProgressChart';
import { api } from '../services/api';
import { storage } from '../utils/storage';
import { showToast } from '../components/Toast';

export default function DashboardPage() {
  const [profile, setProfile] = useState(storage.getProfile() || {});
  const [stats, setStats] = useState(storage.getStats());
  const [competencies, setCompetencies] = useState(storage.getCompetencies());
  const [recommendations, setRecommendations] = useState([]);
  const [activeModuleModal, setActiveModuleModal] = useState(null);

  useEffect(() => {
    async function loadData() {
      setProfile(storage.getProfile());
      setStats(storage.getStats());
      setCompetencies(storage.getCompetencies());

      // Fetch recommendations based on gaps
      const gaps = storage.getCompetencies().filter(c => c.score < 60);
      const recRes = await api.getRecommendations(gaps);
      if (recRes && recRes.recommendations) {
        setRecommendations(recRes.recommendations.slice(0, 3));
      }
    }
    loadData();
  }, []);

  const handleStartLearning = (rec) => {
    setActiveModuleModal(rec);
  };

  const handleCompleteModule = (rec) => {
    // Boost the associated skill competency
    const currentList = storage.getCompetencies();
    const targetSkill = currentList.find(c => c.name.toLowerCase().includes(rec.skill.toLowerCase()) || rec.skill.toLowerCase().includes(c.name.toLowerCase()));

    if (targetSkill) {
      const newScore = Math.min(100, targetSkill.score + 10);
      storage.updateCompetency(targetSkill.id, newScore);
      setCompetencies(storage.getCompetencies());
      setStats(storage.getStats());
      showToast(`Module completed! ${targetSkill.name} competency upgraded to ${newScore}%`, 'success');
    } else {
      showToast('Module completed successfully!', 'success');
    }
    setActiveModuleModal(null);
  };

  return (
    <div className="page-container">
      {/* Welcome Banner */}
      <div className="glass-card card-padding" style={{
        marginBottom: '2rem',
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.5rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 680 }}>
          <div className="badge badge-demo" style={{ marginBottom: '0.65rem' }}>
            <Sparkles size={14} color="#A78BFA" />
            <span>AI Competency Diagnostic Engine</span>
          </div>

          <h1 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.3rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
            Welcome back, {profile?.name ?? 'Learner'} 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            You are enrolled in the <strong style={{ color: '#FFFFFF' }}>{profile?.role ?? 'AI Engineering Track'}</strong>.
            SkillBridge AI has identified your top competency opportunities.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
          <Link to="/assessment" className="btn-primary" style={{ padding: '0.7rem 1.4rem', fontSize: '0.9rem' }}>
            <Target size={16} />
            <span>Take Assessment</span>
          </Link>
          <Link to="/quiz-generator" className="btn-secondary" style={{ padding: '0.7rem 1.4rem', fontSize: '0.9rem' }}>
            <BrainCircuit size={16} color="#A78BFA" />
            <span>Generate AI Quiz</span>
          </Link>
        </div>
      </div>

      {/* 4 Statistics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        <StatCard
          title="Overall Competency"
          value={`${stats.overallCompetency || 67}%`}
          subtext="across 5 dimensions"
          trend="+18%"
          color="purple"
          icon={Award}
        />
        <StatCard
          title="Skills Assessed"
          value={stats.skillsAssessed || 5}
          subtext="baseline verified"
          color="blue"
          icon={Layers}
        />
        <StatCard
          title="Learning Hours"
          value={`${stats.learningHours || 28.5}h`}
          subtext="logged this month"
          trend="+4.5h"
          color="emerald"
          icon={Clock}
        />
        <StatCard
          title="Quizzes Completed"
          value={stats.quizzesCompleted || 12}
          subtext="auto-evaluated"
          trend="+3 new"
          color="amber"
          icon={Zap}
        />
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <SkillChart data={competencies} />
        <ProgressChart data={competencies.map(comp => ({ name: comp.name, value: comp.score }))} title="Competency Scores" />
      </div>

      {/* 5-Step Learning Journey Stepper */}

      {/* 5-Step Learning Journey Stepper */}
      <JourneyStepper currentStage={profile.currentJourneyStage || 'ANALYZE'} />

      {/* Main Grid: Competency Meters & Recommendations */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '2rem',
        marginBottom: '2.5rem'
      }}>
        {/* Left Column: Core Competencies */}
        <div className="glass-card card-padding">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Competency Scores</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Real-time proficiency across core evaluation domains
              </p>
            </div>
            <Link to="/skill-gaps" style={{ fontSize: '0.85rem', color: '#A78BFA', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <span>View Analysis</span>
              <ChevronRight size={16} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {competencies.map((comp) => (
              <SkillMeter
                key={comp.id || comp.name}
                name={comp.name}
                score={comp.score}
                category={comp.category}
                beforeScore={comp.beforeScore}
              />
            ))}
          </div>
        </div>

        {/* Right Column: Recommended For You */}
        <div className="glass-card card-padding">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Recommended For You</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Prescribed learning paths dynamically mapped to your skill gaps
              </p>
            </div>
            <Link to="/recommendations" style={{ fontSize: '0.85rem', color: '#A78BFA', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <span>All Courses</span>
              <ChevronRight size={16} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1rem', color: '#FFFFFF', fontWeight: 700 }}>{rec.title}</h4>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <span className="badge badge-demo" style={{ fontSize: '0.7rem' }}>{rec.skill}</span>
                      <span className="badge badge-moderate" style={{ fontSize: '0.7rem' }}>{rec.difficulty}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>⏱ {rec.estimatedTime}</span>
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {rec.description}
                </p>

                <div style={{ fontSize: '0.75rem', color: '#A78BFA', background: 'rgba(139, 92, 246, 0.1)', padding: '0.4rem 0.6rem', borderRadius: 6 }}>
                  💡 {rec.reason}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.35rem' }}>
                  <button
                    onClick={() => handleStartLearning(rec)}
                    className="btn-primary"
                    style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}
                  >
                    <span>Start Learning</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Launch Cards Banner */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.25rem'
      }}>
        <Link to="/learning-hub" className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none' }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FolderArchive size={24} color="#60A5FA" />
          </div>
          <div>
            <h4 style={{ fontSize: '1rem', color: 'white' }}>Learning Material Hub</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Upload PDF/PPTX to extract concepts</p>
          </div>
        </Link>

        <Link to="/quiz-generator" className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none' }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: 'rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BrainCircuit size={24} color="#A78BFA" />
          </div>
          <div>
            <h4 style={{ fontSize: '1rem', color: 'white' }}>AI Quiz Generator</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Contextual MCQs with explanations</p>
          </div>
        </Link>

        <Link to="/progress" className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none' }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={24} color="#34D399" />
          </div>
          <div>
            <h4 style={{ fontSize: '1rem', color: 'white' }}>Progress & Velocity</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>View Before-vs-Current deltas</p>
          </div>
        </Link>
      </div>

      {/* Simulated Interactive Learning Modal */}
      {activeModuleModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1.5rem'
        }}>
          <div className="glass-card card-padding" style={{ maxWidth: 580, width: '100%', background: '#0F172A', border: '1.5px solid #8B5CF6' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div className="badge badge-strong">Interactive Learning Module</div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>⏱ {activeModuleModal.estimatedTime}</span>
            </div>

            <h3 style={{ fontSize: '1.4rem', color: 'white', marginBottom: '0.5rem' }}>
              {activeModuleModal.title}
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              {activeModuleModal.description}
            </p>

            <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '1rem', borderRadius: 8, marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#C4B5FD', marginBottom: '0.5rem' }}>
                Key Syllabus Topics Covered:
              </div>
              <ul style={{ paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {activeModuleModal.topics?.map((topic, i) => (
                  <li key={i}>{topic}</li>
                ))}
              </ul>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={() => setActiveModuleModal(null)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={() => handleCompleteModule(activeModuleModal)} className="btn-primary">
                <CheckCircle2 size={16} />
                <span>Mark Module Complete (+10% Boost)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
