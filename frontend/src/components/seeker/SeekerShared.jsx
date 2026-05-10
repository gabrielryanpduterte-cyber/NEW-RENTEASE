import { FileUp, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { statusClassName } from '../../utils/format.js';

export function SeekerStatusPill({ status }) {
  const normalized = String(status || 'pending').toLowerCase();

  return (
    <span className={`status-pill ${statusClassName(normalized)}`}>
      {normalized}
    </span>
  );
}

export function LoadingSkeleton({ rows = 3 }) {
  return (
    <div className="re-skeleton-list">
      {Array.from({ length: rows }).map((_, index) => (
        <div className="re-skeleton-row" key={index} />
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, cta = null }) {
  return (
    <div className="re-empty-state seeker-empty">
      {Icon ? (
        <div aria-hidden="true">
          <Icon size={28} />
        </div>
      ) : (
        <div aria-hidden="true">RE</div>
      )}
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {cta}
    </div>
  );
}

export function ConfirmModal({
  title,
  body,
  confirmLabel,
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
  isLoading = false,
}) {
  return (
    <div className="re-modal-backdrop" role="presentation" onClick={onCancel}>
      <section className="re-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title" onClick={(event) => event.stopPropagation()}>
        <h2 id="confirm-title">{title}</h2>
        <p>{body}</p>
        <div className="re-modal-actions">
          <button type="button" className="button-secondary" onClick={onCancel} disabled={isLoading}>
            Cancel
          </button>
          <button
            type="button"
            className={confirmVariant === 'danger' ? 'button-light danger' : 'button-primary'}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading && <Loader2 size={16} className="re-spin" />}
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

export function FileUpload({
  accept = 'image/*,.pdf',
  maxSizeMB = 5,
  onFileSelect,
  preview = true,
  label = 'Choose file',
}) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const previewUrl = useMemo(() => {
    if (!preview || !file || !file.type.startsWith('image/')) {
      return '';
    }

    return URL.createObjectURL(file);
  }, [file, preview]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function onChange(event) {
    const selected = event.target.files?.[0] || null;
    setError('');

    if (!selected) {
      setFile(null);
      onFileSelect?.(null);
      return;
    }

    if (selected.size > maxSizeMB * 1024 * 1024) {
      setFile(null);
      setError(`File must be ${maxSizeMB} MB or smaller.`);
      onFileSelect?.(null);
      return;
    }

    setFile(selected);
    onFileSelect?.(selected);
  }

  return (
    <div className="re-file-upload">
      <label>
        <FileUp size={18} />
        <span>{file ? file.name : label}</span>
        <input type="file" accept={accept} onChange={onChange} />
      </label>
      {file && (
        <p>
          {(file.size / 1024 / 1024).toFixed(2)} MB
        </p>
      )}
      {previewUrl && <img src={previewUrl} alt="Selected file preview" />}
      {file && !previewUrl && <p>{file.type || 'Selected file'}</p>}
      {error && <p className="re-form-error">{error}</p>}
    </div>
  );
}
