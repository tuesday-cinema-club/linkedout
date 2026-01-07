import React, { useEffect, useRef, useState } from 'react';
import { ChatMessage, AgentRole } from '../types';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (msg: string) => void;
  isProcessing: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isProcessing }) => {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Keep the latest assistant reply in view as messages stream in.
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Ignore empty input and block while the agents are still working.
    if (!input.trim() || isProcessing) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-stone-900">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg) => {
          const isUser = msg.role === AgentRole.USER;
          const isInternal = msg.isInternal;

          if (isInternal) {
             // Render internal thoughts differently
             return (
               <div key={msg.id} className="flex justify-center my-4">
                 <span className="text-xs font-mono text-stone-500 bg-stone-950 px-3 py-1 rounded-full border border-stone-800">
                   {msg.role}: {msg.content}
                 </span>
               </div>
             )
          }

          return (
            <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                isUser 
                  ? 'bg-blue-600 text-white rounded-br-none' 
                  : 'bg-stone-800 text-stone-200 rounded-bl-none border border-stone-700'
              }`}>
                {!isUser && <div className="text-xs font-bold mb-1 text-purple-400">{msg.role}</div>}
                <div className="markdown prose prose-invert prose-sm">
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}
        {isProcessing && (
           <div className="flex justify-start">
             <div className="bg-stone-800 text-stone-400 rounded-2xl rounded-bl-none px-5 py-3 border border-stone-700 flex items-center space-x-2">
                <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
             </div>
           </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 border-t border-stone-800 bg-stone-950">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isProcessing}
            placeholder={isProcessing ? "Agents are working..." : "Type your movie topic..."}
            className="flex-1 bg-stone-900 border border-stone-700 text-stone-100 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent disabled:opacity-50"
          />
          <button 
            type="submit" 
            disabled={isProcessing || !input.trim()}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};
