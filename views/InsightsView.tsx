import React, { useRef, useState } from 'react';
import { Artifact } from '../types';
import MarkdownRenderer from '../components/MarkdownRenderer';

interface InsightsViewProps {
  artifacts: Artifact[];
  onExport?: () => void;
  onBack: () => void;
}

const InsightsView: React.FC<InsightsViewProps> = ({ artifacts, onExport, onBack }) => {
  const docArtifact = artifacts.find(a => a.type === 'doc');
  const analysisArtifact = artifacts.find(a => a.type === 'analysis');
  const codeArtifact = artifacts.find(a => a.type === 'code');
  const reportContainerRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportDocx = async () => {
    if (!reportContainerRef.current || isExporting) return;
    setIsExporting(true);

    try {
      const content = reportContainerRef.current.innerHTML;
      
      const preHtml = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' 
              xmlns:w='urn:schemas-microsoft-com:office:word' 
              xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>Material Informatics Report</title>
          <style>
            body { font-family: 'Arial', sans-serif; font-size: 11pt; line-height: 1.5; color: #000; }
            h1 { font-size: 24pt; color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; margin-bottom: 20px; }
            h2 { font-size: 18pt; color: #1e40af; margin-top: 20px; margin-bottom: 10px; }
            h3 { font-size: 14pt; color: #2563eb; margin-top: 15px; margin-bottom: 10px; }
            p { margin-bottom: 10px; text-align: justify; }
            pre { background-color: #f1f5f9; padding: 10px; border: 1px solid #e2e8f0; font-family: 'Courier New', monospace; font-size: 9pt; white-space: pre-wrap; }
            code { background-color: #f1f5f9; font-family: 'Courier New', monospace; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
            th { background-color: #f8fafc; font-weight: bold; }
            a { color: #2563eb; text-decoration: underline; }
            .appendix { margin-top: 40px; border-top: 3px double #94a3b8; padding-top: 20px; }
          </style>
        </head>
        <body>
      `;
      const postHtml = "</body></html>";
      const html = preHtml + content + postHtml;

      const blob = new Blob(['\ufeff', html], {
          type: 'application/msword'
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      // Using .doc ensures Word opens it correctly as MHTML/HTML format.
      // .docx requires XML compression which is brittle in simple JS.
      link.download = 'Material_Informatics_Report.doc'; 
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export document.");
    } finally {
      setIsExporting(false);
      if (onExport) onExport();
    }
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white">
       <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-[#232f48] px-6 py-3 bg-white dark:bg-background-dark shrink-0">
          <div className="flex items-center gap-4">
             <button onClick={onBack} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors">
                <span className="material-symbols-outlined">arrow_back</span>
             </button>
             <h2 className="text-lg font-bold">Analysis & Documentation</h2>
          </div>
          <button 
            onClick={handleExportDocx} 
            disabled={isExporting || !docArtifact}
            className="flex min-w-[140px] cursor-pointer items-center justify-center rounded-lg h-9 px-4 bg-primary text-white text-xs font-bold uppercase tracking-wider transition-all hover:bg-blue-700 disabled:opacity-50 disabled:cursor-wait"
          >
             {isExporting ? (
                 <span className="material-symbols-outlined text-sm animate-spin mr-2">sync</span>
             ) : (
                 <span className="material-symbols-outlined text-sm mr-2">description</span>
             )}
             {isExporting ? 'Exporting...' : 'Export to Word'}
          </button>
       </header>

       <main className="flex flex-1 overflow-hidden bg-slate-50 dark:bg-background-dark">
          {/* Analysis */}
          <section className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
             <h2 className="text-lg font-bold text-white mb-2">Analytical Insights</h2>
             {analysisArtifact ? (
                <div className="bg-[#161f2e] border border-[#324467] p-6 rounded-xl">
                   <MarkdownRenderer content={analysisArtifact.content} />
                </div>
             ) : (
                <p className="text-slate-500">No analysis available.</p>
             )}
          </section>

          {/* Documentation (Target for Export) */}
          <section 
            className="w-[45%] border-l border-slate-200 dark:border-[#232f48] bg-white dark:bg-[#0c121d] overflow-y-auto custom-scrollbar p-10"
          >
             <div ref={reportContainerRef}>
                <div className="mb-6 border-b border-slate-800 pb-2 flex justify-between items-end">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Generated Documentation</h1>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest no-print">Confidential</span>
                </div>
                
                {docArtifact ? (
                    <div className="prose prose-invert max-w-none text-slate-800 dark:text-slate-300">
                        <MarkdownRenderer content={docArtifact.content} />
                    </div>
                ) : (
                    <p className="text-center text-slate-500 mt-20">No documentation generated.</p>
                )}

                {/* Appendix: Source Code */}
                {codeArtifact && (
                    <div className="appendix mt-12 pt-8 border-t-2 border-slate-800/50">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Appendix: Experimental Source Code</h2>
                        <pre className="bg-slate-100 dark:bg-[#0f1623] p-4 rounded-lg overflow-x-auto border border-slate-200 dark:border-slate-800">
                            <code className="text-xs font-mono text-slate-700 dark:text-emerald-400">
                                {codeArtifact.content}
                            </code>
                        </pre>
                    </div>
                )}
                
                <div className="mt-12 pt-4 border-t border-slate-800 text-center text-slate-600 text-xs hidden print:block">
                    Generated by MatInformatics AI
                </div>
             </div>
          </section>
       </main>
    </div>
  );
};

export default InsightsView;