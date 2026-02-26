"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/src/components/Button';
import { authService } from '@/src/services/auth.service';
import { useAuth } from '@/src/context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = await authService.login({ username, password });
      
      // The backend returns { access, refresh }. We'll mock a user object if not provided
      const user = data.user || { id: '1', username, email: '', role: 'admin' };
      
      login(data.access, user);
      toast.success('Login successful!');
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login failed', error);
      const message = error.response?.data?.detail || 'Invalid credentials. Please try again.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#121212] via-[#1A1A1A] to-[#121212] flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-scale-in">
        {/* Logo & Brand */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-[#8B0000] to-[#D4AF37] rounded-2xl flex items-center justify-center text-white font-bold text-4xl mx-auto mb-4 shadow-2xl">
            D
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Duke's POS</h1>
          <p className="text-[#B3B3B3]">Premium Restaurant System</p>
        </div>
        
        {/* Login Card */}
        <div className="bg-[#1F1F1F] border border-[#2A2A2A] rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#B3B3B3] mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#8B0000] transition-colors"
                placeholder="Enter your username"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#B3B3B3] mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#8B0000] transition-colors"
                placeholder="Enter your password"
                required
              />
            </div>
            
            <Button 
              type="submit"
              variant="primary" 
              size="lg" 
              fullWidth
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </form>
        </div>
        
        {/* Footer */}
        <p className="text-center text-sm text-[#808080] mt-6">
          Duke's Restaurant POS System v1.0
        </p>
      </div>
    </div>
  );
}
