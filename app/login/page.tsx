"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/src/components/Button';
import { Delete } from 'lucide-react';

export default function Login() {
  const router = useRouter(); // Changed from useNavigate
  const [pin, setPin] = useState('');
  const [role, setRole] = useState<'admin' | 'cashier' | 'kitchen'>('admin');
  
  const handleNumberClick = (num: string) => {
    if (pin.length < 4) {
      setPin(pin + num);
    }
  };
  
  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };
  
  const handleLogin = () => {
    // Mock login - navigate to dashboard
    if (pin.length === 4) {
      sessionStorage.setItem("authenticated", "true")
      router.push('/dashboard');
    }
  };
  
  const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'delete'];
  
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
          {/* Role Selector */}
          <div className="mb-6">
            <p className="text-sm text-[#B3B3B3] mb-3">Select Role</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setRole('admin')}
                className={`
                  px-4 py-3 rounded-xl font-medium text-sm transition-all
                  ${role === 'admin' 
                    ? 'bg-[#8B0000] text-white shadow-md' 
                    : 'bg-[#1A1A1A] text-[#B3B3B3] hover:bg-[#252525]'
                  }
                `}
              >
                Admin
              </button>
              <button
                onClick={() => setRole('cashier')}
                className={`
                  px-4 py-3 rounded-xl font-medium text-sm transition-all
                  ${role === 'cashier' 
                    ? 'bg-[#8B0000] text-white shadow-md' 
                    : 'bg-[#1A1A1A] text-[#B3B3B3] hover:bg-[#252525]'
                  }
                `}
              >
                Cashier
              </button>
              <button
                onClick={() => setRole('kitchen')}
                className={`
                  px-4 py-3 rounded-xl font-medium text-sm transition-all
                  ${role === 'kitchen' 
                    ? 'bg-[#8B0000] text-white shadow-md' 
                    : 'bg-[#1A1A1A] text-[#B3B3B3] hover:bg-[#252525]'
                  }
                `}
              >
                Kitchen
              </button>
            </div>
          </div>
          
          {/* PIN Display */}
          <div className="mb-6">
            <p className="text-sm text-[#B3B3B3] mb-3">Enter PIN</p>
            <div className="flex justify-center gap-3 mb-6">
              {[0, 1, 2, 3].map(i => (
                <div
                  key={i}
                  className={`
                    w-14 h-14 rounded-xl border-2 flex items-center justify-center
                    ${pin.length > i 
                      ? 'border-[#8B0000] bg-[#8B0000]/10' 
                      : 'border-[#2A2A2A] bg-[#1A1A1A]'
                    }
                  `}
                >
                  {pin.length > i && (
                    <div className="w-3 h-3 bg-[#8B0000] rounded-full" />
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* PIN Pad */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {numbers.map((num, index) => {
              if (num === '') {
                return <div key={index} />;
              }
              if (num === 'delete') {
                return (
                  <button
                    key={index}
                    onClick={handleDelete}
                    className="h-16 bg-[#1A1A1A] hover:bg-[#252525] rounded-xl flex items-center justify-center transition-all active:scale-95 border border-[#2A2A2A]"
                  >
                    <Delete className="w-6 h-6 text-[#B3B3B3]" />
                  </button>
                );
              }
              return (
                <button
                  key={index}
                  onClick={() => handleNumberClick(num)}
                  className="h-16 bg-[#1A1A1A] hover:bg-[#252525] rounded-xl text-2xl font-semibold text-white transition-all active:scale-95 border border-[#2A2A2A]"
                >
                  {num}
                </button>
              );
            })}
          </div>
          
          {/* Login Button */}
          <Button 
            variant="primary" 
            size="lg" 
            fullWidth
            onClick={handleLogin}
            disabled={pin.length !== 4}
          >
            Login
          </Button>
        </div>
        
        {/* Footer */}
        <p className="text-center text-sm text-[#808080] mt-6">
          Duke's Restaurant POS System v1.0
        </p>
      </div>
    </div>
  );
}
