import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Mail, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import { parseApiError } from '../utils/apiError';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setSent(true);
      toast.success('Reset link sent if email exists');
    } catch (err) {
      toast.error(parseApiError(err, 'Request failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-950">
      <div className="w-full max-w-md card p-8">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-8 h-8 text-primary-600" />
          <span className="text-xl font-bold">DigiTracker</span>
        </div>

        {sent ? (
          <div className="text-center">
            <Mail className="w-12 h-12 text-primary-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold">Check your email</h2>
            <p className="text-gray-500 mt-2">If an account exists for {email}, a reset link has been sent.</p>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold">Forgot password?</h2>
            <p className="text-gray-500 mt-1 mb-6">Enter your email to receive a reset link</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                className="input"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          </>
        )}

        <Link to="/login" className="flex items-center gap-1 text-sm text-primary-600 mt-6 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to login
        </Link>
      </div>
    </div>
  );
}
