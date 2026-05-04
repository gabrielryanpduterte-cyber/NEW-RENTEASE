import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { GOOGLE_CONFIG } from '../config/google-oauth.js';

function GoogleSignInButton({ onSuccess, onError }) {
  const navigate = useNavigate();

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
    } catch (err) {
      console.error('Google sign-in error:', err);
      onError?.('Failed to process Google sign-in');
    }
  };

  const handleGoogleError = () => {
    onError?.('Google sign-in failed. Please try again.');
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
      />
    </div>
  );
}

export default GoogleSignInButton;
