import React from 'react';
import { AGENT_CONFIG } from '../constants';
import { AgentRole } from '../types';

interface AgentStatusProps {
  role: AgentRole;
  isActive: boolean;
  statusMessage?: string;
}

const AgentStatus: React.FC<AgentStatusProps> = ({ role, isActive, statusMessage }) => {
  const config = AGENT_CONFIG[role];

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-300 ${
      isActive 
        ? 'bg-slate-800 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
        : 'bg-slate-900 border-slate-800 opacity-60'
    }`}>
      <div className={`p-2 rounded-md text-white ${config.color} ${isActive ? 'animate-pulse' : ''}`}>
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-slate-200 text-sm">{config.name}</h4>
        {isActive && statusMessage && (
          <p className="text-xs text-blue-400 truncate animate-pulse">{statusMessage}</p>
        )}
      </div>
      {isActive && (
        <div className="flex space-x-1">
          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      )}
    </div>
  );
};

export default AgentStatus;
