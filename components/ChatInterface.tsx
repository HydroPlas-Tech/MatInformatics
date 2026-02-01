import React, { useEffect, useRef } from 'react';
import { LogMessage, AgentRole } from '../types';
import { AGENT_CONFIG } from '../constants';

interface ChatInterfaceProps {
  logs: LogMessage[];
  isProcessing: boolean;
  onSendMessage: (msg: string) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ logs, isProcessing, onSendMessage }) => {
  const [input, setInput] = React.useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isProcessing) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Mission Log</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {logs.length === 0 && (
          <div className="text-center text-slate-500 mt-10">
            <p className="text-sm">Ready to initialize material informatics protocol.</p>
            <p className="text-xs mt-2">Example: "Find high entropy alloys suitable for aerospace engines and generate a python analysis workflow."</p>
          </div>
        )}
        
        {logs.map((log) => {
          const isUser = log.role === 'user';
          const agentConfig = log.agentRole ? AGENT_CONFIG[log.agentRole] : null;

          return (
            <div key={log.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-lg p-3 ${
                isUser 
                  ? 'bg-blue-600/20 border border-blue-500/30 text-blue-100' 
                  : 'bg-slate-800 border border-slate-700 text-slate-200'
              }`}>
                {!isUser && agentConfig && (
                  <div className="flex items-center gap-2 mb-1.5 pb-1.5 border-b border-slate-700/50">
                    <span className={`w-2 h-2 rounded-full ${agentConfig.color}`}></span>
                    <span className="text-xs font-bold text-slate-400 uppercase">{agentConfig.name}</span>
                  </div>
                )}
                <div className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
                  {log.content}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-slate-800 border-t border-slate-700">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isProcessing}
            placeholder={isProcessing ? "System processing..." : "Enter research objective..."}
            className="w-full bg-slate-900 text-white rounded-lg pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-slate-700 disabled:opacity-50 font-mono text-sm"
          />
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="absolute right-2 top-2 p-1.5 text-blue-400 hover:text-white disabled:text-slate-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
