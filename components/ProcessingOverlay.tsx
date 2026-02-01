import React from 'react';
import { PlanStep, LogMessage, AgentRole } from '../types';
import { AGENT_CONFIG } from '../constants';

interface ProcessingOverlayProps {
  currentStep: PlanStep | undefined;
  logs: LogMessage[];
  isVisible: boolean;
  onStop: () => void;
}

const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({ currentStep, logs, isVisible, onStop }) => {
  if (!isVisible) return null;

  const activeAgent = currentStep ? AGENT_CONFIG[currentStep.assignedAgent] : null;
  const recentLogs = logs.slice(-3); // Show last 3 logs

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background-dark/80 backdrop-blur-sm transition-opacity duration-300">
      <div className="w-full max-w-2xl bg-[#101622] border border-primary/30 rounded-2xl shadow-[0_0_50px_rgba(19,91,236,0.15)] overflow-hidden flex flex-col relative">
        {/* Animated Background Gradient */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-[shimmer_2s_infinite]"></div>
        
        <div className="p-8 flex flex-col items-center text-center z-10">
          {/* Agent Icon with Pulse */}
          <div className="relative mb-6">
            <div className={`size-20 rounded-2xl flex items-center justify-center text-white shadow-xl ${activeAgent ? activeAgent.color : 'bg-slate-700'}`}>
              {activeAgent ? (
                <div className="transform scale-150">{activeAgent.icon}</div>
              ) : (
                <span className="material-symbols-outlined text-4xl animate-spin">sync</span>
              )}
            </div>
            <div className="absolute -inset-2 rounded-2xl border border-primary/30 animate-ping opacity-20"></div>
            <div className="absolute -inset-4 rounded-3xl border border-primary/10 animate-pulse opacity-20"></div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
            {activeAgent ? activeAgent.name : 'System'} is working...
          </h2>
          <p className="text-slate-400 text-sm max-w-md mb-8">
            {currentStep ? currentStep.description : 'Initializing workflow protocols...'}
          </p>

          {/* Log Stream */}
          <div className="w-full bg-[#0a0f18] rounded-xl border border-slate-800 p-4 font-mono text-xs text-left h-32 overflow-hidden flex flex-col justify-end relative">
             <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-[#0a0f18] to-transparent pointer-events-none"></div>
             {recentLogs.map((log) => (
               <div key={log.id} className="mb-1.5 last:mb-0 animate-fade-in-up">
                 <span className="text-slate-500">[{new Date(log.timestamp).toLocaleTimeString([], {hour12: false, hour: "2-digit", minute:"2-digit", second:"2-digit"})}]</span>{' '}
                 <span className={`${log.role === 'agent' ? 'text-primary' : 'text-emerald-400'}`}>
                   {log.agentRole && `[${AGENT_CONFIG[log.agentRole].name}] `}
                 </span>
                 <span className="text-slate-300">{log.content.substring(0, 80)}{log.content.length > 80 ? '...' : ''}</span>
               </div>
             ))}
             {recentLogs.length === 0 && <span className="text-slate-600 italic">Waiting for agent logs...</span>}
          </div>
        </div>

        {/* Footer Progress Bar & Stop Button */}
        <div className="bg-[#192233] px-6 py-3 border-t border-slate-800 flex justify-between items-center">
           <div className="flex items-center gap-3">
             <span className="text-xs font-bold text-primary uppercase tracking-widest animate-pulse">Processing Step</span>
             <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.15s]"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.3s]"></div>
             </div>
           </div>
           
           <button 
             onClick={onStop}
             className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all text-xs font-bold uppercase tracking-wider"
           >
             <span className="material-symbols-outlined text-sm">stop_circle</span> Stop
           </button>
        </div>
      </div>
    </div>
  );
};

export default ProcessingOverlay;