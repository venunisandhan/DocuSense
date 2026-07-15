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
  Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getDocuments, uploadDocument, deleteDocument } from '../services/document.service';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const Documents = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadMetadata, setUploadMetadata] = useState({ accessLevel: 'Public', tags: '' });

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

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', selectedFile.name.split('.')[0]); // Use filename as default title
    formData.append('accessLevel', uploadMetadata.accessLevel);
    formData.append('tags', uploadMetadata.tags);

    try {
      await uploadDocument(formData);
      setIsUploadModalOpen(false);
      setSelectedFile(null);
      fetchDocs();
    } catch (err) {
      alert('Upload failed: ' + (err.response?.data?.message || err.message));
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

  const filteredDocs = documents.filter(doc => 
    (doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
     doc.originalFilename.toLowerCase().includes(searchQuery.toLowerCase())) ||
    doc.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <AppLayout title="Document Library">
      {/* Header Actions */}
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
          <button className="glass-button p-2.5">
            <Filter className="w-5 h-5 text-slate-600" />
          </button>
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

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'All Files', count: documents.length, color: 'sky-blue' },
          { label: 'Public', count: documents.filter(d => d.accessLevel === 'Public').length, color: 'sage' },
          { label: 'HR Only', count: documents.filter(d => d.accessLevel === 'HR').length, color: 'tangerine' },
          { label: 'Private', count: documents.filter(d => d.accessLevel === 'Private').length, color: 'indigo-400' }
        ].map(stat => (
          <div key={stat.label} className="glass rounded-2xl p-4 flex flex-col items-center text-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</span>
            <span className={cn("text-2xl font-heading font-extrabold", `text-${stat.color}`)}>{stat.count}</span>
          </div>
        ))}
      </div>

      {/* Document Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <Loader2 className="w-12 h-12 animate-spin mb-4" />
          <p className="font-medium">Loading your library...</p>
        </div>
      ) : filteredDocs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDocs.map((doc) => (
            <div key={doc._id} className="glass-card flex flex-col hover:-translate-y-1 cursor-default">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-sky-blue/10 flex items-center justify-center text-sky-blue">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="relative group">
                  <button className="p-1 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
                    <MoreVertical className="w-5 h-5 text-slate-400" />
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-48 glass rounded-xl shadow-xl border border-white/40 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all z-20 overflow-hidden">
                    <button className="w-full px-4 py-2.5 text-left text-sm text-slate-600 hover:bg-white/60 flex items-center gap-2 cursor-pointer">
                      <Eye className="w-4 h-4" /> View Details
                    </button>
                    <a 
                      href={doc.s3Url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full px-4 py-2.5 text-left text-sm text-slate-600 hover:bg-white/60 flex items-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4" /> Download
                    </a>
                    {user?.role === 'HR' && (
                      <button 
                        onClick={() => handleDelete(doc._id)}
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
                  <span>{doc.mimeType?.split('/')[1]?.toUpperCase() || 'FILE'}</span>
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

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="glass w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-white/20 flex items-center justify-between">
              <h3 className="text-xl font-heading font-bold text-slate-800">Upload Document</h3>
              <button onClick={() => setIsUploadModalOpen(false)} className="p-2 hover:bg-white/40 rounded-full cursor-pointer">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <form onSubmit={handleUpload} className="p-6 space-y-6">
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
                  onChange={(e) => setSelectedFile(e.target.files[0])}
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

              <div className="flex gap-4">
                <button 
                  type="button" 
                  onClick={() => setIsUploadModalOpen(false)}
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
    </AppLayout>
  );
};

export default Documents;
