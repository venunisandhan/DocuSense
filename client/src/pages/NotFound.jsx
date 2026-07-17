import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertCircle, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-alice-blue text-center overflow-hidden">
      <div className="fixed -top-24 -left-24 w-96 h-96 bg-sky-blue/10 blob blur-3xl -z-10 animate-pulse"></div>
      <div className="fixed -bottom-24 -right-24 w-96 h-96 bg-tangerine/5 blob blur-3xl -z-10 animate-pulse delay-700"></div>

      <div className="glass-card max-w-lg p-12">
        <div className="w-24 h-24 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-500 mx-auto mb-8 shadow-inner shadow-rose-200/50">
          <AlertCircle className="w-12 h-12" />
        </div>
        
        <h1 className="text-7xl font-heading font-extrabold text-slate-800 mb-4 tracking-tighter">404</h1>
        <h2 className="text-2xl font-bold text-slate-700 mb-6">Page Not Found</h2>
        
        <p className="text-slate-500 mb-10 leading-relaxed">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            to="/" 
            className="glass-button bg-sky-blue text-white flex items-center justify-center gap-2 font-bold px-8 py-4"
          >
            <Home className="w-5 h-5" /> Back to Dashboard
          </Link>
          <button 
            onClick={() => window.history.back()}
            className="glass-button bg-white text-slate-600 flex items-center justify-center gap-2 font-bold px-8 py-4 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" /> Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
