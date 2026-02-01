import React, { useState, useEffect } from 'react';
import { Artifact } from '../types';
import { runPythonCode, initPyodide, isPyodideReady } from '../services/pythonService';

interface DevOpsViewProps {
  artifacts: Artifact[];
  isProcessing: boolean;
  onBack: () => void;
  onExecutionComplete?: (output: string) => void;
  externalOutput?: string;
}

const DevOpsView: React.FC<DevOpsViewProps> = ({ artifacts, isProcessing, onBack, onExecutionComplete, externalOutput }) => {
  const envArtifact = artifacts.find(a => a.type === 'env');
  const codeArtifact = artifacts.find(a => a.type === 'code');
  const [activeTab, setActiveTab] = React.useState<'env' | 'code' | 'term'>('env');
  const [terminalOutput, setTerminalOutput] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [pyodideLoaded, setPyodideLoaded] = useState(false);

  useEffect(() => {
    if (codeArtifact) setActiveTab('code');
    initPyodide().then(() => setPyodideLoaded(true));
  }, [codeArtifact]);

  // Sync external output if provided (e.g. from auto-execution)
  useEffect(() => {
      if (externalOutput) {
          setTerminalOutput(externalOutput);
      }
  }, [externalOutput]);

  const handleRunCode = async () => {
    if (!codeArtifact?.content) return;
    
    setIsRunning(true);
    setActiveTab('term');
    setTerminalOutput(prev => prev + "\n\n--- Manual Execution ---\nRunning script...\n");
    
    const { output, error } = await runPythonCode(codeArtifact.content);
    
    const finalOutput = output + (error ? `\n\n[STDERR]\n${error}` : "");
    setTerminalOutput(prev => prev + finalOutput + "\n-------------------\nProcess Finished.");
    setIsRunning(false);

    if (onExecutionComplete) {
      onExecutionComplete(finalOutput);
    }
  };

  const handleExportPy = () => {
    if (!codeArtifact) return;
    const blob = new Blob([codeArtifact.content], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'experiment_script.py';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 overflow-hidden">
      <aside className="w-64 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-background-light dark:bg-background-dark">
        <div className="p-6 flex flex-col h-full">
           <div className="flex items-center gap-2 mb-8">
             <button onClick={onBack} className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"><span className="material-symbols-outlined">arrow_back</span></button>
             <h1 className="text-primary text-xl font-bold tracking-tight">DevOps Module</h1>
           </div>
           <nav className="flex-1 space-y-2">
              <div className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${activeTab === 'env' ? 'bg-primary text-white' : 'text-slate-400 hover:bg-slate-800'}`} onClick={() => setActiveTab('env')}>
                 <span className="material-symbols-outlined">terminal</span>
                 <p className="text-sm font-medium">Environment</p>
              </div>
              <div className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${activeTab === 'code' ? 'bg-primary text-white' : 'text-slate-400 hover:bg-slate-800'}`} onClick={() => setActiveTab('code')}>
                 <span className="material-symbols-outlined">code</span>
                 <p className="text-sm font-medium">Code Gen</p>
              </div>
              <div className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${activeTab === 'term' ? 'bg-primary text-white' : 'text-slate-400 hover:bg-slate-800'}`} onClick={() => setActiveTab('term')}>
                 <span className="material-symbols-outlined">dvr</span>
                 <p className="text-sm font-medium">Console Output</p>
              </div>
           </nav>
           <div className="mt-auto space-y-3">
             <button 
                onClick={handleExportPy}
                disabled={!codeArtifact}
                className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded-lg border border-slate-700"
             >
                <span className="material-symbols-outlined text-sm">download</span>
                <span className="text-xs font-bold uppercase tracking-wider">Export .py</span>
             </button>
             <button 
                onClick={handleRunCode}
                disabled={!codeArtifact || isRunning || !pyodideLoaded}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-bold shadow-lg shadow-emerald-900/20"
             >
                {isRunning ? (
                   <span className="material-symbols-outlined animate-spin">sync</span>
                ) : (
                   <span className="material-symbols-outlined">play_arrow</span>
                )}
                {isRunning ? 'Running...' : 'Run Experiment'}
             </button>
             {!pyodideLoaded && <p className="text-[10px] text-slate-500 text-center mt-2">Loading Python Engine...</p>}
           </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-background-dark/50">
         <header className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 bg-white dark:bg-background-dark">
            <h2 className="text-xl font-bold text-white">
              {activeTab === 'env' ? 'Environment Configuration' : activeTab === 'code' ? 'Simulation Code' : 'Execution Terminal'}
            </h2>
            {isProcessing && <span className="text-xs font-bold text-primary animate-pulse">GENERATING...</span>}
         </header>

         <div className="flex-1 p-8 overflow-hidden">
            <div className="h-full flex flex-col rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-[#0d1117] shadow-2xl">
               <div className="flex-1 p-6 font-mono text-sm overflow-y-auto">
                  <pre className="text-slate-300 whitespace-pre-wrap">
                     {activeTab === 'env' && (envArtifact?.content || '# No environment config found.')}
                     {activeTab === 'code' && (codeArtifact?.content || '# No code generated.')}
                     {activeTab === 'term' && (terminalOutput || '# Waiting for execution...')}
                  </pre>
               </div>
            </div>
         </div>
      </main>
    </div>
  );
};

export default DevOpsView;