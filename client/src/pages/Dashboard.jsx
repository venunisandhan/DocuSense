import React, { useState, useEffect } from 'react';
import AppLayout from '../layouts/AppLayout';
import { 
  FileText, 
  Users, 
  Upload, 
  TrendingUp, 
  AlertCircle, 
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Zap,
  Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ChatBot from '../components/ChatBot';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalDocs: 0,
    pendingReviews: 3,
    complianceScore: 92,
    recentDocs: []
  });
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/documents');
        setStats(prev => ({
          ...prev,
          totalDocs: data.length,
          recentDocs: data.slice(0, 5)
        }));
      } catch (err) {
        console.error('Error fetching dashboard stats', err);
      }
    };
    fetchStats();
  }, []);

  return (
    <AppLayout title="Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Hero Banner / AI Spotlight */}
        <div className="md:col-span-2 glass-card bg-gradient-to-br from-white/40 to-sky-blue/10 flex flex-col justify-between overflow-hidden group">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tangerine/20 text-tangerine text-xs font-bold mb-4">
              <Zap className="w-3 h-3" /> AI INSIGHTS
            </div>
            <h2 className="text-3xl font-heading font-extrabold text-slate-800 mb-2 leading-tight">
              {stats.pendingReviews} documents require <br/> your immediate attention.
            </h2>
            <p className="text-slate-600 mb-6 max-w-md">
              DocuSense analyzed your recent uploads. We found potential compliance gaps in the 2024 HR Policy draft.
            </p>
            <button className="glass-button bg-sky-blue text-white flex items-center gap-2 group-hover:gap-3">
              Review Now <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-sky-blue/5 blob blur-3xl -z-0 group-hover:scale-110 transition-transform duration-700"></div>
          <div className="absolute -bottom-12 -right-12 text-sky-blue/5">
            <MessageSquare className="w-64 h-64 rotate-12" />
          </div>
        </div>

        {/* Compliance Gauge */}
        <div className="glass-card flex flex-col items-center justify-center text-center">
          <h3 className="text-slate-500 font-bold text-xs tracking-widest uppercase mb-6">Compliance Score</h3>
          <div className="relative w-40 h-40 flex items-center justify-center mb-6">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke="rgba(0, 191, 255, 0.1)"
                strokeWidth="12"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke="var(--color-sky-blue)"
                strokeWidth="12"
                strokeDasharray="440"
                strokeDashoffset={440 - (440 * stats.complianceScore) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-heading font-extrabold text-slate-800">{stats.complianceScore}%</span>
              <span className="text-xs text-sage font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> SECURE
              </span>
            </div>
          </div>
          <p className="text-slate-500 text-sm">Document integrity is optimal.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Total Stats */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card flex items-center gap-4 border-l-4 border-l-sky-blue">
            <div className="w-12 h-12 rounded-xl bg-sky-blue/10 flex items-center justify-center text-sky-blue">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Total Documents</p>
              <h4 className="text-2xl font-heading font-extrabold text-slate-800">{stats.totalDocs}</h4>
            </div>
          </div>

          <div className="glass-card flex items-center gap-4 border-l-4 border-l-tangerine">
            <div className="w-12 h-12 rounded-xl bg-tangerine/10 flex items-center justify-center text-tangerine">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Activity Growth</p>
              <h4 className="text-2xl font-heading font-extrabold text-slate-800">+12%</h4>
            </div>
          </div>

          <div className="glass-card bg-gradient-to-br from-indigo-500 to-sky-blue text-white p-6 relative overflow-hidden group">
            <h4 className="text-xl font-heading font-bold mb-2 relative z-10">Upload Document</h4>
            <p className="text-white/80 text-sm mb-6 relative z-10">Securely store and analyze new company policies.</p>
            <button className="glass-button bg-white text-indigo-600 border-none relative z-10 font-bold">
              Select Files
            </button>
            <Upload className="absolute -bottom-4 -right-4 w-24 h-24 text-white/10 group-hover:scale-110 transition-transform" />
          </div>
        </div>

        {/* Recent Documents Table */}
        <div className="lg:col-span-2 glass-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-heading font-bold text-slate-800">Recent Activity</h3>
            <button className="text-sky-blue text-sm font-bold hover:underline">View All</button>
          </div>
          <div className="space-y-4">
            {stats.recentDocs.length > 0 ? stats.recentDocs.map((doc) => (
              <div key={doc._id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/40 transition-all border border-transparent hover:border-white/60 cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white/60 flex items-center justify-center text-slate-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-800">{doc.title || doc.originalFilename}</h5>
                    <p className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(doc.createdAt).toLocaleDateString()} • {doc.mimeType}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full font-bold",
                    doc.accessLevel === 'Public' ? "bg-sage/20 text-sage" : "bg-sky-blue/20 text-sky-blue"
                  )}>
                    {doc.accessLevel}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
              </div>
            )) : (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
                <p>No recent activity found.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Button for AI Chat */}
      <button 
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-br from-sky-blue to-indigo-500 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group cursor-pointer"
      >
        <Bot className="w-8 h-8" />
        <span className="absolute -top-12 right-0 bg-slate-800 text-white text-[10px] py-1 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Ask DocuSense
        </span>
      </button>

      <ChatBot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </AppLayout>
  );
};

export default Dashboard;
