import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Loader2, Layers, AlertCircle, ArrowRight, Sun, Moon } from 'lucide-react';
import { login } from '../services/auth.service';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await login(formData);
      setUser(data.user);
      if (data.user.role === 'HR') {
        navigate('/hr');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-alice-blue">
      {/* Theme toggle – top right */}
      <button
        id="theme-toggle-login"
        onClick={toggleTheme}
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        className="fixed top-5 right-5 p-2 glass-button cursor-pointer hover:scale-110 transition-transform z-50"
      >
        {isDark ? <Sun className="w-5 h-5 text-tangerine" /> : <Moon className="w-5 h-5 text-sky-blue" />}
      </button>
      <div className="absolute top-0 left-0 w-full h-full -z-10">
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-sky-blue/20 blob blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-tangerine/10 blob blur-3xl animate-pulse delay-700"></div>
      </div>

      <div className="glass-card w-full max-w-md p-10 flex flex-col items-center">
        <div className="w-16 h-16 bg-sky-blue rounded-2xl flex items-center justify-center text-white shadow-xl shadow-sky-blue/20 mb-8 animate-bounce">
          <Layers className="w-10 h-10" />
        </div>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-heading font-extrabold text-slate-800 mb-2">Welcome Back</h1>
          <p className="text-slate-500 font-medium">Access your intelligent document assistant</p>
        </div>

        {error && (
          <div className="w-full mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-center gap-3 text-rose-600 text-sm font-medium animate-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Work Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="email"
                required
                placeholder="name@company.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full glass-input pl-12 py-4"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between ml-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Password</label>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full glass-input pl-12 py-4"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full glass-button bg-sky-blue text-white py-4 font-bold text-lg flex items-center justify-center gap-2 mt-4 hover:shadow-lg hover:shadow-sky-blue/30 active:scale-95 transition-all cursor-pointer"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
              <>Sign In <ArrowRight className="w-5 h-5" /></>
            )}
          </button>
        </form>

        <div className="mt-10 flex flex-col items-center gap-4">
          <div className="flex items-center gap-4 w-full text-slate-300">
            <div className="h-px bg-slate-200 flex-1"></div>
            <span className="text-xs font-bold uppercase">or</span>
            <div className="h-px bg-slate-200 flex-1"></div>
          </div>

          <button 
            type="button"
            onClick={handleGoogleLogin}
            className="w-full glass-button bg-white text-slate-700 flex items-center justify-center gap-3 border border-slate-200 py-4 cursor-pointer"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
            <span className="font-bold">Continue with Google</span>
          </button>
          
          <p className="text-sm text-slate-500 mt-4">
            Don't have an account? <Link to="/register" className="text-sky-blue font-bold hover:underline">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
