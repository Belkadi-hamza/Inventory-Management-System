import React, { useState } from 'react';
import { Mail, RefreshCw, X, AlertTriangle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const EmailVerificationBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  const { user, sendVerificationEmail, logout } = useAuth();

  const handleResendVerification = async () => {
    setLoading(true);
    try {
      await sendVerificationEmail();
      alert('Verification email sent! Please check your inbox.');
    } catch (error) {
      console.error('Error sending verification email:', error);
      alert('Failed to send verification email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!isVisible || !user || user.emailVerified) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-yellow-800 text-sm">
              <strong>Email verification required:</strong> Please verify your email address ({user.email}) to access all features.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={handleResendVerification}
            disabled={loading}
            className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 transition-colors duration-200 flex items-center gap-1 disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Mail className="w-4 h-4" />
            )}
            {loading ? 'Sending...' : 'Resend Email'}
          </button>
          
          <button
            onClick={handleSignOut}
            className="text-yellow-700 hover:text-yellow-800 px-2 py-1 text-sm underline"
          >
            Sign Out
          </button>
          
          <button
            onClick={() => setIsVisible(false)}
            className="text-yellow-600 hover:text-yellow-800 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};