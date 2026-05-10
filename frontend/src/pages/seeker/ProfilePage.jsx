import { useEffect, useMemo, useState } from 'react';
import { Camera, KeyRound, ShieldPlus, UserRound, X } from 'lucide-react';
import { authApi } from '../../api/client.js';
import { useAuth } from '../../auth/useAuth.js';
import AppShell from '../../components/AppShell.jsx';
import PasswordInput from '../../components/PasswordInput.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { IMAGE_UPLOAD_ACCEPT, prepareUploadFile } from '../../utils/imageUpload.js';

function passwordStrength(value) {
  let score = 0;
  if (value.length >= 8) score += 1;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
  if (/\d/.test(value) || /[^A-Za-z0-9]/.test(value)) score += 1;
  if (score >= 3) return 'strong';
  if (score === 2) return 'fair';
  return 'weak';
}

export default function ProfilePage() {
  const { authState, refreshSession } = useAuth();
  const { showToast } = useToast();
  const user = authState.user || {};
  const [personalForm, setPersonalForm] = useState({
    full_name: user.full_name || '',
    email: user.email || '',
    contact_number: user.contact_number || '',
    school_or_workplace: user.school_or_workplace || '',
  });
  const [emergencyForm, setEmergencyForm] = useState({
    emergency_contact_name: user.emergency_contact_name || '',
    emergency_contact_number: user.emergency_contact_number || '',
  });
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoStatus, setPhotoStatus] = useState('');
  const [preparingPhoto, setPreparingPhoto] = useState(false);
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [savingEmergency, setSavingEmergency] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setPersonalForm({
        full_name: user.full_name || '',
        email: user.email || '',
        contact_number: user.contact_number || '',
        school_or_workplace: user.school_or_workplace || '',
      });
      setEmergencyForm({
        emergency_contact_name: user.emergency_contact_name || '',
        emergency_contact_number: user.emergency_contact_number || '',
      });
    });
  }, [
    user.contact_number,
    user.email,
    user.emergency_contact_name,
    user.emergency_contact_number,
    user.full_name,
    user.school_or_workplace,
  ]);

  const photoPreview = useMemo(() => {
    if (profilePhoto) return URL.createObjectURL(profilePhoto);
    return user.profile_photo_url || '';
  }, [profilePhoto, user.profile_photo_url]);

  useEffect(() => {
    return () => {
      if (profilePhoto && photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview, profilePhoto]);

  async function savePersonal(event) {
    event.preventDefault();
    setSavingPersonal(true);

    const body = new FormData();
    body.append('full_name', personalForm.full_name);
    body.append('contact_number', personalForm.contact_number);
    body.append('school_or_workplace', personalForm.school_or_workplace);
    if (profilePhoto) {
      body.append('profile_photo', profilePhoto);
    }

    try {
      await authApi.updateProfile(body);
      await refreshSession({ silent: true });
      setProfilePhoto(null);
      setPhotoStatus('');
      showToast('Profile information updated.', 'success');
    } catch (error) {
      showToast(error?.errors?.[0] || error?.message || 'Unable to update profile.', 'error');
    } finally {
      setSavingPersonal(false);
    }
  }

  async function handleProfilePhotoChange(event) {
    const selected = event.target.files?.[0] || null;
    setPhotoStatus('');

    if (!selected) {
      setProfilePhoto(null);
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
      setProfilePhoto(prepared.file);
      setPhotoStatus(prepared.message || 'Profile photo ready.');
      event.target.value = '';
    } catch (error) {
      setProfilePhoto(null);
      setPhotoStatus(error?.message || 'Unable to prepare profile photo.');
      event.target.value = '';
    } finally {
      setPreparingPhoto(false);
    }
  }

  function clearProfilePhoto() {
    setProfilePhoto(null);
    setPhotoStatus('');
  }

  async function saveEmergency(event) {
    event.preventDefault();
    setSavingEmergency(true);

    try {
      await authApi.updateProfile(emergencyForm);
      await refreshSession({ silent: true });
      showToast('Emergency contact updated.', 'success');
    } catch (error) {
      showToast(error?.errors?.[0] || error?.message || 'Unable to update emergency contact.', 'error');
    } finally {
      setSavingEmergency(false);
    }
  }

  async function savePassword(event) {
    event.preventDefault();

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      showToast('New password and confirmation do not match.', 'error');
      return;
    }

    setSavingPassword(true);
    try {
      await authApi.changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      showToast('Password updated.', 'success');
    } catch (error) {
      showToast(error?.errors?.[0] || error?.message || 'Unable to update password.', 'error');
    } finally {
      setSavingPassword(false);
    }
  }

  const strength = passwordStrength(passwordForm.new_password);

  return (
    <AppShell title="Profile" subtitle="Manage your contact details, emergency contact, and password.">
      <section className="seeker-main-column">
        <article className="seeker-form-card">
          <div className="seeker-card-head">
            <UserRound size={20} />
            <h2>Personal Info</h2>
          </div>
          <form onSubmit={savePersonal} className="seeker-form-grid">
            <div className="profile-photo-field seeker-form-wide">
              <label>
                <img src={photoPreview || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || 'User')}&background=2D6A4F&color=fff`} alt="Profile" />
                <span><Camera size={16} /> {preparingPhoto ? 'Converting...' : 'Change Photo'}</span>
                <input
                  type="file"
                  accept={IMAGE_UPLOAD_ACCEPT}
                  onChange={handleProfilePhotoChange}
                  disabled={preparingPhoto}
                />
              </label>
              {profilePhoto && (
                <button type="button" className="re-file-remove" onClick={clearProfilePhoto}>
                  <X size={15} />
                  Remove selected photo
                </button>
              )}
              {photoStatus && <small className="re-upload-note">{photoStatus}</small>}
            </div>

            <label>
              <span>Full Name</span>
              <input
                type="text"
                value={personalForm.full_name}
                onChange={(event) => setPersonalForm((current) => ({ ...current, full_name: event.target.value }))}
                required
              />
            </label>
            <label>
              <span>Email</span>
              <input type="email" value={personalForm.email} disabled />
            </label>
            <label>
              <span>Contact Number</span>
              <input
                type="text"
                value={personalForm.contact_number}
                onChange={(event) => setPersonalForm((current) => ({ ...current, contact_number: event.target.value }))}
                required
              />
            </label>
            <label>
              <span>School / Workplace</span>
              <input
                type="text"
                value={personalForm.school_or_workplace}
                onChange={(event) => setPersonalForm((current) => ({ ...current, school_or_workplace: event.target.value }))}
              />
            </label>
            <div className="seeker-form-actions seeker-form-wide">
              <button type="submit" className="button-primary" disabled={savingPersonal}>
                {savingPersonal ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </article>

        <article className="seeker-form-card">
          <div className="seeker-card-head">
            <ShieldPlus size={20} />
            <h2>Emergency Contact</h2>
          </div>
          <p className="seeker-muted">Your emergency contact information is only visible to the landlord in case of emergency.</p>
          <form onSubmit={saveEmergency} className="seeker-form-grid">
            <label>
              <span>Emergency Contact Name</span>
              <input
                type="text"
                value={emergencyForm.emergency_contact_name}
                onChange={(event) => setEmergencyForm((current) => ({ ...current, emergency_contact_name: event.target.value }))}
              />
            </label>
            <label>
              <span>Emergency Contact Number</span>
              <input
                type="text"
                value={emergencyForm.emergency_contact_number}
                onChange={(event) => setEmergencyForm((current) => ({ ...current, emergency_contact_number: event.target.value }))}
              />
            </label>
            <div className="seeker-form-actions seeker-form-wide">
              <button type="submit" className="button-primary" disabled={savingEmergency}>
                {savingEmergency ? 'Saving...' : 'Save Emergency Contact'}
              </button>
            </div>
          </form>
        </article>

        <article className="seeker-form-card">
          <div className="seeker-card-head">
            <KeyRound size={20} />
            <h2>Change Password</h2>
          </div>
          <form onSubmit={savePassword} className="seeker-form-grid">
            <label>
              <span>Current Password</span>
              <PasswordInput
                autoComplete="current-password"
                value={passwordForm.current_password}
                onChange={(event) => setPasswordForm((current) => ({ ...current, current_password: event.target.value }))}
                required
              />
            </label>
            <label>
              <span>New Password</span>
              <PasswordInput
                autoComplete="new-password"
                minLength={8}
                value={passwordForm.new_password}
                onChange={(event) => setPasswordForm((current) => ({ ...current, new_password: event.target.value }))}
                required
              />
              {passwordForm.new_password && <small className={`password-strength ${strength}`}>{strength}</small>}
            </label>
            <label>
              <span>Confirm New Password</span>
              <PasswordInput
                autoComplete="new-password"
                minLength={8}
                value={passwordForm.confirm_password}
                onChange={(event) => setPasswordForm((current) => ({ ...current, confirm_password: event.target.value }))}
                required
              />
            </label>
            <div className="seeker-form-actions seeker-form-wide">
              <button type="submit" className="button-primary" disabled={savingPassword}>
                {savingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </article>
      </section>
    </AppShell>
  );
}
