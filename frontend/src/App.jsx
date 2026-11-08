import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import UploadModal from './components/UploadModal';
import Dashboard from './components/Dashboard';
import DocumentList from './components/DocumentList';
import StudyWorkspace from './components/StudyWorkspace';
import FlashcardDeckList from './components/FlashcardDeckList';
import ErrorBoundary from './components/ErrorBoundary';
import { Sparkles, BookOpen, Layers, CheckCircle, ArrowRight, Upload } from 'lucide-react';
import './App.css';

const MainApp = () => {
  const { isAuthenticated, setShowAuthModal, setAuthMode } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const handleOpenDocument = (docId) => {
    setSelectedDocId(docId);
    setActiveTab('workspace');
  };

  const handleBackToDocuments = () => {
    setSelectedDocId(null);
    setActiveTab('documents');
  };

  const handleOpenUpload = () => {
    if (!isAuthenticated) {
      setAuthMode('login');
      setShowAuthModal(true);
      return;
    }
    setIsUploadOpen(true);
  };

  const handleUploadSuccess = (newDoc) => {
    if (newDoc && newDoc._id) {
      setSelectedDocId(newDoc._id);
      setActiveTab('workspace');
    } else {
      setActiveTab('documents');
    }
  };

  return (
    <div className="app-layout">
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setSelectedDocId(null);
          setActiveTab(tab);
        }}
        onOpenUpload={handleOpenUpload}
      />

      <main className="app-main-content">
        {!isAuthenticated ? (
          /* Public Landing Page */
          <div className="landing-hero">
            <div className="hero-badge">
              <Sparkles size={14} />
              <span>Smart Learning • Faster Revision • Better Exam Preparation</span>
            </div>
            <h1 className="landing-title">
              Master Your Study Materials in <span className="gradient-text">Half the Time</span>
            </h1>
            <p className="landing-subtitle">
              PrepWiseAI analyzes your textbooks, lecture notes, and PDFs to generate active recall flashcards, interactive quizzes, and personalized AI tutor explanations.
            </p>

            <div className="landing-cta-row">
              <button
                className="btn-primary btn-hero"
                onClick={() => {
                  setAuthMode('register');
                  setShowAuthModal(true);
                }}
              >
                <span>Get Started for Free</span>
                <ArrowRight size={18} />
              </button>
              <button
                className="btn-secondary btn-hero"
                onClick={() => {
                  setAuthMode('login');
                  setShowAuthModal(true);
                }}
              >
                Sign In
              </button>
            </div>

            {/* Feature Highlights Grid */}
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon bg-blue">
                  <BookOpen size={24} />
                </div>
                <h3>AI Document Ingestion</h3>
                <p>Upload multi-page PDFs. Our backend extracts, chunks, and indexes concepts asynchronously.</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon bg-purple">
                  <Layers size={24} />
                </div>
                <h3>Smart Flashcards</h3>
                <p>Retain critical facts with 3D flip flashcards, spaced repetition tracking, and difficulty tags.</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon bg-green">
                  <CheckCircle size={24} />
                </div>
                <h3>Interactive Exam Quizzes</h3>
                <p>Test knowledge with 4-choice questions accompanied by comprehensive reasoning and explanations.</p>
              </div>
            </div>
          </div>
        ) : (
          /* Authenticated User Views */
          <div className="workspace-view-wrapper">
            {activeTab === 'dashboard' && (
              <Dashboard
                onSelectDocument={handleOpenDocument}
                onOpenUpload={handleOpenUpload}
                onNavigateToDocuments={() => setActiveTab('documents')}
              />
            )}

            {activeTab === 'documents' && (
              <DocumentList
                onSelectDocument={handleOpenDocument}
                onOpenUpload={handleOpenUpload}
              />
            )}

            {activeTab === 'flashcards' && (
              <FlashcardDeckList onSelectDocument={handleOpenDocument} />
            )}

            {activeTab === 'workspace' && selectedDocId && (
              <StudyWorkspace
                documentId={selectedDocId}
                onBack={handleBackToDocuments}
              />
            )}
          </div>
        )}
      </main>

      <AuthModal />
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ErrorBoundary>
  );
}
