import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, 
  Upload, 
  BookOpen, 
  Layers, 
  LogOut, 
  LogIn, 
  User, 
  Home 
} from 'lucide-react';

const Navbar = ({ activeTab, setActiveTab, onOpenUpload }) => {
  const { user, isAuthenticated, logout, setShowAuthModal, setAuthMode } = useAuth();

  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* Brand Logo */}
        <div className="brand" onClick={() => setActiveTab('dashboard')}>
          <div className="brand-icon">
            <Sparkles className="icon-sparkle" size={20} />
          </div>
          <span className="brand-text">
            PrepWise<span className="brand-accent">AI</span>
          </span>
        </div>

        {/* Navigation Links */}
        {isAuthenticated && (
          <nav className="nav-links">
            <button
              className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <Home size={18} />
              <span>Dashboard</span>
            </button>
            <button
              className={`nav-btn ${activeTab === 'documents' ? 'active' : ''}`}
              onClick={() => setActiveTab('documents')}
            >
              <BookOpen size={18} />
              <span>Documents</span>
            </button>
            <button
              className={`nav-btn ${activeTab === 'flashcards' ? 'active' : ''}`}
              onClick={() => setActiveTab('flashcards')}
            >
              <Layers size={18} />
              <span>Flashcard Decks</span>
            </button>
          </nav>
        )}

        {/* Actions & User State */}
        <div className="nav-actions">
          {isAuthenticated ? (
            <>
              <button className="upload-cta-btn" onClick={onOpenUpload}>
                <Upload size={16} />
                <span>Upload Notes</span>
              </button>

              <div className="user-profile-badge">
                <div className="user-avatar">
                  {user?.username ? user.username.charAt(0).toUpperCase() : <User size={16} />}
                </div>
                <span className="user-name">{user?.username || 'User'}</span>
                <button 
                  className="logout-btn" 
                  onClick={logout} 
                  title="Log out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </>
          ) : (
            <div className="auth-buttons">
              <button
                className="btn-secondary"
                onClick={() => {
                  setAuthMode('login');
                  setShowAuthModal(true);
                }}
              >
                <LogIn size={16} />
                <span>Log in</span>
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  setAuthMode('register');
                  setShowAuthModal(true);
                }}
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;

