import { FileUp, Loader2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { statusClassName } from '../../utils/format.js';
import { IMAGE_UPLOAD_ACCEPT, prepareUploadFile } from '../../utils/imageUpload.js';

export function SeekerStatusPill({ status }) {
  const normalized = String(status || 'pending').toLowerCase();

  return (
    <span className={`status-pill ${statusClassName(normalized)}`}>
      {normalized.replaceAll('_', ' ')}
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
  accept = `${IMAGE_UPLOAD_ACCEPT},application/pdf,.pdf`,
  maxSizeMB = 5,
  onFileSelect,
  preview = true,
  label = 'Choose file',
  allowPdf = true,
}) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [processing, setProcessing] = useState(false);
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

  async function onChange(event) {
    const selected = event.target.files?.[0] || null;
    setError('');
    setInfo('');

    if (!selected) {
      setFile(null);
      onFileSelect?.(null);
      return;
    }

    setProcessing(true);
    try {
      const prepared = await prepareUploadFile(selected, {
        maxSizeMB,
        allowPdf,
      });

      setFile(prepared.file);
      setInfo(prepared.message);
      onFileSelect?.(prepared.file);
      event.target.value = '';
    } catch (fileError) {
      setFile(null);
      setError(fileError?.message || 'Unable to prepare file for upload.');
      onFileSelect?.(null);
      event.target.value = '';
    } finally {
      setProcessing(false);
    }
  }

  function clearSelectedFile() {
    setFile(null);
    setError('');
    setInfo('');
    onFileSelect?.(null);
  }

  return (
    <div className="re-file-upload">
      <label>
        <FileUp size={18} />
        <span>{processing ? 'Preparing file...' : file ? file.name : label}</span>
        <input type="file" accept={accept} onChange={onChange} disabled={processing} />
      </label>
      {file && (
        <p>
          {(file.size / 1024 / 1024).toFixed(2)} MB
        </p>
      )}
      {file && (
        <button type="button" className="re-file-remove" onClick={clearSelectedFile} aria-label="Remove selected file">
          <X size={15} />
          Remove
        </button>
      )}
      {previewUrl && <img src={previewUrl} alt="Selected file preview" />}
      {file && !previewUrl && <p>{file.type || 'Selected file'}</p>}
      {info && <p className="re-upload-note">{info}</p>}
      {error && <p className="re-form-error">{error}</p>}
    </div>
  );
}
