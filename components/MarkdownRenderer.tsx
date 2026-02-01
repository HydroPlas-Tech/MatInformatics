import React, { useEffect, useRef } from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

declare global {
  interface Window {
    katex: any;
  }
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Split content by lines to handle block elements first
  const lines = content.split('\n');
  
  const renderLatex = (text: string) => {
    if (!window.katex) return text;
    
    // Simple regex for $...$ inline latex
    const parts = text.split(/(\$[^$]+\$)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('$') && part.endsWith('$')) {
        const latex = part.slice(1, -1);
        try {
          const html = window.katex.renderToString(latex, { throwOnError: false });
          return <span key={index} dangerouslySetInnerHTML={{ __html: html }} />;
        } catch (e) {
          return <span key={index} className="text-red-400">{part}</span>;
        }
      }
      return parseInline(part);
    });
  };

  const renderLine = (line: string, index: number) => {
    // Headers
    if (line.startsWith('# ')) {
      return <h3 key={index} className="text-xl font-bold text-white mt-4 mb-2">{renderLatex(line.replace('# ', ''))}</h3>;
    }
    if (line.startsWith('## ')) {
      return <h4 key={index} className="text-lg font-bold text-primary mt-3 mb-2">{renderLatex(line.replace('## ', ''))}</h4>;
    }
    if (line.startsWith('### ')) {
      return <h5 key={index} className="text-base font-bold text-slate-200 mt-2 mb-1">{renderLatex(line.replace('### ', ''))}</h5>;
    }

    // List items
    if (line.trim().startsWith('- ')) {
      return (
        <li key={index} className="ml-4 list-disc text-slate-300 mb-1 pl-1">
          {renderLatex(line.replace('- ', ''))}
        </li>
      );
    }
    
    // Empty lines
    if (line.trim() === '') {
      return <div key={index} className="h-2" />;
    }

    // Paragraphs
    return <p key={index} className="text-slate-300 leading-relaxed mb-2">{renderLatex(line)}</p>;
  };

  const parseInline = (text: string): React.ReactNode => {
    // This is a simplified inline parser. 
    // In a real app, you'd use a unified tokenizer or existing library (react-markdown).
    // For this demo, we assume the input to renderLatex already split latex.
    // So here we just handle Bold, Link, Code.
    
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let keyCounter = 0;

    while (remaining.length > 0) {
      // Bold: **text**
      const boldMatch = remaining.match(/\*\*(.*?)\*\*/);
      // Link: [text](url)
      const linkMatch = remaining.match(/\[(.*?)\]\((.*?)\)/);
      // Code: `text`
      const codeMatch = remaining.match(/`(.*?)`/);

      // Find the earliest match
      const matches = [
        { type: 'bold', match: boldMatch, index: boldMatch?.index ?? Infinity },
        { type: 'link', match: linkMatch, index: linkMatch?.index ?? Infinity },
        { type: 'code', match: codeMatch, index: codeMatch?.index ?? Infinity },
      ].sort((a, b) => a.index - b.index);

      const firstMatch = matches[0];

      if (firstMatch.match && firstMatch.index !== Infinity) {
        // Add text before match
        if (firstMatch.index > 0) {
          parts.push(remaining.substring(0, firstMatch.index));
        }

        const matchString = firstMatch.match[0];
        const innerContent = firstMatch.match[1];
        
        if (firstMatch.type === 'bold') {
          parts.push(<strong key={keyCounter++} className="font-bold text-white">{innerContent}</strong>);
        } else if (firstMatch.type === 'link') {
          const url = firstMatch.match[2];
          parts.push(
            <a key={keyCounter++} href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline hover:text-blue-400 transition-colors">
              {innerContent}
            </a>
          );
        } else if (firstMatch.type === 'code') {
           parts.push(<code key={keyCounter++} className="bg-slate-800 text-emerald-400 px-1.5 py-0.5 rounded text-sm font-mono">{innerContent}</code>);
        }

        remaining = remaining.substring(firstMatch.index + matchString.length);
      } else {
        // No more matches
        parts.push(remaining);
        remaining = '';
      }
    }

    return <>{parts}</>;
  };

  return (
    <div className={`markdown-content ${className}`}>
      {lines.map((line, i) => renderLine(line, i))}
    </div>
  );
};

export default MarkdownRenderer;
