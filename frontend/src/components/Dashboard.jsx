import React, { useState, useEffect } from 'react';
import progressService from '../services/progressService';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpen, 
  Layers, 
  CheckCircle, 
  Flame, 
  Upload, 
  ArrowRight, 
  Clock, 
  Award,
  Sparkles,
  Loader2
} from 'lucide-react';

const Dashboard = ({ onSelectDocument, onOpenUpload, onNavigateToDocuments }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await progressService.getDashboardData();
      if (response && response.data) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard statistics:', err);
      setError('Unable to load current statistics.');
    } finally {
      setLoading(false);
    }
  };

  const overview = stats?.overview || {};
  const recentDocs = stats?.recentActivity?.documents || [];
  const recentQuizzes = stats?.recentActivity?.quizzes || [];

  return (
    <div className="dashboard-container">
      {/* Hero Welcome Banner */}
      <div className="dashboard-hero">
        <div className="hero-content">
          <h1>
            Welcome back, <span className="highlight-text">{user?.username || 'Scholar'}</span> 👋
          </h1>
          <p>
            PrepWiseAI is ready to accelerate your revision. Turn your documents into active recall flashcards, quizzes, and instant AI tutor explanations.
          </p>
          <div className="hero-cta-group">
            <button className="btn-primary" onClick={onOpenUpload}>
              <Upload size={18} />
              <span>Upload New Notes</span>
            </button>
            <button className="btn-secondary" onClick={onNavigateToDocuments}>
              <BookOpen size={18} />
              <span>Browse Documents</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrap icon-blue">
            <BookOpen size={24} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Documents</span>
            <h3 className="kpi-value">{loading ? '...' : (overview.totalDocuments ?? 0)}</h3>
            <span className="kpi-sub">Uploaded study materials</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap icon-purple">
            <Layers size={24} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Flashcards</span>
            <h3 className="kpi-value">{loading ? '...' : (overview.totalFlashcards ?? 0)}</h3>
            <span className="kpi-sub">
              {overview.reviewedFlashcards ?? 0} reviewed • {overview.starredFlashcards ?? 0} starred
            </span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap icon-green">
            <Award size={24} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Average Quiz Score</span>
            <h3 className="kpi-value">
              {loading ? '...' : `${overview.averageScore ?? 0}%`}
            </h3>
            <span className="kpi-sub">
              {overview.completedQuizzes ?? 0} of {overview.totalQuizzes ?? 0} quizzes completed
            </span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap icon-orange">
            <Flame size={24} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Study Streak</span>
            <h3 className="kpi-value">{loading ? '...' : `${overview.studyStreak ?? 1} Days`}</h3>
            <span className="kpi-sub">Keep the momentum going!</span>
          </div>
        </div>
      </div>

      {/* Split Section: Recent Documents & Recent Quizzes */}
      <div className="dashboard-columns">
        {/* Recent Documents */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <h3>Recent Documents</h3>
            <button className="panel-link-btn" onClick={onNavigateToDocuments}>
              View All <ArrowRight size={16} />
            </button>
          </div>

          <div className="panel-body">
            {loading ? (
              <div className="loading-state">
                <Loader2 size={24} className="animate-spin" />
                <span>Loading recent documents...</span>
              </div>
            ) : recentDocs.length === 0 ? (
              <div className="empty-state-panel">
                <p>No documents uploaded yet.</p>
                <button className="btn-small-primary" onClick={onOpenUpload}>
                  Upload your first PDF
                </button>
              </div>
            ) : (
              <div className="recent-list">
                {recentDocs.map((doc) => (
                  <div
                    key={doc._id}
                    className="recent-item"
                    onClick={() => onSelectDocument(doc._id)}
                  >
                    <div className="recent-icon">
                      <BookOpen size={20} />
                    </div>
                    <div className="recent-info">
                      <h4 className="recent-title">{doc.title}</h4>
                      <span className="recent-meta">
                        {new Date(doc.lastAccessed || doc.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <span className={`status-pill pill-${doc.status}`}>
                      {doc.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Quizzes */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <h3>Recent Quiz Performance</h3>
          </div>

          <div className="panel-body">
            {loading ? (
              <div className="loading-state">
                <Loader2 size={24} className="animate-spin" />
                <span>Loading recent quiz results...</span>
              </div>
            ) : recentQuizzes.length === 0 ? (
              <div className="empty-state-panel">
                <p>No completed quizzes yet.</p>
                <span className="text-muted">
                  Open a document to generate and take an AI quiz!
                </span>
              </div>
            ) : (
              <div className="recent-list">
                {recentQuizzes.map((quiz) => (
                  <div key={quiz._id} className="recent-item">
                    <div className="recent-icon icon-quiz">
                      <CheckCircle size={20} />
                    </div>
                    <div className="recent-info">
                      <h4 className="recent-title">{quiz.title}</h4>
                      <span className="recent-meta">
                        {quiz.totalQuestions} Questions •{' '}
                        {quiz.completedAt
                          ? new Date(quiz.completedAt).toLocaleDateString()
                          : 'In progress'}
                      </span>
                    </div>
                    <span className="score-badge">
                      {quiz.score !== undefined ? `${quiz.score}%` : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

