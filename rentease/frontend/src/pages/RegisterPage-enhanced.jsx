import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { authApi, describeApiError } from '../api/client.js';
import { useAuth } from '../auth/useAuth.js';
import { roleDashboardPath } from '../utils/roles.js';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';

function RegisterPage() {
  const { authState, login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'seeker',
    contact_number: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  if (authState.status === 'authenticated') {
    return <Navigate to={roleDashboardPath(authState.user?.role)} replace />;
  }

  async function onSubmit(event) {
    event.preventDefault();
    setFeedback('');
    setSubmitting(true);

    try {
      const registerResponse = await authApi.register(form);

      if (registerResponse.data?.requires_verification) {
        setRequiresVerification(true);
        setRegisteredEmail(form.email);
        setSubmitting(false);
        return;
      }

      const loginResult = await login({
        email: form.email,
        password: form.password,
        role: form.role,
      });

      if (!loginResult.success) {
        setFeedback(loginResult.errors?.[0] || loginResult.message || 'Registration succeeded but auto-login failed.');
        setSubmitting(false);
        return;
      }

      navigate('/', { replace: true });
    } catch (error) {
      setFeedback(error?.errors?.[0] || describeApiError(error));
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
  }

  if (requiresVerification) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">✓</span>
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-900">Registration Successful!</h2>
                <p className="text-slate-600">
                  We've sent a verification link to:
                </p>
                <p className="text-lg font-semibold text-slate-900">{registeredEmail}</p>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  Please check your inbox and click the verification link to activate your account.
                  The link will expire in 24 hours.
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <Button asChild>
                  <Link to="/login">Go to Login</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/resend-verification">Resend Verification Email</Link>
                </Button>
              </div>

              <p className="text-xs text-slate-500">
                Didn't receive the email? Check your spam folder.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
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
              Join RentEase Today
            </h1>
            
            <p className="text-lg text-slate-600 leading-relaxed">
              Create your account and get started with our boarding house management platform.
              Choose your role and access the features you need.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600">✓</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">For Seekers</h3>
                  <p className="text-sm text-slate-600">Browse properties, make reservations, track payments</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600">✓</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">For Parents</h3>
                  <p className="text-sm text-slate-600">Monitor your child's accommodation and payments</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600">✓</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">For Owners</h3>
                  <p className="text-sm text-slate-600">Manage properties, rooms, reservations, and payments</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Register Card */}
        <Card className="w-full shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Create your account</CardTitle>
            <CardDescription>
              Fill in your details to get started
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="Juan Dela Cruz"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="At least 8 characters"
                  minLength={8}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Register As</Label>
                <select
                  id="role"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="seeker">Seeker / Boarder</option>
                  <option value="parent">Parent</option>
                  <option value="owner">Owner</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_number">Contact Number</Label>
                <Input
                  id="contact_number"
                  type="text"
                  value={form.contact_number}
                  onChange={(e) => setForm({ ...form, contact_number: e.target.value })}
                  placeholder="09XXXXXXXXX"
                  required
                />
              </div>

              {feedback && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-900 font-medium">{feedback}</p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Creating account...' : 'Create Account'}
              </Button>

              <div className="text-center text-sm">
                <span className="text-slate-600">Already have an account? </span>
                <Link 
                  to="/login"
                  className="text-slate-900 font-medium underline underline-offset-2 hover:text-slate-700"
                >
                  Sign in
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default RegisterPage;
