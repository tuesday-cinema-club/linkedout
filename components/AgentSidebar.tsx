import React, { useEffect, useRef } from 'react';
import { AgentAction, AgentRole } from '../types';

interface AgentSidebarProps {
  actions: AgentAction[];
  activeAgent: AgentRole | null;
}

const roleColors: Record<AgentRole, string> = {
  [AgentRole.USER]: 'bg-gray-600',
  [AgentRole.MANAGER]: 'bg-purple-600',
  [AgentRole.RESEARCHER]: 'bg-blue-600',
  [AgentRole.COPYWRITER]: 'bg-yellow-600',
  [AgentRole.DESIGNER]: 'bg-pink-600',
  [AgentRole.PUBLISHER]: 'bg-green-600',
};

export const AgentSidebar: React.FC<AgentSidebarProps> = ({ actions, activeAgent }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to the latest action so the learner does not have to manually scroll.
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [actions]);

  return (
    <div className="w-80 border-r border-stone-800 bg-stone-900 flex flex-col h-full shrink-0">
      <div className="p-4 border-b border-stone-800 bg-stone-950 shrink-0">
        <h2 className="text-sm font-bold uppercase tracking-widest text-stone-400">Agent Flow</h2>
        <div className="mt-2 flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${activeAgent ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
          <span className="text-xs text-stone-300">
            {activeAgent ? `Active: ${activeAgent}` : 'Idle'}
          </span>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {actions.map((action, idx) => (
          <div key={idx} className="relative pl-6 border-l border-stone-700 last:border-0 pb-6">
             {/* Connector dot */}
             <div className={`absolute -left-[3px] top-0 w-1.5 h-1.5 rounded-full ${
                action.status === 'active' ? 'bg-green-400 ring-2 ring-green-400/30' : 
                action.status === 'completed' ? 'bg-stone-500' : 'bg-red-500'
             }`} />
             
             <div className="flex items-center justify-between mb-1">
               <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${roleColors[action.role]} text-white`}>
                 {action.role.toUpperCase()}
               </span>
               <span className="text-[10px] text-stone-500 font-mono">
                 {new Date(action.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
               </span>
             </div>
             
             <p className="text-xs text-stone-300 font-medium leading-relaxed">
               {action.description}
             </p>
             
             {/* Metadata Rendering: Handles Research Sources & API Payloads */}
             {action.metadata && (
               <div className="mt-2 text-[10px] text-stone-500 bg-stone-950 p-3 rounded border border-stone-800 font-mono shadow-inner">
                 
                 {/* 1. Research Sources */}
                 {action.metadata.sources && Array.isArray(action.metadata.sources) && (
                   <div className="mb-2 last:mb-0">
                     <strong className="block text-stone-400 mb-1 uppercase text-[9px] tracking-wider">Sources Found</strong>
                     <ul className="list-disc pl-3 space-y-1">
                       {action.metadata.sources.slice(0, 3).map((s: string, i: number) => (
                         <li key={i} className="truncate max-w-[200px] text-stone-500 hover:text-blue-400 transition-colors">
                           <a href={s} target="_blank" rel="noopener noreferrer" className="cursor-pointer">{s}</a>
                         </li>
                       ))}
                       {action.metadata.sources.length > 3 && (
                         <li className="text-stone-600 italic">+{action.metadata.sources.length - 3} more...</li>
                       )}
                     </ul>
                   </div>
                 )}

                 {/* 2. API Payload Previews */}
                 {action.metadata.payload_preview && (
                   <div className="group">
                     <div className="flex justify-between items-center mb-1">
                        <strong className="block text-green-500 uppercase text-[9px] tracking-wider">API Payload</strong>
                        <span className="text-[9px] text-stone-600 group-hover:text-stone-400 transition-colors">JSON</span>
                     </div>
                     <div className="bg-[#0d0d0d] p-2 rounded overflow-x-auto border border-stone-800/50">
                       <pre className="text-[9px] leading-3 text-stone-400 font-mono">
                         {action.metadata.payload_preview}
                       </pre>
                     </div>
                   </div>
                 )}

               </div>
             )}
          </div>
        ))}
      </div>
    </div>
  );
};
