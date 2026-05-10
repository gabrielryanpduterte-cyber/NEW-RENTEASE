import { useState, useEffect } from 'react';
import { uploadsApi, reservationsApi } from '../../api/client.js';
import AppShell from '../../components/AppShell.jsx';
import { formatDateTime } from '../../utils/format.js';

function DocumentsPage() {
  const [uploads, setUploads] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    reservation_id: '',
    visibility: 'owner',
  });
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [uploadsRes, reservationsRes] = await Promise.all([
        uploadsApi.list({ limit: 50 }),
        reservationsApi.list(),
      ]);
      setUploads(uploadsRes.data?.items || uploadsRes.data || []);
      setReservations(reservationsRes.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) {
      setMessage({ type: 'error', text: 'Please select a file' });
      return;
    }

    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('visibility', form.visibility);
      if (form.reservation_id) {
        formData.append('reservation_id', form.reservation_id);
      }

      await uploadsApi.create(formData);
      setMessage({ type: 'success', text: 'File uploaded successfully!' });
      setForm({ reservation_id: '', visibility: 'owner' });
      setFile(null);
      loadData();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.errors?.[0] || error.message || 'Failed to upload file' 
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(uploadId) {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      await uploadsApi.remove(uploadId);
      loadData();
    } catch (error) {
      alert(error.errors?.[0] || error.message || 'Failed to delete file');
    }
  }

  return (
    <AppShell
      title="Documents"
      subtitle="Upload and manage reservation-related documents"
      quickStats={[
        { label: 'Total Files', value: String(uploads.length), tone: 'neutral' },
      ]}
    >
      {/* Upload Form */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
          Upload Document
        </h3>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
              Link to Reservation (Optional)
            </label>
            <select
              value={form.reservation_id}
              onChange={(e) => setForm({ ...form, reservation_id: e.target.value })}
              style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '0.875rem' }}
            >
              <option value="">No reservation link</option>
              {reservations.map(r => (
                <option key={r.reservation_id} value={r.reservation_id}>
                  #{r.reservation_id} - Room {r.room_number || r.room_id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
              Visibility
            </label>
            <select
              value={form.visibility}
              onChange={(e) => setForm({ ...form, visibility: e.target.value })}
              style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '0.875rem' }}
            >
              <option value="private">Private (Only me)</option>
              <option value="owner">Owner (Me + Owner)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
              File (PDF, JPG, PNG, WEBP - Max 5MB) *
            </label>
            <input
              type="file"
              accept=".pdf,image/jpeg,image/png,image/webp"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
              style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '0.875rem' }}
            />
          </div>

          {message.text && (
            <div className={message.type === 'success' ? 'mini-success' : 'mini-error'}>
              <p>{message.text}</p>
            </div>
          )}

          <button
            type="submit"
            className="button-primary"
            disabled={submitting}
          >
            {submitting ? 'Uploading...' : 'Upload File'}
          </button>
        </form>
      </div>

      {/* Files List */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>
            Your Documents
          </h3>
          <button className="button-light" onClick={loadData}>
            Refresh
          </button>
        </div>

        {loading ? (
          <p style={{ color: 'var(--muted-foreground)', textAlign: 'center', padding: '2rem' }}>
            Loading documents...
          </p>
        ) : uploads.length === 0 ? (
          <p style={{ color: 'var(--muted-foreground)', textAlign: 'center', padding: '2rem' }}>
            No documents uploaded yet.
          </p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Reservation</th>
                  <th>Visibility</th>
                  <th>Uploaded</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {uploads.map(upload => (
                  <tr key={upload.upload_id}>
                    <td>
                      <a 
                        href={upload.file_url} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ color: 'var(--primary)', textDecoration: 'underline' }}
                      >
                        {upload.original_name}
                      </a>
                    </td>
                    <td>{upload.mime_type}</td>
                    <td>{(parseFloat(upload.file_size) / 1024).toFixed(1)} KB</td>
                    <td>{upload.reservation_id ? `#${upload.reservation_id}` : '-'}</td>
                    <td>
                      <span className="status-pill pill-neutral" style={{ fontSize: '0.7rem' }}>
                        {upload.visibility}
                      </span>
                    </td>
                    <td>{formatDateTime(upload.created_at)}</td>
                    <td>
                      <button
                        className="button-light danger"
                        onClick={() => handleDelete(upload.upload_id)}
                        style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default DocumentsPage;
