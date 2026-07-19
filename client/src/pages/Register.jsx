import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Loader2, Layers, AlertCircle, ArrowRight, ShieldCheck, Briefcase } from 'lucide-react';
import { register } from '../services/auth.service';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await register(formData);
      setUser(data.user);
      if (data.user.role === 'HR') {
        navigate('/hr');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-alice-blue">
      <div className="absolute top-0 left-0 w-full h-full -z-10">
        <div className="absolute top-1/4 -right-20 w-80 h-80 bg-sky-blue/20 blob blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-tangerine/10 blob blur-3xl animate-pulse delay-700"></div>
      </div>

      <div className="glass-card w-full max-w-md p-10 flex flex-col items-center">
        <div className="w-16 h-16 bg-sky-blue rounded-2xl flex items-center justify-center text-white shadow-xl shadow-sky-blue/20 mb-8">
          <Layers className="w-10 h-10" />
        </div>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-heading font-extrabold text-slate-800 mb-2">Join DocuSense</h1>
          <p className="text-slate-500 font-medium">Smart document analysis for modern teams</p>
        </div>

        {error && (
          <div className="w-full mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-center gap-3 text-rose-600 text-sm font-medium animate-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                required
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full glass-input pl-12 py-4"
              />
            </div>
          </div>

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
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Role</label>
            <div className="relative">
              <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <select
                required
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className="w-full glass-input pl-12 py-4 appearance-none"
              >
                <option value="" disabled>Select your role</option>
                <option value="HR">HR Manager</option>
                <option value="EMPLOYEE">Employee</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
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
            <p className="text-[10px] text-slate-400 ml-1 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-sage" /> Use at least 8 characters with numbers
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full glass-button bg-sky-blue text-white py-4 font-bold text-lg flex items-center justify-center gap-2 mt-4 hover:shadow-lg hover:shadow-sky-blue/30 active:scale-95 transition-all cursor-pointer"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
              <>Get Started <ArrowRight className="w-5 h-5" /></>
            )}
          </button>
        </form>

        <p className="text-sm text-slate-500 mt-10">
          Already have an account? <Link to="/login" className="text-sky-blue font-bold hover:underline">Sign in</Link>
        </p>

        <p className="text-[10px] text-center text-slate-400 mt-12 max-w-[280px]">
          By creating an account, you agree to our <span className="underline">Terms of Service</span> and <span className="underline">Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
};

export default Register;
