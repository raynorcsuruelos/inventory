import React, { useState } from 'react';
import { 
  X, 
  Users, 
  MessageSquare, 
  Send, 
  Radio, 
  Sparkles, 
  Clock, 
  Tag, 
  Activity,
  Bot
} from 'lucide-react';
import { Collaborator, ItemComment, InventoryItem } from '../types';

interface CollaborationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  collaborators: Collaborator[];
  comments: ItemComment[];
  onAddComment: (partNumber: string, text: string) => void;
  inventory: InventoryItem[];
  selectedPartForComment?: string;
  onSelectPartForComment: (pn: string) => void;
  simulateActivity: boolean;
  onToggleSimulateActivity: () => void;
}

export const CollaborationDrawer: React.FC<CollaborationDrawerProps> = ({
  isOpen,
  onClose,
  collaborators,
  comments,
  onAddComment,
  inventory,
  selectedPartForComment,
  onSelectPartForComment,
  simulateActivity,
  onToggleSimulateActivity,
}) => {
  const [commentText, setCommentText] = useState('');
  const [targetPn, setTargetPn] = useState(selectedPartForComment || (inventory[0]?.partNumber || ''));

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(targetPn || 'General', commentText.trim());
    setCommentText('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col text-slate-900 dark:text-slate-100">
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Real-Time Team Collaboration</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Shared Document Session · Cross-Tab Sync
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {/* Active Collaborators Section */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                Active Wireline Lab Collaborators ({collaborators.length})
              </span>
            </div>

            <div className="space-y-2">
              {collaborators.map((c) => (
                <div 
                  key={c.id} 
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div 
                      className="w-7 h-7 rounded-full text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-xs"
                      style={{ backgroundColor: c.color }}
                    >
                      {c.name.charAt(0)}
                    </div>
                    <div className="truncate">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {c.name}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {c.role}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {c.activePart ? (
                      <span className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
                        {c.activePart}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Idle</span>
                    )}
                    <span className="block text-[9px] text-slate-400 mt-0.5">{c.lastSeen}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Simulation Toggle */}
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-950/40 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-sky-500" />
                <div>
                  <span className="font-medium text-slate-700 dark:text-slate-300 block">
                    Simulate Lab Team Presence
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Shows realistic Wireline tool techs active in session
                  </span>
                </div>
              </div>
              <button
                onClick={onToggleSimulateActivity}
                className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                  simulateActivity ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    simulateActivity ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Collaborative Technical Notes Feed */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-sky-500" />
                Shared Technical Notes ({comments.length})
              </span>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 shadow-xs space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {comment.author}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {comment.partNumber && (
                    <span className="inline-block font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      Part: {comment.partNumber}
                    </span>
                  )}
                  <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                    {comment.text}
                  </p>
                </div>
              ))}
            </div>

            {/* Post Note Form */}
            <form onSubmit={handleSend} className="pt-2 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 font-medium shrink-0">Attach to:</span>
                <select
                  value={targetPn}
                  onChange={(e) => setTargetPn(e.target.value)}
                  className="flex-1 px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                >
                  <option value="General">General / All Parts</option>
                  {inventory.map(i => (
                    <option key={i.partNumber} value={i.partNumber}>
                      {i.partNumber} — {i.description.slice(0, 24)}...
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Leave lab observation or PO reference..."
                  className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white disabled:opacity-40 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* Drawer Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-[11px] text-slate-500 text-center">
          Changes broadcast across connected SharePoint &amp; browser tabs in real-time.
        </div>

      </div>
    </div>
  );
};
