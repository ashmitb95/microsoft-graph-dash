'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { auth } from '@/lib/api';
import './Login.css';

const Login = () => {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  const handleLogin = () => {
    auth.login();
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Microsoft Graph Dashboard</h1>
        <p className="login-subtitle">Sign in with your Microsoft 365 account</p>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <button onClick={handleLogin} className="login-button">
          <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10.5 0C4.701 0 0 4.701 0 10.5C0 16.299 4.701 21 10.5 21C16.299 21 21 16.299 21 10.5C21 4.701 16.299 0 10.5 0Z" fill="#F25022"/>
            <path d="M10.5 0C4.701 0 0 4.701 0 10.5C0 16.299 4.701 21 10.5 21C16.299 21 21 16.299 21 10.5C21 4.701 16.299 0 10.5 0Z" fill="#7FBA00"/>
            <path d="M10.5 0C4.701 0 0 4.701 0 10.5C0 16.299 4.701 21 10.5 21C16.299 21 21 16.299 21 10.5C21 4.701 16.299 0 10.5 0Z" fill="#00A4EF"/>
            <path d="M10.5 0C4.701 0 0 4.701 0 10.5C0 16.299 4.701 21 10.5 21C16.299 21 21 16.299 21 10.5C21 4.701 16.299 0 10.5 0Z" fill="#FFB900"/>
          </svg>
          Sign in with Microsoft
        </button>
      </div>
    </div>
  );
};

export default Login;

