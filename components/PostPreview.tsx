import React, { useState } from 'react';
import { LinkedInDraft } from '../types';

interface PostPreviewProps {
  draft: LinkedInDraft | null;
  isGeneratingImage: boolean;
  onPost?: () => void;
  isPublishing?: boolean;
  publishedUrl?: string | null;
}

// Enhanced markdown parsing
const parseInlineStyles = (text: string) => {
  if (!text) return null;
  // Handle bold (**text**)
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold text-stone-900">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

const renderMarkdown = (text: string) => {
  if (!text) return <p className="text-gray-400 italic">Generating content...</p>;
  
  return text.split('\n').map((line, index) => {
    const trimmed = line.trim();
    
    // H2 Headers
    if (trimmed.startsWith('## ')) {
      return (
        <h2 key={index} className="text-2xl font-bold text-stone-900 mt-8 mb-4 leading-tight font-sans tracking-tight">
          {trimmed.replace(/^##\s*/, '')}
        </h2>
      );
    }

    // H3 Headers
    if (trimmed.startsWith('### ')) {
      return (
        <h3 key={index} className="text-xl font-semibold text-stone-800 mt-6 mb-3 leading-tight font-sans">
          {trimmed.replace(/^###\s*/, '')}
        </h3>
      );
    }
    
    // Blockquotes
    if (trimmed.startsWith('> ')) {
      return (
        <blockquote key={index} className="border-l-4 border-blue-600 pl-4 py-2 my-6 italic text-stone-600 bg-stone-50 text-lg font-serif">
          "{parseInlineStyles(trimmed.replace(/^>\s*/, ''))}"
        </blockquote>
      );
    }
    
    // Bullet points
    if (trimmed.startsWith('- ')) {
      return (
        <div key={index} className="flex items-start ml-4 mb-3">
          <span className="mr-3 text-blue-500 mt-1.5 text-xs">●</span>
          <span className="text-stone-800 text-lg leading-relaxed font-serif">{parseInlineStyles(trimmed.replace(/^-\s*/, ''))}</span>
        </div>
      );
    }
    
    // Empty lines
    if (!trimmed) {
      return <div key={index} className="h-4" />;
    }
    
    // Standard Paragraphs
    return (
      <p key={index} className="text-lg text-stone-800 leading-relaxed mb-4 font-serif">
        {parseInlineStyles(line)}
      </p>
    );
  });
};

export const PostPreview: React.FC<PostPreviewProps> = ({ draft, isGeneratingImage, onPost, isPublishing, publishedUrl }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyContent = () => {
    if (!draft) return;
    // Give the user a one-click way to reuse the generated long-form article.
    const content = `
${draft.headline}

${draft.body}

${(draft.hashtags || []).map(t => t.startsWith('#') ? t : `#${t}`).join(' ')}
    `.trim();
    
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!draft) {
    return (
      <div className="h-full flex items-center justify-center text-stone-600 p-8 text-center border-dashed border-2 border-stone-800 rounded-xl m-4 bg-stone-900/50">
        <div>
          <span className="text-4xl block mb-4 opacity-30">📝</span>
          <p className="text-sm font-medium">No content yet.<br/>Start the agent to build a draft.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white text-black rounded-xl overflow-hidden shadow-2xl max-w-md w-full mx-auto my-8 border border-stone-200 flex flex-col font-sans h-[90%] relative">
      
      {/* Article Header / User Info */}
      <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-white z-10 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center text-white font-bold text-xs shadow-sm ring-2 ring-stone-100">
            AI
          </div>
          <div>
            <div className="font-bold text-sm text-stone-900">Movie Buff Agent</div>
            <div className="text-xs text-stone-500">Suggested Article • Draft</div>
          </div>
        </div>
        <button 
          onClick={handleCopyContent}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium px-3 py-1 rounded bg-blue-50 hover:bg-blue-100 transition-colors"
        >
          {copied ? '✓ Copied' : 'Copy Text'}
        </button>
      </div>

      {/* Content Scroll Area */}
      <div className="flex-1 overflow-y-auto bg-white scrollbar-thin scrollbar-thumb-stone-300 scrollbar-track-transparent">
        
        {/* Image Area */}
        <div className="w-full relative group">
          <div className="aspect-[16/9] w-full bg-stone-100 relative overflow-hidden flex items-center justify-center">
            {isGeneratingImage ? (
              <div className="flex flex-col items-center animate-pulse">
                <div className="w-10 h-10 border-4 border-stone-300 border-t-blue-500 rounded-full animate-spin mb-3"/>
                <span className="text-xs text-stone-500 font-medium tracking-wide uppercase">Designing Cover...</span>
              </div>
            ) : draft.imageUrl ? (
              <img src={draft.imageUrl} alt="Article Cover" className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
            ) : (
              <div className="text-stone-400 flex flex-col items-center">
                <span className="text-3xl mb-2">🖼️</span>
                <span className="text-xs font-mono">Image Pending</span>
              </div>
            )}
          </div>
          {draft.imageUrl && (
            <a 
              href={draft.imageUrl} 
              download="cover-image.png"
              className="absolute bottom-3 right-3 bg-black/70 hover:bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
              target="_blank"
              rel="noreferrer"
            >
              Download Image
            </a>
          )}
        </div>

        {/* Article Body */}
        <div className="p-8 max-w-2xl mx-auto">
          <h1 className="text-3xl font-extrabold text-stone-900 mb-6 leading-tight font-serif tracking-tight border-b pb-6 border-stone-100">
            {draft.headline || "Untitled Draft"}
          </h1>
          
          <div className="text-stone-700 min-h-[200px]">
            {renderMarkdown(draft.body)}
          </div>
          
          <div className="mt-8 pt-6 border-t border-stone-100">
            <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Keywords</h4>
            <div className="flex flex-wrap gap-2">
              {(draft.hashtags || []).map((tag, i) => (
                <span key={i} className="text-blue-600 bg-blue-50 px-2 py-1 rounded text-sm font-medium hover:bg-blue-100 cursor-pointer transition-colors">
                  {tag.startsWith('#') ? tag : `#${tag}`}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 bg-stone-50 border-t border-stone-200 shrink-0">
        {publishedUrl ? (
           <div className="space-y-3">
             <div className="flex items-center justify-center space-x-2 text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                <span className="font-bold text-sm">Simulation Successful</span>
             </div>
             
             <button 
               onClick={() => {
                 handleCopyContent();
                 window.open("https://www.linkedin.com/article/new/", "_blank");
               }}
               className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold shadow-sm transition-all flex items-center justify-center gap-2 text-sm"
             >
               <span>↗️</span> Open LinkedIn Editor & Paste
             </button>
             <p className="text-[10px] text-center text-stone-500">
               Content copied to clipboard. Paste into the editor.
             </p>
           </div>
        ) : (
          <div className="space-y-2">
            <button 
              onClick={onPost}
              disabled={isPublishing || isGeneratingImage || !draft.body}
              className={`
                w-full bg-stone-900 hover:bg-stone-800 text-white px-6 py-4 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-3
                ${isPublishing ? 'opacity-80 cursor-wait' : ''}
                ${(isGeneratingImage || !draft.body) ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {isPublishing ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="font-mono text-sm">PUBLISHER_AGENT.EXECUTE()...</span>
                </>
              ) : (
                <>
                  <span>🚀</span> 
                  <span className="font-medium">Publish via Agent</span>
                </>
              )}
            </button>
            <div className="flex justify-center">
              <span className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold">
                Waiting for Approval
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
