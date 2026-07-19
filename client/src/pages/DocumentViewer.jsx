import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  Download,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Loader2,
  FileText,
  MessageSquare,
  Send,
  X,
  AlertCircle,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import * as mammoth from 'mammoth';

// Google Docs-style document icon
const DocIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill="currentColor" opacity="0.9"/>
    <path d="M14 2V8H20" fill="white" opacity="0.5"/>
    <rect x="8" y="13" width="8" height="1.5" rx="0.75" fill="white"/>
    <rect x="8" y="16" width="8" height="1.5" rx="0.75" fill="white"/>
    <rect x="8" y="10" width="5" height="1.5" rx="0.75" fill="white"/>
  </svg>
);

const DocIconSmall = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill="currentColor"/>
    <path d="M14 2V8H20" fill="white" opacity="0.4"/>
    <rect x="8" y="12.5" width="8" height="1.5" rx="0.75" fill="white"/>
    <rect x="8" y="15.5" width="6" height="1.5" rx="0.75" fill="white"/>
    <rect x="8" y="9.5" width="4" height="1.5" rx="0.75" fill="white"/>
  </svg>
);

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const DocumentViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [doc, setDoc] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [pdfLoading, setPdfLoading] = useState(true);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Ask me anything about this document!' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [ragStatus, setRagStatus] = useState('PENDING');

  const containerRef = React.useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [pageNumber]);

  useEffect(() => {
    let intervalId;

    const fetchDocument = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/documents/${id}`);
        setDoc(data.data.document);
      } catch (err) {
        setError('Document not found or you do not have access.');
      } finally {
        setLoading(false);
      }
    };

    const fetchViewUrl = async () => {
      try {
        const { data } = await api.get(`/documents/${id}/view`);
        setPdfUrl(data.data.url);
      } catch (err) {
      }
    };

    const fetchRagStatus = async () => {
      try {
        const { data } = await api.get(`/documents/${id}/rag-status`);
        setRagStatus(data.data.status);
        
        if (data.data.status === 'READY' || data.data.status === 'FAILED') {
          if (intervalId) clearInterval(intervalId);
        }
      } catch (err) {
      }
    };

    fetchDocument();
    fetchViewUrl();
    fetchRagStatus();

    intervalId = setInterval(fetchRagStatus, 3000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [id]);

  const handleDownload = async () => {
    try {
      const { data } = await api.get(`/documents/${id}/download`);
      window.open(data.data.url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      alert('Download failed');
    }
  };

  const handleChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const question = chatInput.trim();
    setChatInput('');
    setMessages(prev => [...prev, { role: 'user', content: question }]);
    setChatLoading(true);

    try {
      const { data } = await api.post(`/documents/${id}/chat`, { question });
      setMessages(prev => [...prev, { role: 'assistant', content: data.data.answer }]);
    } catch (err) {
      const msg = err.response?.data?.error?.code === 'RAG_NOT_READY'
        ? 'This document is still being processed. Please check back in a moment.'
        : 'Sorry, an error occurred. Please try again.';
      setMessages(prev => [...prev, { role: 'assistant', content: msg }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout title="Document Viewer" hideWelcome={true}>
        <div className="flex items-center justify-center h-full py-32">
          <Loader2 className="w-12 h-12 animate-spin text-sky-blue" />
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout title="Document Viewer" hideWelcome={true}>
        <div className="flex flex-col items-center justify-center py-32 text-slate-400">
          <AlertCircle className="w-16 h-16 mb-4 opacity-30" />
          <h2 className="text-xl font-bold mb-2">{error}</h2>
          <button onClick={() => navigate(-1)} className="glass-button mt-4 flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
        </div>
      </AppLayout>
    );
  }

  const isPDF = doc?.mimeType === 'application/pdf';
  const isText = doc?.mimeType === 'text/plain';
  const isDocx = doc?.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  return (
    <AppLayout title={doc?.title || doc?.originalFilename || 'Document Viewer'} hideWelcome={true}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between glass rounded-2xl px-5 py-3 mb-5 gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto overflow-hidden">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white/40 rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h2 className="font-bold text-slate-800 text-sm break-words">
              {doc?.title || doc?.originalFilename}
            </h2>
            <p className="text-[10px] text-slate-400">
              {doc?.mimeType?.includes('pdf') ? 'PDF' : doc?.mimeType?.includes('word') ? 'DOCX' : doc?.mimeType?.includes('text') ? 'TXT' : 'FILE'} · {(doc?.sizeBytes / 1024).toFixed(0)} KB
              {doc?.expiresAt && ` · Expires: ${new Date(doc.expiresAt).toLocaleDateString()}`}
              {doc?.accessLevel && (
                <span className={`ml-2 px-2 py-0.5 rounded-full font-bold text-[9px] ${
                  doc.accessLevel === 'Public' ? 'bg-emerald-100 text-emerald-600' :
                  doc.accessLevel === 'HR' ? 'bg-amber-100 text-amber-600' :
                  'bg-slate-100 text-slate-500'
                }`}>{doc.accessLevel}</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
          {isPDF && (
            <>
              {numPages && (
                <div className="flex items-center gap-1 mr-1 sm:mr-3 sm:border-r border-slate-200 pr-1 sm:pr-4">
                  <button
                    onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                    disabled={pageNumber <= 1}
                    className="p-1.5 glass-button disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold text-slate-500 min-w-[3rem] text-center">
                    {pageNumber} / {numPages}
                  </span>
                  <button
                    onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
                    disabled={pageNumber >= numPages}
                    className="p-1.5 glass-button disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              <button
                onClick={() => setScale(s => Math.max(0.5, s - 0.2))}
                className="p-2 glass-button text-slate-600"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-500 w-12 text-center">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={() => setScale(s => Math.min(3, s + 0.2))}
                className="p-2 glass-button text-slate-600"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </>
          )}

          <button
            onClick={() => setIsChatOpen(o => !o)}
            className="glass-button bg-sky-blue text-white flex items-center gap-2 text-sm px-4 py-2"
            title="Ask DocuSense"
          >
            <DocIcon className="w-4 h-4" />
            Ask DocuSense
          </button>

          <button
            onClick={handleDownload}
            className="glass-button flex items-center gap-2 text-sm px-4 py-2"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
      </div>
      <div className="flex flex-col lg:flex-row gap-5 h-auto lg:h-[calc(100vh-240px)] min-h-[calc(100vh-240px)]">
        <div className={`${isChatOpen ? 'flex-[3]' : 'flex-1'} glass rounded-3xl transition-all duration-300 h-[75vh] lg:h-auto min-h-[400px] lg:min-h-0 relative flex flex-col overflow-hidden`}>
          <div ref={containerRef} className="flex-1 overflow-auto custom-scrollbar flex flex-col items-center">
          {isPDF && pdfUrl ? (
            <>
              {pdfLoading && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <Loader2 className="w-10 h-10 animate-spin mb-3 text-sky-blue" />
                  <p className="text-sm">Rendering PDF...</p>
                </div>
              )}
              <Document
                file={pdfUrl}
                onLoadSuccess={({ numPages }) => {
                  setNumPages(numPages);
                  setPdfLoading(false);
                }}
                onLoadError={async () => {
                  setPdfLoading(false);
                  // Refresh the signed URL and retry once before showing error
                  try {
                    const { data } = await api.get(`/documents/${id}/view`);
                    setPdfUrl(data.data.url);
                    setPdfLoading(true);
                  } catch {
                    setError('Failed to load PDF. The link may have expired — try refreshing.');
                  }
                }}
                className="py-6"
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  className="shadow-xl rounded-lg overflow-hidden"
                />
              </Document>
            </>
          ) : isText && pdfUrl ? (
            <TextViewer url={pdfUrl} />
          ) : isDocx && pdfUrl ? (
            <DocxViewer url={pdfUrl} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <FileText className="w-20 h-20 opacity-10 mb-4" />
              <p className="font-medium">Preview not available.</p>
              <button onClick={handleDownload} className="glass-button mt-4 flex items-center gap-2">
                <Download className="w-4 h-4" /> Download File
              </button>
            </div>
          )}
          </div>
          {isPDF && numPages && (
            <div className="w-full bg-white/70 backdrop-blur-sm border-t border-white/40 py-3 flex items-center justify-center gap-4 shrink-0">
              <button
                onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                disabled={pageNumber <= 1}
                className="p-2 glass-button disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-bold text-slate-600">
                Page {pageNumber} of {numPages}
              </span>
              <button
                onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
                disabled={pageNumber >= numPages}
                className="p-2 glass-button disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {isChatOpen && (
          // On mobile: fixed overlay anchored to viewport. On lg: side panel.
          <>
            <div
              className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[59] lg:hidden"
              onClick={() => setIsChatOpen(false)}
            />
            <div className="fixed inset-4 lg:static lg:inset-auto lg:flex-[2] glass rounded-3xl flex flex-col overflow-hidden animate-in slide-in-from-bottom lg:slide-in-from-right duration-300 z-[60] lg:z-auto">
            <div className="p-4 border-b border-white/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-sky-blue rounded-lg flex items-center justify-center">
                  <DocIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">DocuSense</p>
                  <p className="text-[10px] text-slate-400">
                    {ragStatus === 'READY' ? (
                      <span className="text-emerald-500 font-semibold">● Ready</span>
                    ) : ragStatus === 'PROCESSING' ? (
                      <span className="text-amber-500 font-semibold">⟳ Processing...</span>
                    ) : ragStatus === 'FAILED' ? (
                      <span className="text-rose-500 font-semibold">✕ Failed</span>
                    ) : (
                      <span className="text-slate-400">○ Pending</span>
                    )}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="p-1 hover:bg-white/40 rounded-lg cursor-pointer">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-white text-xs font-bold ${msg.role === 'user' ? 'bg-sky-blue' : 'bg-slate-300'}`}>
                    {msg.role === 'user' ? user?.name?.charAt(0) : <DocIconSmall className="w-4 h-4 text-white" />}
                  </div>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-sky-blue text-white rounded-tr-none'
                      : 'bg-white/70 text-slate-800 border border-white/60 rounded-tl-none'
                  }`}>
                    {msg.role === 'user' ? (
                      msg.content
                    ) : (
                      <div className="prose prose-sm prose-slate max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center animate-pulse">
                    <DocIconSmall className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white/70 border border-white/60 rounded-2xl rounded-tl-none p-3 flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin text-sky-blue" />
                    <span className="text-xs text-slate-400 italic">Thinking...</span>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleChat} className="p-4 border-t border-white/20">
              <div className="relative">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder={ragStatus === 'READY' ? 'Ask about this document...' : ragStatus === 'FAILED' ? 'AI processing failed.' : 'AI processing, please wait...'}
                  disabled={ragStatus !== 'READY'}
                  className="w-full glass-input pr-10 text-sm disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || chatLoading || ragStatus !== 'READY'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-sky-blue text-white rounded-lg flex items-center justify-center disabled:opacity-40 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
};

const TextViewer = ({ url }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(url)
      .then(r => r.text())
      .then(t => {
        setText(t);
        setLoading(false);
      })
      .catch(() => {
        setText('Failed to load text content.');
        setLoading(false);
      });
  }, [url]);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-sky-blue" />
    </div>
  );

  return (
    <pre className="w-full p-8 text-sm text-slate-700 font-mono whitespace-pre-wrap leading-relaxed">
      {text}
    </pre>
  );
};

const DocxViewer = ({ url }) => {
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocx = async () => {
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        setHtml(result.value || '<p>Document is empty.</p>');
      } catch (err) {
        setHtml('<p class="text-rose-500">Failed to load DOCX content.</p>');
      } finally {
        setLoading(false);
      }
    };
    fetchDocx();
  }, [url]);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-sky-blue" />
    </div>
  );

  return (
    <div 
      className="w-full p-8 prose prose-slate max-w-none bg-white rounded-xl shadow-sm" 
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default DocumentViewer;
