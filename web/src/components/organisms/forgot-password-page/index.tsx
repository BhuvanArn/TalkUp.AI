import { iconMap } from '@/components/atoms/icon/icon-map';
import { Link } from '@tanstack/react-router';
import React, { useState } from 'react';

/**
 * ForgotPasswordPage Component
 * * Provides a user interface for password recovery.
 * Features a split layout with a functional form on the left and
 * branding content on the right.
 * * @returns {React.ReactElement} The rendered Forgot Password page.
 */
const ForgotPasswordPage: React.FC = () => {
  /** @type {string} User's input email address */
  const [email, setEmail] = useState('');

  /** @type {boolean} State to track validation errors for the email input */
  const [error, setError] = useState(false);

  const ClockIcon = iconMap.clock;
  const ArrowLeftIcon = iconMap['arrow-left'];
  const WarningIcon = iconMap.warning;

  /**
   * Validates the email and handles form submission.
   * * @param {React.FormEvent} e - The form submission event.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.includes('@')) {
      setError(true);
      return;
    }

    setError(false);
    console.log('Sending reset link to:', email);
    // TODO: Integrate with Authentication API
  };

  return (
    <div className="flex min-h-screen bg-white font-sans">
      {/* --- LEFT SECTION: Recovery Form --- */}
      <div className="w-full lg:w-[60%] flex flex-col p-8 lg:p-16 relative justify-center">
        <div className="flex flex-col justify-center items-center max-w-md mx-auto w-full">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Forgot password?
          </h1>
          <p className="text-gray-500 text-center mb-8">
            Enter your email and we'll send you a link to reset your password.
          </p>

          {/* noValidate prevents the native orange browser tooltip */}
          <form onSubmit={handleSubmit} noValidate className="w-full space-y-6">
            <div className="flex flex-col gap-2 relative">
              <input
                type="email"
                placeholder="Enter your email"
                className={`w-full p-4 border rounded-md focus:outline-none focus:ring-2 transition-all ${
                  error
                    ? 'border-orange-500 focus:ring-orange-200'
                    : 'border-gray-200 focus:ring-blue-500'
                }`}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(false);
                }}
              />

              {/* Custom validation message using the orange warning icon */}
              {error && (
                <div className="flex items-center gap-2 text-orange-600 text-sm mt-1">
                  <WarningIcon className="w-4 h-4" />
                  <span>Please include an '@' in the email address.</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-md shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition-all"
            >
              <ClockIcon className="w-5 h-5" />
              Send reset link
            </button>
          </form>

          <Link
            to="/login"
            className="mt-6 text-sm text-gray-500 hover:text-gray-800 transition-colors flex items-center gap-2"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to login.
          </Link>
        </div>
      </div>

      {/* --- RIGHT SECTION: Branding --- */}
      <div className="hidden lg:flex lg:w-[40%] bg-blue-600 flex-col justify-center items-center text-center p-12 relative overflow-hidden">
        {/* Visual decoration elements */}
        <div className="absolute top-[-19%] right-[-10%] w-64 h-64 bg-blue-500 rounded-full opacity-20"></div>
        <div className="absolute bottom-[-5%] left-[-5%] w-48 h-48 bg-blue-500 rounded-full opacity-20"></div>

        <div className="relative z-10 max-w-xs">
          <h2 className="text-3xl font-extrabold text-white leading-tight mb-4">
            The best way to predict the future is to create it. Secure your
            journey with TalkUp today.!
          </h2>

          <div className="flex justify-center gap-2 mt-8">
            <div className="w-8 h-1 bg-white rounded-full opacity-100"></div>
            <div className="w-8 h-1 bg-white rounded-full opacity-40"></div>
            <div className="w-8 h-1 bg-white rounded-full opacity-40"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
