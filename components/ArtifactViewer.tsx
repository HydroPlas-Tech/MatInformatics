import React from 'react';
import { Artifact } from '../types';

interface ArtifactViewerProps {
  artifacts: Artifact[];
}

const ArtifactViewer: React.FC<ArtifactViewerProps> = ({ artifacts }) => {
  const [activeTab, setActiveTab] = React.useState<number>(0);

  if (artifacts.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-900/50 rounded-xl border border-slate-800 text-slate-500">
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-sm font-mono">No artifacts generated yet.</p>
        </div>
      </div>
    );
  }

  const currentArtifact = artifacts[activeTab];

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-800 bg-slate-950/30 no-scrollbar">
        {artifacts.map((art, idx) => (
          <button
            key={idx}
            onClick={() => setActiveTab(idx)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === idx
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {art.title}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 bg-slate-950">
        <div className="prose prose-invert max-w-none">
          {currentArtifact.type === 'code' || currentArtifact.type === 'env' ? (
             <pre className="rounded-lg bg-slate-900 p-4 border border-slate-800 overflow-x-auto">
               <code className="text-sm font-mono text-emerald-300">
                 {currentArtifact.content}
               </code>
             </pre>
          ) : (
            // Simple markdown rendering approximation for demo
            <div className="text-slate-300 whitespace-pre-wrap font-sans leading-7">
               {currentArtifact.content.split('\n').map((line, i) => {
                 if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold text-white mb-4 mt-2">{line.replace('# ', '')}</h1>
                 if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold text-white mb-3 mt-4">{line.replace('## ', '')}</h2>
                 if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-bold text-white mb-2 mt-3">{line.replace('### ', '')}</h3>
                 if (line.startsWith('- ')) return <li key={i} className="ml-4 list-disc">{line.replace('- ', '')}</li>
                 return <p key={i} className="mb-2">{line}</p>
               })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArtifactViewer;
