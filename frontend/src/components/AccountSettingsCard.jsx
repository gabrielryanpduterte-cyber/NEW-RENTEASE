import { useState } from 'react';
import { authApi, describeApiError } from '../api/client.js';
import { useAuth } from '../auth/useAuth.js';
import ModuleCard from './ModuleCard.jsx';

function AccountSettingsCard({
  id = 'account',
  title = 'Account Settings',
  description = 'Update your profile information and rotate your account password.',
}) {
  const { authState, refreshSession } = useAuth();
  const currentUser = authState.user;

  const [profileForm, setProfileForm] = useState(() => ({
    full_name: currentUser?.full_name || '',
    email: currentUser?.email || '',
    contact_number: currentUser?.contact_number || '',
  }));
  const [profileSubmit, setProfileSubmit] = useState({
    pending: false,
    success: '',
    error: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [passwordSubmit, setPasswordSubmit] = useState({
    pending: false,
    success: '',
    error: '',
  });

  async function submitProfile(event) {
    event.preventDefault();
    setProfileSubmit({
      pending: true,
      success: '',
      error: '',
    });

    if (
      profileForm.full_name.trim() === '' ||
      profileForm.email.trim() === '' ||
      profileForm.contact_number.trim() === ''
    ) {
      setProfileSubmit({
        pending: false,
        success: '',
        error: 'full_name, email, and contact_number are required.',
      });
      return;
    }

    try {
      const payload = await authApi.updateProfile({
        full_name: profileForm.full_name,
        email: profileForm.email,
        contact_number: profileForm.contact_number,
      });

      await refreshSession({ silent: true });
      setProfileForm({
        full_name: payload.data?.full_name || profileForm.full_name,
        email: payload.data?.email || profileForm.email,
        contact_number: payload.data?.contact_number || profileForm.contact_number,
      });

      setProfileSubmit({
        pending: false,
        success: 'Profile updated successfully.',
        error: '',
      });
    } catch (error) {
      setProfileSubmit({
        pending: false,
        success: '',
        error: error?.errors?.[0] || describeApiError(error),
      });
    }
  }

  async function submitPassword(event) {
    event.preventDefault();
    setPasswordSubmit({
      pending: true,
      success: '',
      error: '',
    });

    if (passwordForm.new_password.length < 8) {
      setPasswordSubmit({
        pending: false,
        success: '',
        error: 'New password must be at least 8 characters.',
      });
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordSubmit({
        pending: false,
        success: '',
        error: 'new_password and confirm_password do not match.',
      });
      return;
    }

    try {
      await authApi.changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });

      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
      setPasswordSubmit({
        pending: false,
        success: 'Password changed successfully.',
        error: '',
      });
    } catch (error) {
      setPasswordSubmit({
        pending: false,
        success: '',
        error: error?.errors?.[0] || describeApiError(error),
      });
    }
  }

  return (
    <ModuleCard id={id} title={title} description={description}>
      <form className="inline-form user-form" onSubmit={submitProfile}>
        <input
          type="text"
          placeholder="Full name"
          value={profileForm.full_name}
          onChange={(event) =>
            setProfileForm((current) => ({
              ...current,
              full_name: event.target.value,
            }))
          }
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={profileForm.email}
          onChange={(event) =>
            setProfileForm((current) => ({
              ...current,
              email: event.target.value,
            }))
          }
          required
        />
        <input
          type="text"
          placeholder="Contact number"
          value={profileForm.contact_number}
          onChange={(event) =>
            setProfileForm((current) => ({
              ...current,
              contact_number: event.target.value,
            }))
          }
          required
        />
        <button type="submit" className="button-light" disabled={profileSubmit.pending}>
          {profileSubmit.pending ? 'Saving...' : 'Update Profile'}
        </button>
      </form>

      {profileSubmit.error && (
        <div className="mini-feedback mini-error">
          <p>{profileSubmit.error}</p>
        </div>
      )}
      {profileSubmit.success && (
        <div className="mini-feedback mini-success">
          <p>{profileSubmit.success}</p>
        </div>
      )}

      <form className="inline-form account-password-form" onSubmit={submitPassword}>
        <input
          type="password"
          placeholder="Current password"
          value={passwordForm.current_password}
          onChange={(event) =>
            setPasswordForm((current) => ({
              ...current,
              current_password: event.target.value,
            }))
          }
          autoComplete="current-password"
          required
        />
        <input
          type="password"
          placeholder="New password"
          value={passwordForm.new_password}
          onChange={(event) =>
            setPasswordForm((current) => ({
              ...current,
              new_password: event.target.value,
            }))
          }
          minLength={8}
          autoComplete="new-password"
          required
        />
        <input
          type="password"
          placeholder="Confirm new password"
          value={passwordForm.confirm_password}
          onChange={(event) =>
            setPasswordForm((current) => ({
              ...current,
              confirm_password: event.target.value,
            }))
          }
          minLength={8}
          autoComplete="new-password"
          required
        />
        <button type="submit" className="button-light" disabled={passwordSubmit.pending}>
          {passwordSubmit.pending ? 'Updating...' : 'Change Password'}
        </button>
      </form>

      {passwordSubmit.error && (
        <div className="mini-feedback mini-error">
          <p>{passwordSubmit.error}</p>
        </div>
      )}
      {passwordSubmit.success && (
        <div className="mini-feedback mini-success">
          <p>{passwordSubmit.success}</p>
        </div>
      )}
    </ModuleCard>
  );
}

export default AccountSettingsCard;
