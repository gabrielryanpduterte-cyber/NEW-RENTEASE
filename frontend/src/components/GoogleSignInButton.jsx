import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { ENABLE_GOOGLE_AUTH } from '../config/google-oauth.js';

function GoogleSignInButton({ onSuccess, onError }) {
  const navigate = useNavigate();

  // Don't render if Google Auth is disabled
  if (!ENABLE_GOOGLE_AUTH) {
    return null;
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    const token = credentialResponse.credential;

    try {
      // Decode JWT to get user info
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const userInfo = JSON.parse(jsonPayload);

      // Always go to complete profile page
      // It will check if user exists and redirect accordingly
      navigate('/complete-profile', {
        state: {
          googleUserInfo: userInfo,
          googleCredential: token,
        },
      });

      onSuccess?.(userInfo);
    } catch (err) {
      console.error('Google sign-in error:', err);
      onError?.('Failed to process Google sign-in');
    }
  };

  const handleGoogleError = (error) => {
    console.error('Google OAuth error:', error);

    // Check if it's a configuration error
    if (error?.error === 'idpiframe_initialization_failed') {
      onError?.('Google Sign-In is not properly configured. Please check GOOGLE_AUTH_SETUP.md');
    } else {
      onError?.('Google sign-in failed. Please try again.');
    }
  };

  return (
    <div className="google-signin-wrapper">
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
        useOneTap={false}
        theme="outline"
        size="large"
        text="continue_with"
        shape="rectangular"
        auto_select={false}
      />
    </div>
  );
}

export default GoogleSignInButton;
