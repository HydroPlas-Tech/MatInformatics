import React from 'react';
import { PlanStep, LogMessage } from '../types';

interface WorkflowPlannerViewProps {
  plan: PlanStep[];
  logs: LogMessage[];
  currentStepId: string | null;
  isProcessing: boolean;
  onStop: () => void;
}

const WorkflowPlannerView: React.FC<WorkflowPlannerViewProps> = ({ plan, logs, currentStepId, isProcessing, onStop }) => {
  const plannerLogs = logs.filter(l => l.role === 'agent' || l.role === 'system');

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-[#0a0f18] text-white font-display">
      {/* Top Bar */}
      <header className="flex items-center justify-between border-b border-[#232f48] bg-background-dark px-8 py-3 z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3 text-white">
            <div className="size-6 bg-primary rounded flex items-center justify-center">
              <span className="material-symbols-outlined text-sm">science</span>
            </div>
            <h2 className="text-lg font-bold tracking-tight">Material Informatics</h2>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="flex items-center bg-[#232f48] rounded-lg px-3 py-1.5 gap-2 border border-[#324467]">
              <span className="material-symbols-outlined text-primary text-lg animate-pulse">bolt</span>
              <span className="text-xs font-semibold uppercase tracking-wider">Planner: Active</span>
           </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 border-r border-[#232f48] bg-background-dark flex flex-col">
           <div className="p-4 border-b border-[#232f48] flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-widest text-[#92a4c9]">Thought Process</h3>
           </div>
           <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {plannerLogs.map(log => (
                <div key={log.id} className="space-y-1 border-l-2 border-primary pl-3 py-1">
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono text-primary">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                   </div>
                   <p className="text-xs text-white/80 leading-relaxed font-mono">{log.content}</p>
                </div>
              ))}
              {isProcessing && (
                <div className="space-y-1 border-l-2 border-primary/30 pl-3 py-1 bg-primary/5 rounded-r-lg">
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono text-primary animate-pulse">THINKING...</span>
                   </div>
                   <div className="flex gap-1 mt-2">
                      <span className="size-1 rounded-full bg-primary animate-bounce"></span>
                      <span className="size-1 rounded-full bg-primary animate-bounce [animation-delay:0.2s]"></span>
                      <span className="size-1 rounded-full bg-primary animate-bounce [animation-delay:0.4s]"></span>
                   </div>
                </div>
              )}
           </div>
        </aside>

        {/* Main Canvas */}
        <main className="flex-1 relative bg-[#0a0f18] overflow-hidden flex items-center justify-center">
            {/* Background Grid */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
            
            {/* Floating Header */}
            <div className="absolute top-8 left-8 z-10">
               <h1 className="text-3xl font-black tracking-tight text-white mb-1">Action Plan Generation</h1>
               <p className="text-[#92a4c9] text-sm flex items-center gap-2">
                  <span className={`flex h-2 w-2 rounded-full ${isProcessing ? 'bg-primary animate-pulse' : 'bg-green-500'}`}></span>
                  {isProcessing ? 'Strategic Agent is mapping out the workflow...' : 'Workflow generated successfully.'}
               </p>
            </div>

            {/* Workflow Visualization */}
            <div className="relative w-full h-full max-w-4xl max-h-[600px] flex items-center justify-center">
                {plan.length === 0 ? (
                  <div className="text-center opacity-50">
                    <span className="material-symbols-outlined text-6xl mb-4 text-[#232f48]">account_tree</span>
                    <p>Waiting for plan generation...</p>
                  </div>
                ) : (
                  <div className="flex gap-8 items-center overflow-x-auto p-10 w-full justify-center">
                     {plan.map((step, idx) => (
                       <div key={step.id} className="relative flex-shrink-0">
                          {idx > 0 && (
                            <div className="absolute top-1/2 -left-8 w-8 h-0.5 bg-primary/30"></div>
                          )}
                          <div className={`w-56 p-4 rounded-xl border-2 transition-all ${
                            currentStepId === step.id 
                              ? 'bg-background-dark border-primary active-node-glow' 
                              : step.status === 'completed'
                                ? 'bg-[#0f1623] border-green-500/50'
                                : 'bg-[#0f1623] border-primary/20 opacity-70'
                          }`}>
                             <div className={`text-[10px] font-bold uppercase mb-1 ${
                               step.status === 'completed' ? 'text-green-500' : 'text-primary'
                             }`}>Step {idx + 1}</div>
                             <div className="text-sm font-bold text-white leading-tight mb-2">{step.assignedAgent}</div>
                             <p className="text-[10px] text-[#92a4c9] leading-snug line-clamp-3">{step.description}</p>
                             
                             {step.status === 'running' && (
                               <div className="mt-3 h-1 w-full bg-[#232f48] rounded-full overflow-hidden">
                                  <div className="h-full bg-primary w-1/2 animate-[width_2s_ease-in-out_infinite]"></div>
                               </div>
                             )}
                          </div>
                       </div>
                     ))}
                  </div>
                )}
            </div>

            {/* Stop Button */}
            {isProcessing && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-background-dark/80 backdrop-blur border border-[#232f48] p-2 rounded-xl shadow-2xl">
                 <button onClick={onStop} className="flex items-center gap-2 px-6 py-3 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-600/20 rounded-lg transition-all">
                    <span className="material-symbols-outlined text-lg">stop</span>
                    <span className="text-xs font-bold uppercase tracking-wider">Stop Planning</span>
                 </button>
              </div>
            )}
        </main>
      </div>
    </div>
  );
};

export default WorkflowPlannerView;