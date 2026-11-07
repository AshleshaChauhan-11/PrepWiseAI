import React, { useState, useRef } from 'react';
import documentService from '../services/documentService';
import { X, UploadCloud, FileText, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

const UploadModal = ({ isOpen, onClose, onUploadSuccess }) => {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    validateAndSetFile(selected);
  };

  const validateAndSetFile = (selected) => {
    setError('');
    if (!selected) return;

    if (selected.type !== 'application/pdf') {
      setError('Only PDF files are allowed');
      return;
    }

    if (selected.size > 10 * 1024 * 1024) {
      setError('File size must not exceed 10MB');
      return;
    }

    setFile(selected);
    if (!title) {
      // Auto-populate title from file name (clean extension)
      const baseName = selected.name.replace(/\.[^/.]+$/, '');
      setTitle(baseName);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Please provide a title for the document');
      return;
    }

    if (!file) {
      setError('Please select a PDF file to upload');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('file', file);

    try {
      const response = await documentService.uploadDocument(formData);
      onUploadSuccess(response.data);
      onClose();
    } catch (err) {
      setError(err.error || err.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card upload-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="modal-header">
          <h2>Upload Study Notes</h2>
          <p>Upload a PDF document to generate flashcards, quizzes, and chat with AI.</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="upload-form">
          <div className="form-group">
            <label>Document Title</label>
            <input
              type="text"
              placeholder="e.g., Operating Systems - Chapter 4 (Memory Management)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div
            className={`file-dropzone ${dragOver ? 'drag-over' : ''} ${file ? 'has-file' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            {file ? (
              <div className="file-info-preview">
                <FileText size={36} className="file-icon" />
                <div className="file-details">
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>
                <CheckCircle2 size={24} className="icon-success" />
              </div>
            ) : (
              <div className="dropzone-prompt">
                <UploadCloud size={40} className="upload-icon" />
                <p className="prompt-primary">Click to browse or drag & drop PDF</p>
                <p className="prompt-secondary">Supported format: PDF (Max size: 10MB)</p>
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={uploading || !file}
            >
              {uploading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Processing Document...</span>
                </>
              ) : (
                'Upload & Process'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadModal;

