import React, { useState, useEffect } from 'react';
import AppLayout from '../layouts/AppLayout';
import { 
  FileText,
  Search,
  Filter,
  Plus,
  MoreVertical,
  Download,
  Trash2,
  Shield,
  Eye,
  X,
  Loader2,
  FileUp,
  Clock,
  Share2,
  Check,
  Users,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getDocuments, uploadDocument, deleteDocument } from '../services/document.service';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { searchEmployees, getGroups } from '../services/hr.service';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/* ───── Share Document Modal ───── */
const ShareModal = ({ doc, onClose }) => {
  const [tab, setTab] = useState('user');
  const [employees, setEmployees] = useState([]);
  const [groups, setGroups] = useState([]);
  const [searchQ, setSearchQ] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [accessType, setAccessType] = useState('LIFETIME');
  const [expiresAt, setExpiresAt] = useState('');
  const [sharing, setSharing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [emps, grps] = await Promise.all([searchEmployees(''), getGroups()]);
        setEmployees(emps);
        setGroups(grps);
      } catch {}
      finally { setLoadingData(false); }
    })();
  }, []);

  const list = tab === 'user'
    ? employees.filter(e =>
        e.name.toLowerCase().includes(searchQ.toLowerCase()) ||
        e.email.toLowerCase().includes(searchQ.toLowerCase())
      )
    : groups.filter(g => g.name.toLowerCase().includes(searchQ.toLowerCase()));

  const handleShare = async () => {
    if (!selectedId) return setError('Please select a recipient.');
    if (accessType === 'EXPIRING' && !expiresAt) return setError('Please set an expiry date.');
    setSharing(true);
    setError('');
    try {
      await api.post(`/documents/${doc._id}/access`, {
        targetType: tab === 'user' ? 'USER' : 'GROUP',
        targetId: selectedId,
        accessType,
        expiresAt: accessType === 'EXPIRING' ? new Date(expiresAt).toISOString() : undefined,
      });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        <div className="p-6 border-b border-white/20 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-xl font-heading font-bold text-slate-800">Share Document</h3>
            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">{doc.title || doc.originalFilename}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/40 rounded-full cursor-pointer">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {done ? (
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-emerald-500" />
            </div>
            <h4 className="text-xl font-bold text-slate-800 mb-2">Access Granted!</h4>
            <p className="text-slate-500 text-sm mb-6">The selected recipient can now access this document.</p>
            <button onClick={onClose} className="glass-button bg-sky-blue text-white font-bold px-8">Done</button>
          </div>
        ) : (
          <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
            <div className="flex items-center gap-1 glass p-1 rounded-xl">
              <button
                onClick={() => { setTab('user'); setSelectedId(null); setSearchQ(''); }}
                className={cn('flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer',
                  tab === 'user' ? 'bg-white text-sky-blue shadow-sm' : 'text-slate-500'
                )}
              >
                <User className="w-4 h-4" /> Person
              </button>
              <button
                onClick={() => { setTab('group'); setSelectedId(null); setSearchQ(''); }}
                className={cn('flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer',
                  tab === 'group' ? 'bg-white text-sky-blue shadow-sm' : 'text-slate-500'
                )}
              >
                <Users className="w-4 h-4" /> Group
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                placeholder={tab === 'user' ? 'Search employees…' : 'Search groups…'}
                className="w-full glass-input pl-10 text-sm"
              />
            </div>
            <div className="max-h-52 overflow-y-auto custom-scrollbar space-y-1 pr-1">
              {loadingData ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-sky-blue" />
                </div>
              ) : list.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-6 italic">
                  No {tab === 'user' ? 'employees' : 'groups'} found
                </p>
              ) : list.map(item => {
                const isSelected = selectedId === item._id;
                return (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => setSelectedId(item._id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-left border',
                      isSelected ? 'bg-sky-blue/10 border-sky-blue/30' : 'hover:bg-white/50 border-transparent'
                    )}
                  >
                    <div className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0',
                      isSelected ? 'bg-sky-blue text-white' : 'bg-slate-100 text-slate-500'
                    )}>
                      {isSelected
                        ? <Check className="w-4 h-4" />
                        : tab === 'user'
                          ? item.name.charAt(0).toUpperCase()
                          : <Users className="w-4 h-4" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{item.name}</p>
                      {tab === 'user'
                        ? <p className="text-[11px] text-slate-500 truncate">{item.email}</p>
                        : <p className="text-[11px] text-slate-500">{item.members?.length || 0} members</p>
                      }
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-sky-blue shrink-0" />}
                  </button>
                );
              })}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Access Duration</label>
              <div className="grid grid-cols-2 gap-2">
                {['LIFETIME', 'EXPIRING'].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAccessType(type)}
                    className={cn(
                      'py-2.5 rounded-xl text-sm font-bold border transition-all cursor-pointer',
                      accessType === type
                        ? 'bg-sky-blue/10 border-sky-blue/40 text-sky-blue'
                        : 'border-white/40 text-slate-500 hover:bg-white/40'
                    )}
                  >
                    {type === 'LIFETIME' ? '♾ Lifetime' : '⏱ Expiring'}
                  </button>
                ))}
              </div>
              {accessType === 'EXPIRING' && (
                <input
                  type="datetime-local"
                  value={expiresAt}
                  min={new Date().toISOString().slice(0, 16)}
                  onChange={e => setExpiresAt(e.target.value)}
                  className="w-full glass-input mt-2 text-sm"
                />
              )}
            </div>

            {error && (
              <p className="text-sm text-rose-500 bg-rose-50 border border-rose-100 rounded-xl px-4 py-2">{error}</p>
            )}
          </div>
        )}

        {!done && (
          <div className="p-6 border-t border-white/20 flex gap-3 shrink-0">
            <button onClick={onClose} className="flex-1 glass-button font-bold text-slate-600">Cancel</button>
            <button
              onClick={handleShare}
              disabled={sharing || !selectedId}
              className="flex-1 glass-button bg-sky-blue text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {sharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
              Grant Access
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const Documents = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadMetadata, setUploadMetadata] = useState({ accessLevel: 'Public', tags: '' });
  const [shareDoc, setShareDoc] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [accessFilter, setAccessFilter] = useState('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const data = await getDocuments();
      setDocuments(data);
    } catch (err) {
      console.error('Failed to fetch docs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    const validExtensions = ['.pdf', '.docx', '.txt'];
    const hasValidType = validTypes.includes(selectedFile.type);
    const hasValidExtension = validExtensions.some(ext => selectedFile.name.toLowerCase().endsWith(ext));

    if (!hasValidType && !hasValidExtension) {
      setUploadError('Invalid file type. Please upload a PDF, DOCX, or TXT file.');
      return;
    }

    setUploading(true);
    setUploadError('');
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', selectedFile.name.split('.')[0]);
    formData.append('accessLevel', uploadMetadata.accessLevel);
    formData.append('tags', uploadMetadata.tags);

    try {
      await uploadDocument(formData);
      setIsUploadModalOpen(false);
      setSelectedFile(null);
      fetchDocs();
    } catch (err) {
      setUploadError(err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await deleteDocument(id);
      fetchDocs();
    } catch (err) {
      alert('Delete failed');
    }
  };

  const handleDownload = async (id) => {
    try {
      const { data } = await api.get(`/documents/${id}/download`);
      window.open(data.data.url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      alert('Download failed');
    }
  };

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = (doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      doc.originalFilename.toLowerCase().includes(searchQuery.toLowerCase())) ||
      doc.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;
    
    if (accessFilter === 'All') return true;
    if (accessFilter === 'HR Only') return doc.accessLevel === 'HR';
    return doc.accessLevel === accessFilter;
  });

  return (
    <AppLayout title="Document Library">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search by name or tags..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input pl-10 w-full"
            />
          </div>
          <div className="relative">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={cn("glass-button p-2.5 flex items-center gap-2 cursor-pointer transition-colors", accessFilter !== 'All' ? 'bg-sky-blue text-white' : '')}
            >
              <Filter className={cn("w-5 h-5", accessFilter !== 'All' ? 'text-white' : 'text-slate-600')} />
              {accessFilter !== 'All' && <span className="text-sm font-bold pr-1">{accessFilter}</span>}
            </button>
            {isFilterOpen && (
              <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-48 glass rounded-xl shadow-xl border border-white/40 z-20 py-2">
                <div className="px-3 pb-2 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-white/20 mb-2">Filter by Access</div>
                {['All', 'Public', ...(user?.role === 'HR' ? ['HR Only'] : []), 'Private'].map(f => (
                  <button
                    key={f}
                    onClick={() => { setAccessFilter(f); setIsFilterOpen(false); }}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-white/60 flex items-center justify-between cursor-pointer"
                  >
                    {f}
                    {accessFilter === f && <Check className="w-4 h-4 text-sky-blue" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {user?.role === 'HR' && (
          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="glass-button bg-sky-blue text-white flex items-center gap-2 w-full sm:w-auto justify-center cursor-pointer"
          >
            <Plus className="w-5 h-5" /> Upload Document
          </button>
        )}
      </div>
      <div className={cn("grid gap-4 mb-8", user?.role === 'HR' ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-1 sm:grid-cols-3")}>
        {[
          { label: 'All Files', count: documents.length, color: 'sky-blue' },
          { label: 'Public', count: documents.filter(d => d.accessLevel === 'Public').length, color: 'sage' },
          user?.role === 'HR' ? { label: 'HR Only', count: documents.filter(d => d.accessLevel === 'HR').length, color: 'tangerine' } : null,
          { label: 'Private', count: documents.filter(d => d.accessLevel === 'Private').length, color: 'indigo-400' }
        ].filter(Boolean).map(stat => (
          <div 
            key={stat.label}
            onClick={() => setAccessFilter(stat.label === 'All Files' ? 'All' : stat.label)}
            className={cn("glass rounded-2xl p-4 flex flex-col items-center text-center cursor-pointer transition-all hover:bg-white/40",
              (accessFilter === stat.label || (accessFilter === 'All' && stat.label === 'All Files')) 
                ? 'bg-white/60 shadow-sm border border-white/80 scale-[1.02]' 
                : 'border border-transparent'
            )}>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</span>
            <span className={cn("text-2xl font-heading font-extrabold", `text-${stat.color}`)}>{stat.count}</span>
          </div>
        ))}
      </div>
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <Loader2 className="w-12 h-12 animate-spin mb-4" />
          <p className="font-medium">Loading your library...</p>
        </div>
      ) : filteredDocs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDocs.map((doc) => (
            <div
              key={doc._id}
              onClick={() => navigate(`/documents/${doc._id}`)}
              className="glass-card flex flex-col hover:-translate-y-1 cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-sky-blue/10 flex items-center justify-center text-sky-blue">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="relative group" onClick={e => e.stopPropagation()}>
                  <button className="p-1 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
                    <MoreVertical className="w-5 h-5 text-slate-400" />
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-48 glass rounded-xl shadow-xl border border-white/40 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all z-20 overflow-hidden">
                    <button onClick={() => navigate(`/documents/${doc._id}`)} className="w-full px-4 py-2.5 text-left text-sm text-slate-600 hover:bg-white/60 flex items-center gap-2 cursor-pointer">
                      <Eye className="w-4 h-4" /> View Details
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDownload(doc._id); }}
                      className="w-full px-4 py-2.5 text-left text-sm text-slate-600 hover:bg-white/60 flex items-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4" /> Download
                    </button>
                    {user?.role === 'HR' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setShareDoc(doc); }}
                        className="w-full px-4 py-2.5 text-left text-sm text-sky-blue hover:bg-sky-blue/10 flex items-center gap-2 cursor-pointer"
                      >
                        <Share2 className="w-4 h-4" /> Share Access
                      </button>
                    )}  
                    {user?.role === 'HR' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(doc._id); }}
                        className="w-full px-4 py-2.5 text-left text-sm text-rose-500 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-bold text-slate-800 line-clamp-1 mb-1" title={doc.title || doc.originalFilename}>
                  {doc.title || doc.originalFilename}
                </h4>
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(doc.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{doc.mimeType?.includes('pdf') ? 'PDF' : doc.mimeType?.includes('word') ? 'DOCX' : doc.mimeType?.includes('text') ? 'TXT' : 'FILE'}</span>
                  {doc.expiresAt && (
                    <>
                      <span>•</span>
                      <span className="text-tangerine">Expires: {new Date(doc.expiresAt).toLocaleDateString()}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-auto flex items-center justify-between">
                <span className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full font-bold",
                  doc.accessLevel === 'Public' ? "bg-sage/20 text-sage" : 
                  doc.accessLevel === 'HR' ? "bg-tangerine/20 text-tangerine" : "bg-indigo-400/20 text-indigo-400"
                )}>
                  {doc.accessLevel}
                </span>
                {doc.tags?.length > 0 && (
                  <span className="text-[10px] text-slate-400 italic">+{doc.tags.length} tags</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass rounded-3xl py-24 flex flex-col items-center justify-center text-slate-400">
          <FileText className="w-16 h-16 opacity-10 mb-4" />
          <h4 className="text-xl font-heading font-bold text-slate-300">No documents found</h4>
          <p className="text-sm">Try adjusting your search or upload a new file.</p>
        </div>
      )}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="glass w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-white/20 flex items-center justify-between">
              <h3 className="text-xl font-heading font-bold text-slate-800">Upload Document</h3>
              <button onClick={() => setIsUploadModalOpen(false)} className="p-2 hover:bg-white/40 rounded-full cursor-pointer">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <form onSubmit={handleUpload} className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
              <div 
                className={cn(
                  "border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all",
                  selectedFile ? "border-sky-blue bg-sky-blue/5" : "border-white/60 hover:border-sky-blue/40"
                )}
              >
                <input 
                  type="file" 
                  id="file-upload" 
                  className="hidden" 
                  accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                  onChange={(e) => {
                    setSelectedFile(e.target.files[0]);
                    setUploadError('');
                  }}
                />
                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                  <div className="w-16 h-16 rounded-2xl bg-white/60 flex items-center justify-center text-sky-blue mb-4 shadow-sm">
                    {selectedFile ? <FileText className="w-8 h-8" /> : <FileUp className="w-8 h-8" />}
                  </div>
                  <h5 className="font-bold text-slate-700">
                    {selectedFile ? selectedFile.name : 'Click to select or drag and drop'}
                  </h5>
                  <p className="text-xs text-slate-500 mt-1">PDF, DOCX, or TXT up to 10MB</p>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Access Level</label>
                  <select 
                    value={uploadMetadata.accessLevel}
                    onChange={(e) => setUploadMetadata({...uploadMetadata, accessLevel: e.target.value})}
                    className="w-full glass-input"
                  >
                    <option value="Public">Public</option>
                    <option value="HR">HR Only</option>
                    <option value="Private">Private</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Tags (comma separated)</label>
                  <input 
                    type="text" 
                    placeholder="policy, q3, finance"
                    value={uploadMetadata.tags}
                    onChange={(e) => setUploadMetadata({...uploadMetadata, tags: e.target.value})}
                    className="w-full glass-input"
                  />
                </div>
              </div>

              {uploadError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-sm rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{uploadError}</p>
                </div>
              )}

              <div className="flex gap-4">
                <button 
                  type="button" 
                  onClick={() => { setIsUploadModalOpen(false); setUploadError(''); }}
                  className="flex-1 glass-button font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={!selectedFile || uploading}
                  className="flex-1 glass-button bg-sky-blue text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                  {uploading ? 'Uploading...' : 'Secure Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {shareDoc && (
        <ShareModal doc={shareDoc} onClose={() => setShareDoc(null)} />
      )}
    </AppLayout>
  );
};

export default Documents;
