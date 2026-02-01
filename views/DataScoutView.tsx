import React, { useState } from 'react';
import { Artifact, LogMessage } from '../types';
import MarkdownRenderer from '../components/MarkdownRenderer';

interface DataScoutViewProps {
  logs: LogMessage[];
  artifacts: Artifact[];
  isProcessing: boolean;
  onBack: () => void;
}

const DataScoutView: React.FC<DataScoutViewProps> = ({ logs, artifacts, isProcessing, onBack }) => {
  const dataLogs = logs.filter(l => l.role === 'agent' || l.role === 'system');
  const latestData = artifacts.find(a => a.type === 'data');

  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 overflow-hidden relative">
      <main className="flex-1 flex flex-col min-w-0 bg-background-light dark:bg-[#0b0f17] overflow-y-auto relative">
         {/* Header */}
         <div className="px-8 pt-6 pb-6 border-b border-[#232f48]/30 flex items-center gap-4">
             <button onClick={onBack} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors">
                <span className="material-symbols-outlined">arrow_back</span>
             </button>
             <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">Data Gathering Agent</h1>
                <p className="text-slate-400 text-sm">Raw extraction feeds and structured data synthesis.</p>
             </div>
         </div>

         <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-8 px-8 py-8 min-h-[500px]">
             {/* Live Terminal */}
             <div className="flex flex-col rounded-xl border border-[#232f48] bg-[#05070a] overflow-hidden">
                <div className="flex items-center justify-between bg-[#111722] px-4 py-2 border-b border-[#232f48]">
                   <span className="text-xs font-mono text-[#92a4c9] uppercase tracking-widest">Agent Log</span>
                   {isProcessing && <span className="text-xs font-mono text-primary animate-pulse font-bold">ACTIVE</span>}
                </div>
                <div className="flex-1 p-4 font-mono text-sm overflow-y-auto custom-scrollbar leading-relaxed">
                   {dataLogs.map(log => (
                      <div key={log.id} className="mb-2">
                         <span className="text-[#6272a4]">[{new Date(log.timestamp).toLocaleTimeString()}]</span> <span className="text-emerald-400">{log.content}</span>
                      </div>
                   ))}
                </div>
             </div>

             {/* Extracted Data Preview */}
             <div className="flex flex-col rounded-xl border border-[#232f48] bg-[#111722]/40 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#232f48]">
                   <h3 className="font-bold text-white flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">data_object</span>
                      Synthesized Output
                   </h3>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar">
                   {latestData ? (
                      <MarkdownRenderer content={latestData.content} />
                   ) : (
                      <div className="text-center text-[#92a4c9] mt-10">
                         No data synthesized yet.
                      </div>
                   )}
                </div>
             </div>
         </div>
      </main>
    </div>
  );
};

export default DataScoutView;
