import React, { useState, useEffect } from 'react';
import documentService from '../services/documentService';
import { 
  FileText, 
  Trash2, 
  Upload, 
  Search, 
  Layers, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ExternalLink,
  Loader2,
  RefreshCw
} from 'lucide-react';

const DocumentList = ({ onSelectDocument, onOpenUpload }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const data = await documentService.getDocuments();
      setDocuments(data || []);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
      setError('Unable to load documents. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, id, title) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${title}" and all its flashcards and quizzes?`)) {
      return;
    }

    setDeletingId(id);
    try {
      await documentService.deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d._id !== id));
    } catch (err) {
      alert(err.error || err.message || 'Failed to delete document');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredDocs = documents.filter((doc) =>
    (doc.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doc.fileName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="documents-page">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2>Your Study Documents</h2>
          <p>Select a document to review notes, practice flashcards, take quizzes, or chat with AI.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn-secondary" onClick={fetchDocuments} title="Refresh">
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
          <button className="btn-primary" onClick={onOpenUpload}>
            <Upload size={16} />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-filter-bar">
        <div className="search-input-wrap">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by document title or filename..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Content Area */}
      {loading ? (
        <div className="loading-state-card">
          <Loader2 size={36} className="animate-spin text-accent" />
          <p>Loading your documents...</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="empty-state-card">
          <FileText size={48} className="empty-icon" />
          <h3>No documents found</h3>
          <p>
            {searchTerm
              ? 'No documents matched your search query.'
              : 'Upload notes, textbook chapters, or revision PDFs to get started.'}
          </p>
          <button className="btn-primary" onClick={onOpenUpload}>
            <Upload size={18} />
            <span>Upload Document</span>
          </button>
        </div>
      ) : (
        <div className="document-grid">
          {filteredDocs.map((doc) => (
            <div
              key={doc._id}
              className={`document-card ${doc.status === 'processing' ? 'card-processing' : ''}`}
              onClick={() => doc.status !== 'processing' && onSelectDocument(doc._id)}
            >
              <div className="doc-card-top">
                <div className="doc-badge-status">
                  {doc.status === 'processing' && (
                    <span className="status-badge badge-warning">
                      <Loader2 size={12} className="animate-spin" /> Processing
                    </span>
                  )}
                  {doc.status === 'ready' && (
                    <span className="status-badge badge-success">
                      <CheckCircle size={12} /> Ready
                    </span>
                  )}
                  {doc.status === 'failed' && (
                    <span className="status-badge badge-error">
                      <AlertCircle size={12} /> Failed
                    </span>
                  )}
                </div>

                <button
                  className="btn-icon-danger"
                  title="Delete Document"
                  onClick={(e) => handleDelete(e, doc._id, doc.title)}
                  disabled={deletingId === doc._id}
                >
                  {deletingId === doc._id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              </div>

              <div className="doc-card-body">
                <div className="doc-file-icon">
                  <FileText size={28} />
                </div>
                <h3 className="doc-title" title={doc.title}>
                  {doc.title}
                </h3>
                <span className="doc-filename" title={doc.fileName}>
                  {doc.fileName}
                </span>
              </div>

              <div className="doc-card-metrics">
                <div className="metric-pill" title="Generated Flashcards">
                  <Layers size={14} />
                  <span>{doc.flashcardCount ?? 0} Cards</span>
                </div>
                <div className="metric-pill" title="Generated Quizzes">
                  <CheckCircle size={14} />
                  <span>{doc.quizCount ?? 0} Quizzes</span>
                </div>
              </div>

              <div className="doc-card-footer">
                <span className="doc-date">
                  {new Date(doc.uploadDate || doc.createdAt).toLocaleDateString()}
                </span>
                <span className="doc-size">
                  {((doc.fileSize || 0) / (1024 * 1024)).toFixed(1)} MB
                </span>
                <button
                  className="doc-open-btn"
                  disabled={doc.status === 'processing'}
                >
                  <span>Study</span>
                  <ExternalLink size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentList;

