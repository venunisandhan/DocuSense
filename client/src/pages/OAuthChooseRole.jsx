import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { setAccessToken } from '../services/api';
import { Loader2, ArrowRight } from 'lucide-react';

const OAuthChooseRole = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [role, setRole] = useState('EMPLOYEE');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return alert('Missing token!');
    
    setLoading(true);
    try {
      const { data } = await api.post('/auth/google/complete', { token, role });
      setAccessToken(data.data.accessToken);
      setUser(data.data.user);
      navigate(data.data.user.role === 'HR' ? '/hr' : '/');
    } catch (err) {
      alert('Failed to complete signup: ' + (err.response?.data?.error?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return <div className="p-10 text-center text-rose-500">Invalid link. Token is missing.</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-alice-blue">
      <div className="glass-card w-full max-w-md p-10 flex flex-col items-center">
        <h1 className="text-3xl font-heading font-extrabold text-slate-800 mb-2">Almost there!</h1>
        <p className="text-slate-500 font-medium mb-8">Please select your role to continue.</p>

        <form onSubmit={handleSubmit} className="w-full space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Select Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full glass-input py-4"
            >
              <option value="EMPLOYEE">Employee</option>
              <option value="HR">HR Administrator</option>
            </select>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full glass-button bg-sky-blue text-white py-4 font-bold flex items-center justify-center gap-2 mt-4 hover:shadow-lg cursor-pointer"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>Complete Signup <ArrowRight className="w-5 h-5" /></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OAuthChooseRole;
