import React, { useState } from 'react';
import { Artifact } from '../types';
import MarkdownRenderer from '../components/MarkdownRenderer';

interface DashboardViewProps {
  onStartWorkflow: (prompt: string) => void;
  isProcessing: boolean;
  artifacts: Artifact[];
  onViewDetails: (type: 'DATA' | 'DEVOPS' | 'REPORT') => void;
  executionOutput?: string;
}

const DashboardView: React.FC<DashboardViewProps> = ({ onStartWorkflow, isProcessing, artifacts, onViewDetails, executionOutput }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onStartWorkflow(input);
    }
  };

  const handleDownload = (artifact: Artifact) => {
    const blob = new Blob([artifact.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Determine extension based on type
    let extension = 'txt';
    if (artifact.type === 'code') extension = 'py';
    if (artifact.type === 'data') extension = 'txt'; // or csv/json if formatted
    if (artifact.type === 'doc') extension = 'md';
    
    a.download = `${artifact.title.replace(/\s+/g, '_').toLowerCase()}.${extension}`; 
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportData = () => {
    let content = "";
    
    // Combine ArXiv data + Execution Data
    const dataArtifact = artifacts.find(a => a.type === 'data');
    if (dataArtifact) {
        content += "--- Research Data ---\n" + dataArtifact.content + "\n\n";
    }

    if (executionOutput) {
        content += "--- Simulation Output ---\n" + executionOutput + "\n\n";
    }

    // Try to create a CSV if possible, otherwise text
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `experiment_results.csv`; // It might be unstructured but useful
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getReferences = (): { title: string; url: string }[] => {
    const dataArtifact = artifacts.find(a => a.type === 'data');
    if (!dataArtifact) return [];
    
    const refs: { title: string; url: string }[] = [];
    const lines = dataArtifact.content.split('\n');
    let currentTitle = "";
    
    lines.forEach(line => {
      if (line.startsWith("Title:")) {
        currentTitle = line.replace("Title:", "").trim();
      } else if (line.startsWith("PDF Link:")) {
        const url = line.replace("PDF Link:", "").trim();
        if (currentTitle && url) {
          refs.push({ title: currentTitle, url });
          currentTitle = "";
        }
      } else if (line.includes("http") && !line.startsWith("PDF Link:")) {
         const match = line.match(/(https?:\/\/[^\s]+)/);
         if (match) {
             refs.push({ title: "Source", url: match[0] });
         }
      }
    });
    return refs;
  };

  const references = getReferences();

  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-200 dark:border-slate-800 flex flex-col h-screen bg-white dark:bg-background-dark shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="size-10 bg-primary rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined font-bold">science</span>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">MAT-INF</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-medium">v2.5.0-rc</p>
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-1 mt-4">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary transition-colors text-left">
            <span className="material-symbols-outlined text-[20px] fill-1">dashboard</span>
            <span className="text-sm font-medium">Launchpad</span>
          </button>
          <button onClick={() => onViewDetails('DATA')} disabled={!artifacts.length} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50 text-left">
            <span className="material-symbols-outlined text-[20px]">database</span>
            <span className="text-sm font-medium">Data Scout</span>
          </button>
          <button onClick={() => onViewDetails('DEVOPS')} disabled={!artifacts.length} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50 text-left">
            <span className="material-symbols-outlined text-[20px]">terminal</span>
            <span className="text-sm font-medium">DevOps</span>
          </button>
          <button onClick={() => onViewDetails('REPORT')} disabled={!artifacts.length} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50 text-left">
            <span className="material-symbols-outlined text-[20px]">description</span>
            <span className="text-sm font-medium">Reports</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark relative">
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between sticky top-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Status</span>
              <span className="text-sm font-medium">{isProcessing ? 'Workflow Executing...' : 'System Idle'}</span>
            </div>
            <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800"></div>
            <div className="flex items-center gap-2">
              <span className={`flex h-2 w-2 rounded-full ${isProcessing ? 'bg-primary animate-pulse' : 'bg-emerald-500'}`}></span>
              <span className="text-xs font-medium text-slate-500">{isProcessing ? 'Agents Active' : 'Online'}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="size-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">AT</div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto p-8 space-y-8">
          {/* Hero / Launchpad Section */}
          <section className="text-center py-6">
            <h1 className="text-white tracking-tight text-[32px] font-bold leading-tight pb-3">Material Informatics Workspace</h1>
            <p className="text-slate-400 max-w-xl mx-auto mb-8">Orchestrate your multi-agent materials research workflow with natural language.</p>
            <div className="max-w-3xl mx-auto relative command-glow transition-all rounded-xl z-20">
              <form onSubmit={handleSubmit} className="flex items-center bg-white dark:bg-[#192233] border border-slate-200 dark:border-[#324467] rounded-xl overflow-hidden p-2 shadow-2xl">
                <span className="material-symbols-outlined text-slate-400 px-3">terminal</span>
                <input 
                  className="flex-1 bg-transparent border-0 focus:ring-0 text-slate-900 dark:text-white placeholder:text-slate-500 py-4 text-lg" 
                  placeholder="Describe your research goal (e.g. 'Analyze superconductors...')" 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isProcessing}
                />
                <div className="flex items-center gap-2 pr-2">
                  <button type="submit" disabled={!input.trim() || isProcessing} className="size-10 bg-primary rounded-lg flex items-center justify-center text-white disabled:opacity-50 hover:bg-blue-600 transition-colors">
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </div>
              </form>
            </div>
          </section>

          {/* Results Preview Section (Visible when artifacts exist) */}
          {artifacts.length > 0 && (
            <div className="space-y-8 animate-fade-in-up">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                 <h2 className="text-2xl font-bold text-white">Experiment Results</h2>
                 <div className="flex gap-2">
                    {(executionOutput || artifacts.some(a=>a.type==='data')) && (
                        <button onClick={handleExportData} className="px-4 py-2 bg-emerald-600/10 text-emerald-500 hover:bg-emerald-600/20 rounded-lg text-sm font-bold transition-colors flex items-center gap-2">
                             <span className="material-symbols-outlined text-sm">table_view</span> Export Data (CSV)
                        </button>
                    )}
                    <button onClick={() => onViewDetails('REPORT')} className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-sm font-bold transition-colors">
                       View Full Report
                    </button>
                 </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {/* Main Findings (Doc/Analysis) */}
                 <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[#161b22] border border-slate-800 rounded-xl p-6">
                       <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary">summarize</span>
                          Executive Summary
                       </h3>
                       <div className="prose prose-invert prose-sm max-w-none">
                          <MarkdownRenderer content={artifacts.find(a => a.type === 'doc')?.content || artifacts.find(a => a.type === 'analysis')?.content || "Processing..."} />
                       </div>
                    </div>
                    
                    {/* References */}
                    {references.length > 0 && (
                      <div className="bg-[#161b22] border border-slate-800 rounded-xl p-6">
                         <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-emerald-500">link</span>
                            References & Sources
                         </h3>
                         <ul className="space-y-2">
                            {references.map((ref, idx) => (
                               <li key={idx} className="flex items-start gap-2 text-sm">
                                  <span className="material-symbols-outlined text-slate-600 text-[16px] mt-0.5">arrow_outward</span>
                                  <a href={ref.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">{ref.title || ref.url}</a>
                               </li>
                            ))}
                         </ul>
                      </div>
                    )}
                 </div>

                 {/* Data Verification & Files */}
                 <div className="space-y-6">
                    <div className="bg-[#161b22] border border-slate-800 rounded-xl p-6">
                       <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                          <span className="material-symbols-outlined text-amber-500">folder_zip</span>
                          Data Verification
                       </h3>
                       <p className="text-slate-400 text-xs mb-4">Generated artifacts available for audit.</p>
                       <div className="space-y-3">
                          {artifacts.map((art, idx) => (
                             <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-800 group hover:border-slate-700 transition-colors">
                                <div className="flex items-center gap-3">
                                   <div className={`size-8 rounded flex items-center justify-center text-white font-bold text-xs uppercase
                                      ${art.type === 'code' ? 'bg-blue-600' : art.type === 'data' ? 'bg-emerald-600' : 'bg-slate-600'}
                                   `}>
                                      {art.type.substring(0, 3)}
                                   </div>
                                   <div className="flex flex-col">
                                      <span className="text-sm font-medium text-slate-200">{art.title}</span>
                                      <span className="text-[10px] text-slate-500 uppercase">{art.type} Artifact</span>
                                   </div>
                                </div>
                                <button onClick={() => handleDownload(art)} className="p-2 text-slate-500 hover:text-white transition-colors" title="Download">
                                   <span className="material-symbols-outlined text-lg">download</span>
                                </button>
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          )}

           {/* Empty State */}
           {!isProcessing && artifacts.length === 0 && (
              <div className="glass-panel rounded-xl border border-slate-200 dark:border-white/5 p-12 text-center">
                 <div className="inline-flex p-4 rounded-full bg-slate-800/50 mb-4 text-slate-500">
                    <span className="material-symbols-outlined text-4xl">science</span>
                 </div>
                 <h3 className="text-xl font-bold text-white mb-2">Ready for Discovery</h3>
                 <p className="text-slate-500 max-w-md mx-auto">Start a new session to activate the multi-agent swarm. Your results, data, and code will appear here.</p>
              </div>
           )}
        </div>
      </main>
    </div>
  );
};

export default DashboardView;