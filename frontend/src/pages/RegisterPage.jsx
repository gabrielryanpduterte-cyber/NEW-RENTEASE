import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Camera, CheckCircle2, Home, Mail, Phone, UserRound, X } from 'lucide-react';
import { authApi } from '../api/client.js';
import { useAuth } from '../auth/useAuth.js';
import { roleDashboardPath } from '../utils/roles.js';
import GoogleSignInButton from '../components/GoogleSignInButton.jsx';
import PasswordInput from '../components/PasswordInput.jsx';
import { authImage } from '../data/renteaseContent.js';
import { IMAGE_UPLOAD_ACCEPT, prepareUploadFile } from '../utils/imageUpload.js';

const registerRoles = [
  { value: 'seeker', label: 'Seeker' },
  { value: 'parent', label: 'Parent' },
  { value: 'owner', label: 'Landlord' },
];

function RegisterPage() {
  const { authState, login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    role: 'seeker',
    contact_number: '',
    school_or_workplace: '',
    emergency_contact_name: '',
    emergency_contact_number: '',
    profile_photo: '',
  });
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [profilePhotoStatus, setProfilePhotoStatus] = useState('');
  const [preparingPhoto, setPreparingPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');

  const profilePhotoPreview = useMemo(() => {
    if (!profilePhotoFile) {
      return '';
    }

    return URL.createObjectURL(profilePhotoFile);
  }, [profilePhotoFile]);

  useEffect(() => {
    return () => {
      if (profilePhotoPreview) {
        URL.revokeObjectURL(profilePhotoPreview);
      }
    };
  }, [profilePhotoPreview]);

  if (authState.status === 'authenticated') {
    return <Navigate to={roleDashboardPath(authState.user?.role)} replace />;
  }

  async function onSubmit(event) {
    event.preventDefault();
    setFeedback('');

    if (form.password !== form.confirm_password) {
      setFeedback('Passwords do not match.');
      return;
    }

    setSubmitting(true);

    try {
      const registerBody = new FormData();
      registerBody.append('full_name', form.full_name);
      registerBody.append('email', form.email);
      registerBody.append('password', form.password);
      registerBody.append('role', form.role);
      registerBody.append('contact_number', form.contact_number);
      registerBody.append('school_or_workplace', form.school_or_workplace);
      registerBody.append('emergency_contact_name', form.emergency_contact_name);
      registerBody.append('emergency_contact_number', form.emergency_contact_number);
      if (profilePhotoFile) {
        registerBody.append('profile_photo', profilePhotoFile);
      }

      await authApi.register(registerBody);

      const loginResult = await login({
        email: form.email,
        password: form.password,
        role: form.role,
      });

      if (!loginResult.success) {
        setFeedback(
          loginResult.errors?.[0] ||
            loginResult.message ||
            'Registration succeeded but auto-login failed. Please login manually.',
        );
        setSubmitting(false);
        return;
      }

      navigate(roleDashboardPath(form.role), { replace: true });
    } catch (error) {
      const errorMessage = error?.errors?.[0] || error?.message || 'Registration failed. Please try again.';
      setFeedback(errorMessage);
      setSubmitting(false);
    }
  }

  const handleGoogleSuccess = (data) => {
    navigate(roleDashboardPath(data.data.role), { replace: true });
  };

  const handleGoogleError = (error) => {
    setFeedback(error || 'Google sign-in failed. Please try again.');
  };

  async function handleProfilePhotoChange(event) {
    const selected = event.target.files?.[0] || null;
    setProfilePhotoStatus('');

    if (!selected) {
      setProfilePhotoFile(null);
      setForm((current) => ({ ...current, profile_photo: '' }));
      return;
    }

    setPreparingPhoto(true);
    try {
      const prepared = await prepareUploadFile(selected, {
        maxSizeMB: 2,
        maxWidth: 900,
        maxHeight: 900,
        allowPdf: false,
      });
      setProfilePhotoFile(prepared.file);
      setForm((current) => ({ ...current, profile_photo: prepared.file?.name || '' }));
      setProfilePhotoStatus(prepared.message || 'Profile photo ready.');
      event.target.value = '';
    } catch (error) {
      setProfilePhotoFile(null);
      setForm((current) => ({ ...current, profile_photo: '' }));
      setProfilePhotoStatus(error?.message || 'Unable to prepare profile photo.');
      event.target.value = '';
    } finally {
      setPreparingPhoto(false);
    }
  }

  function clearProfilePhoto() {
    setProfilePhotoFile(null);
    setProfilePhotoStatus('');
    setForm((current) => ({ ...current, profile_photo: '' }));
  }

  const roleHint = {
    seeker: 'Find and reserve available boarding house rooms.',
    parent: 'Link to a seeker account and view room or rent status.',
    owner: 'Manage rooms, reservations, tenants, and reports.',
  }[form.role];

  return (
    <main className="re-auth-page">
      <section className="re-auth-visual" style={{ '--auth-image': `url(${authImage})` }}>
        <div>
          <Link to="/" className="re-brand light">
            <span>
              <Home size={20} />
            </span>
            RentEase
          </Link>
          <h1>Start with a role built for your housing workflow.</h1>
          <p>
            Create a student, parent, or landlord account and continue into the right dashboard.
          </p>
          <ul>
            <li>
              <CheckCircle2 size={18} /> Student room reservations
            </li>
            <li>
              <CheckCircle2 size={18} /> Parent monitoring access
            </li>
            <li>
              <CheckCircle2 size={18} /> Landlord room management
            </li>
          </ul>
        </div>
      </section>

      <section className="re-auth-panel">
        <div className="re-auth-card">
          <div className="theme-auth-row">
            <p className="re-eyebrow">Create account</p>
          </div>
          <h2>Register</h2>
          <p>Create a student, parent, or landlord account to continue.</p>

          <form onSubmit={onSubmit} className="re-form-stack">
            <div className="re-role-tabs" role="tablist" aria-label="Registration role">
              {registerRoles.map((role) => (
                <button
                  type="button"
                  key={role.value}
                  className={form.role === role.value ? 'active' : ''}
                  onClick={() => setForm((current) => ({ ...current, role: role.value }))}
                >
                  {role.label}
                </button>
              ))}
            </div>
            <p className="re-role-hint">{roleHint}</p>

            <label>
              <span>Full name</span>
              <div className="re-input-with-icon">
                <UserRound size={17} />
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, full_name: event.target.value }))
                  }
                  placeholder="Juan Dela Cruz"
                  required
                />
              </div>
            </label>

            <label>
              <span>Email address</span>
              <div className="re-input-with-icon">
                <Mail size={17} />
                <input
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, email: event.target.value }))
                  }
                  placeholder="you@example.com"
                  required
                />
              </div>
            </label>

            <label>
              <span>Contact number</span>
              <div className="re-input-with-icon">
                <Phone size={17} />
                <input
                  type="text"
                  value={form.contact_number}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, contact_number: event.target.value }))
                  }
                  placeholder="09XXXXXXXXX"
                  required
                />
              </div>
            </label>

            <label>
              <span>School / Workplace</span>
              <input
                type="text"
                value={form.school_or_workplace}
                onChange={(event) =>
                  setForm((current) => ({ ...current, school_or_workplace: event.target.value }))
                }
                placeholder="University or workplace"
              />
            </label>

            <div className="re-form-two-col">
              <label>
                <span>Emergency contact name</span>
                <input
                  type="text"
                  value={form.emergency_contact_name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, emergency_contact_name: event.target.value }))
                  }
                  placeholder="Parent or guardian"
                />
              </label>

              <label>
                <span>Emergency contact number</span>
                <input
                  type="text"
                  value={form.emergency_contact_number}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, emergency_contact_number: event.target.value }))
                  }
                  placeholder="09XXXXXXXXX"
                />
              </label>
            </div>

            <div className="re-form-two-col">
              <label>
                <span>Password</span>
                <PasswordInput
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, password: event.target.value }))
                  }
                  placeholder="At least 8 characters"
                  minLength={8}
                  required
                />
              </label>

              <label>
                <span>Confirm password</span>
                <PasswordInput
                  autoComplete="new-password"
                  value={form.confirm_password}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, confirm_password: event.target.value }))
                  }
                  placeholder="Repeat password"
                  minLength={8}
                  required
                />
              </label>
            </div>

            <label className="re-file-input">
              <Camera size={18} />
              <span>{preparingPhoto ? 'Converting profile photo...' : form.profile_photo || 'Upload profile photo'}</span>
              <input
                type="file"
                accept={IMAGE_UPLOAD_ACCEPT}
                onChange={handleProfilePhotoChange}
                disabled={preparingPhoto}
              />
            </label>
            {profilePhotoPreview && (
              <div className="re-selected-photo-preview">
                <button type="button" className="re-preview-remove" onClick={clearProfilePhoto} aria-label="Remove selected profile photo">
                  <X size={14} />
                </button>
                <img src={profilePhotoPreview} alt="Selected profile preview" />
                <span>Converted preview</span>
              </div>
            )}
            {profilePhotoStatus && <small className="re-upload-note">{profilePhotoStatus}</small>}

            {feedback && <div className="re-error-panel">{feedback}</div>}

            <button type="submit" className="re-btn re-btn-primary" disabled={submitting}>
              {submitting ? 'Creating account...' : 'Register'}
            </button>
          </form>

          <div className="re-divider">
            <span>or</span>
          </div>

          <GoogleSignInButton onSuccess={handleGoogleSuccess} onError={handleGoogleError} />

          <p className="re-auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

export default RegisterPage;
