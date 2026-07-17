import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Bot, User, Loader2, Sparkles } from 'lucide-react';
import api from '../services/api';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const ChatBot = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am DocuSense AI. How can I help you with your documents today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await api.post('/documents/query', { question: input });
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I encountered an error while processing your request. Please try again later." }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-4 right-4 w-96 glass rounded-3xl shadow-2xl z-[60] flex flex-col overflow-hidden animate-in slide-in-from-right duration-500">
      <div className="p-6 border-b border-white/20 flex items-center justify-between bg-gradient-to-r from-sky-blue/20 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sky-blue rounded-xl flex items-center justify-center text-white shadow-lg shadow-sky-blue/20">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-slate-800 flex items-center gap-2">
              DocuBot <Sparkles className="w-3 h-3 text-tangerine" />
            </h3>
            <span className="text-xs text-sage font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-sage rounded-full animate-pulse"></span> Online
            </span>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-white/40 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar"
      >
        {messages.map((msg, idx) => (
          <div 
            key={idx}
            className={cn(
              "flex gap-3",
              msg.role === 'user' ? "flex-row-reverse" : "flex-row"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
              msg.role === 'user' ? "bg-tangerine text-white" : "bg-sky-blue text-white"
            )}>
              {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>
            <div className={cn(
              "max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed",
              msg.role === 'user' 
                ? "bg-sky-blue text-white rounded-tr-none" 
                : "bg-white/60 text-slate-800 border border-white/80 rounded-tl-none shadow-sm"
            )}>
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
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-blue text-white flex items-center justify-center shrink-0 animate-pulse">
              <Bot className="w-5 h-5" />
            </div>
            <div className="bg-white/60 p-3 rounded-2xl rounded-tl-none border border-white/80 shadow-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-sky-blue" />
              <span className="text-sm text-slate-500 italic">DocuBot is thinking...</span>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-white/20 bg-white/30">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about policies..."
            className="w-full glass-input pr-12 text-sm py-3"
          />
          <button 
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-sky-blue text-white rounded-lg flex items-center justify-center transition-all hover:bg-sky-blue-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {['Summarize HR Policy', 'Q3 Report Info', 'Vacation Rules'].map(chip => (
            <button
              key={chip}
              type="button"
              onClick={() => setInput(chip)}
              className="text-[10px] px-2 py-1 rounded-full border border-sky-blue/30 text-sky-blue hover:bg-sky-blue/10 transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
};

export default ChatBot;
