import { useEffect, useRef } from 'react';
import './PDFPreviewModal.css';

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string | null;
  title: string;
  onDownload: () => void;
  isGenerating?: boolean;
}

export function PDFPreviewModal({
  isOpen,
  onClose,
  pdfUrl,
  title,
  onDownload,
  isGenerating = false,
}: PDFPreviewModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Clean up blob URL when modal closes
  useEffect(() => {
    return () => {
      if (pdfUrl && pdfUrl.startsWith('blob:')) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="pdf-preview-overlay" onClick={handleOverlayClick}>
      <div className="pdf-preview-modal" ref={modalRef}>
        <div className="pdf-preview-header">
          <h2>{title}</h2>
          <div className="pdf-preview-actions">
            <button
              className="pdf-preview-btn download"
              onClick={onDownload}
              disabled={isGenerating || !pdfUrl}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download PDF
            </button>
            <button className="pdf-preview-btn close" onClick={onClose}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
        <div className="pdf-preview-content">
          {isGenerating ? (
            <div className="pdf-preview-loading">
              <div className="pdf-preview-spinner" />
              <p>Generating preview...</p>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="pdf-preview-iframe"
              title="PDF Preview"
            />
          ) : (
            <div className="pdf-preview-empty">
              <p>Unable to generate preview</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
