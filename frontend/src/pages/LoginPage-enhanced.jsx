import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/useAuth.js';
import { roleDashboardPath } from '../utils/roles.js';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';

function LoginPage() {
  const { authState, login } = useAuth();
  const location = useLocation();

  const [form, setForm] = useState({
    email: '',
    password: '',
    role: 'seeker',
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState('');

  if (authState.status === 'authenticated') {
    return <Navigate to={roleDashboardPath(authState.user?.role)} replace />;
  }

  const fromPath = location.state?.from;

  async function onSubmit(event) {
    event.preventDefault();
    setFeedback('');
    setUnverifiedEmail('');
    setSubmitting(true);

    const result = await login(form);
    setSubmitting(false);

    if (!result.success) {
      if (result.status === 403 && result.data?.requires_verification) {
        setUnverifiedEmail(form.email);
        setFeedback('Your email address has not been verified. Please check your inbox for the verification link.');
        return;
      }

      const apiError = result.errors?.[0] || result.message || 'Unable to login.';
      setFeedback(apiError);
      return;
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Hero Section */}
        <div className="hidden lg:block">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border shadow-sm">
              <span className="text-2xl">🏠</span>
              <span className="font-bold text-slate-900">RentEase</span>
            </div>
            
            <h1 className="text-5xl font-bold text-slate-900 leading-tight">
              Boarding House Management, Simplified.
            </h1>
            
            <p className="text-lg text-slate-600 leading-relaxed">
              Streamline your boarding house operations with role-based access for seekers, 
              parents, owners, and administrators. Modern, secure, and easy to use.
            </p>
            
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border shadow-sm">
                <span className="text-green-600">✓</span>
                <span className="text-sm font-medium text-slate-700">Session Auth</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border shadow-sm">
                <span className="text-green-600">✓</span>
                <span className="text-sm font-medium text-slate-700">RBAC Routes</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border shadow-sm">
                <span className="text-green-600">✓</span>
                <span className="text-sm font-medium text-slate-700">Email Verification</span>
              </div>
            </div>
          </div>
        </div>

        {/* Login Card */}
        <Card className="w-full shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Sign in to your account</CardTitle>
            <CardDescription>
              Enter your credentials to access your dashboard
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {fromPath && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  Protected path blocked: <strong>{fromPath}</strong>
                </p>
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="your-email@domain.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Enter your password"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Login As</Label>
                <select
                  id="role"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                >
                  <option value="seeker">Seeker / Boarder</option>
                  <option value="parent">Parent</option>
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {feedback && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-900 font-medium">{feedback}</p>
                  {unverifiedEmail && (
                    <div className="mt-3 space-y-2">
                      <p className="text-sm text-red-800">
                        Need a new verification link?
                      </p>
                      <Link 
                        to="/resend-verification" 
                        state={{ email: unverifiedEmail }}
                        className="inline-flex items-center text-sm font-medium text-red-900 underline underline-offset-2 hover:text-red-700"
                      >
                        Resend Verification Email →
                      </Link>
                    </div>
                  )}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Signing in...' : 'Sign In'}
              </Button>

              <div className="flex items-center justify-between text-sm">
                <Link 
                  to="/forgot-password"
                  className="text-slate-600 hover:text-slate-900 underline underline-offset-2"
                >
                  Forgot password?
                </Link>
                <Link 
                  to="/register"
                  className="text-slate-600 hover:text-slate-900 underline underline-offset-2"
                >
                  Create account
                </Link>
              </div>
            </form>

            <div className="mt-6 pt-6 border-t">
              <p className="text-xs text-center text-slate-500">
                Backend required: Ensure XAMPP Apache/MySQL is running
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default LoginPage;
