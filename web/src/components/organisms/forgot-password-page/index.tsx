import React, { useState } from 'react';

/**
 * Page de récupération de mot de passe TalkUp.
 * Structure : 2 colonnes (Formulaire à gauche, Branding à droite).
 */
const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Envoi du lien à :", email);
    // Logique d'appel API ici
  };

  return (
    <div className="flex min-h-screen bg-white font-sans">
      
      {/* --- Section GAUCHE : Formulaire --- */}
      <div className="w-full lg:w-[60%] flex flex-col p-8 lg:p-16 relative justify-center">
        
        {/* Formulaire Central */}
        <div className="flex flex-col justify-center items-center max-w-md mx-auto w-full">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Forgot password?</h1>
          <p className="text-gray-500 text-center mb-8">
            Enter your email and we'll send you a link to reset your password.
          </p>

          <form onSubmit={handleSubmit} className="w-full space-y-6">
            <div className="flex flex-col gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full p-4 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-md shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Send reset link
            </button>
          </form>

          <button className="mt-6 text-sm text-gray-500 hover:text-gray-800 transition-colors">
            Back to login.
          </button>
        </div>
      </div>

      {/* --- Section DROITE : Branding/Quote --- */}
      <div className="hidden lg:flex lg:w-[40%] bg-blue-500 flex-col justify-center items-center text-center p-12 relative overflow-hidden">
        
        <div className="absolute top-[-19%] right-[-10%] w-64 h-64 bg-blue-400 rounded-full opacity-20"></div>
        <div className="absolute bottom-[-5%] left-[-5%] w-48 h-48 bg-blue-400 rounded-full opacity-20"></div>

        <div className="relative z-10 max-w-xs">
          <h2 className="text-3xl font-extrabold text-white leading-tight mb-4">
            The best way to predict the future is to create it. Secure your journey with TalkUp today.!
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