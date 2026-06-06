import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { collection, query, orderBy, limit, addDoc, serverTimestamp, onSnapshot, deleteDoc, doc, getDocs, where, writeBatch } from "firebase/firestore";
import { db } from "../firebase";
import { MessageCircle, X, Send, Trash2, Settings, AlertTriangle } from "lucide-react";

export function LiveChat() {
  const { user, profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const isAdmin = profile?.role === 'admin';
  const [showModTools, setShowModTools] = useState(false);

  useEffect(() => {
    // Only fetch messages if chat is open to save reads, or always fetch?
    // Let's always fetch so there's no delay when opening, or just fetch when open.
    // The prompt says real-time Firestore sync. Let's do it always or when open.
    // If it's a floating chat, probably better when open or always.
    const q = query(collection(db, "chat_messages"), orderBy("timestamp", "asc"), limit(50));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const messageText = newMessage.trim();
    setNewMessage("");

    try {
      await addDoc(collection(db, "chat_messages"), {
        text: messageText,
        userId: user.uid,
        displayName: profile?.displayName || user.email?.split('@')[0] || "Anonymous Bettor",
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!isAdmin) return;
    try {
      await deleteDoc(doc(db, "chat_messages", messageId));
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const handleBulkPurge = async (timeframe: '1min' | '1hour' | 'all') => {
    if (!isAdmin) return;
    try {
      const batch = writeBatch(db);
      
      if (timeframe === 'all') {
        const querySnapshot = await getDocs(collection(db, "chat_messages"));
        querySnapshot.forEach((document) => {
          batch.delete(document.ref);
        });
      } else {
        const timeLimit = new Date();
        if (timeframe === '1min') timeLimit.setMinutes(timeLimit.getMinutes() - 1);
        if (timeframe === '1hour') timeLimit.setHours(timeLimit.getHours() - 1);
        
        const q = query(collection(db, "chat_messages"), where("timestamp", ">=", timeLimit));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((document) => {
          batch.delete(document.ref);
        });
      }
      
      await batch.commit();
      setShowModTools(false);
    } catch (error) {
      console.error("Error purging messages:", error);
    }
  };

  const formatTime = (ts: any) => {
    if (!ts) return "";
    const date = ts.toDate();
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 w-14 h-14 bg-[#c1ff00] text-black rounded-full shadow-[0_4px_20px_rgba(193,255,0,0.3)] flex items-center justify-center hover:bg-[#c1ff00]/80 transition-all cursor-pointer"
        title="Live Chat"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-4 z-50 w-80 h-96 bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-zinc-900 border-b border-zinc-800 p-4 shrink-0 flex items-center justify-between">
            <h3 className="font-bold text-white uppercase italic tracking-widest text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#c1ff00] animate-pulse"></span>
              Live Bettor Chat
            </h3>
            {isAdmin && (
              <button
                onClick={() => setShowModTools(!showModTools)}
                className={`text-white/50 hover:text-white transition-colors ${showModTools ? 'text-[#c1ff00]' : ''}`}
                title="Mod Tools"
              >
                <Settings size={16} />
              </button>
            )}
          </div>
          
          {isAdmin && showModTools && (
            <div className="bg-zinc-900 border-b border-zinc-800 p-3 shrink-0 flex flex-col gap-2 animate-in slide-in-from-top-2">
              <div className="flex items-center gap-2 text-xs font-bold text-red-400 uppercase tracking-widest mb-1">
                <AlertTriangle size={14} />
                Bulk Purge Actions
              </div>
              <div className="grid grid-cols-1 gap-2">
                <button 
                  onClick={() => handleBulkPurge('1min')}
                  className="px-2 py-1.5 text-xs font-bold uppercase bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded transition-colors text-left"
                >
                  Purge Last 1 Min
                </button>
                <button 
                  onClick={() => handleBulkPurge('1hour')}
                  className="px-2 py-1.5 text-xs font-bold uppercase bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded transition-colors text-left"
                >
                  Purge Last 1 Hour
                </button>
                <button 
                  onClick={() => handleBulkPurge('all')}
                  className="px-2 py-1.5 text-xs font-bold uppercase bg-red-500 text-white hover:bg-red-600 rounded transition-colors text-center"
                >
                  Full Chat Purge
                </button>
              </div>
            </div>
          )}
          
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {messages.length === 0 ? (
              <p className="text-white/40 text-xs text-center italic mt-auto mb-auto">No messages yet. Start the conversation!</p>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className="flex flex-col gap-1 group relative">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[10px] font-bold text-[#c1ff00] uppercase tracking-wider">{msg.displayName}</span>
                    <span className="text-[9px] text-white/30">{formatTime(msg.timestamp)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-white/90 bg-white/5 rounded-lg p-2 rounded-tl-none flex-1 break-words">{msg.text}</p>
                    {isAdmin && (
                      <button 
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="text-white/20 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                        title="Delete Message"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-3 border-t border-zinc-800 bg-zinc-900 shrink-0">
            {user ? (
              <div className="flex items-center gap-2 relative">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="w-full bg-black/50 border border-zinc-700 rounded-full py-2 px-4 text-sm text-white focus:outline-none focus:border-[#c1ff00]/50 pr-10"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#c1ff00] disabled:text-white/20 hover:text-[#c1ff00]/80 transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
            ) : (
              <div className="text-center text-xs text-white/50 py-2">
                Log in to join the chat
              </div>
            )}
          </form>
        </div>
      )}
    </>
  );
}
