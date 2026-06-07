import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, increment, writeBatch, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { MessagesSquare, Flame, MessageCircle, Send, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useAuth } from "../context/AuthContext";

export function HoopBuzz() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile, loading: profileLoading } = useAuth();

  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [showReplyPanel, setShowReplyPanel] = useState<{ [key: string]: boolean }>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, "hoopbuzz_posts"),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPosts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(fetchedPosts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getRelativeTime = (timestamp: any) => {
    if (!timestamp) return "";
    const now = new Date().getTime();
    const then = timestamp.toDate().getTime();
    const seconds = Math.floor((now - then) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleReaction = async (postId: string, type: "swish" | "brick") => {
    if (!profile) return;

    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const currentCount = post.rewardedUsers?.[profile.uid] || 0;

    const postRef = doc(db, "hoopbuzz_posts", postId);
    const userRef = doc(db, "users", profile.uid);

    const batch = writeBatch(db);

    if (currentCount >= 100) {
      batch.update(postRef, {
        [type === "swish" ? "swishes" : "bricks"]: increment(1)
      });
      await batch.commit();
      showToast("Max 100 $Dimes per post reached!");
      return;
    }

    batch.update(postRef, {
      [type === "swish" ? "swishes" : "bricks"]: increment(1),
      [`rewardedUsers.${profile.uid}`]: increment(1)
    });
    batch.update(userRef, {
      balance: increment(1)
    });

    await batch.commit();

    if (currentCount === 99) {
      showToast("Max 100 $Dimes per post reached!");
    }
  };

  const handleReplySubmit = async (postId: string) => {
    const text = replyText[postId];
    if (!text || text.trim() === "") return;

    const displayName = profile?.displayName || profile?.username || "Anonymous Bettor";
    
    const postRef = doc(db, "hoopbuzz_posts", postId);
    await updateDoc(postRef, {
      replies: arrayUnion({
        id: Math.random().toString(36).substr(2, 9),
        text: text.trim(),
        author: displayName,
        timestamp: new Date().toISOString()
      })
    });

    setReplyText((prev) => ({ ...prev, [postId]: "" }));
  };

  const handleDeletePost = async (e: React.MouseEvent, postId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (profile?.role !== "admin") return;
    if (window.confirm("Delete this post completely?")) {
      await deleteDoc(doc(db, "hoopbuzz_posts", postId));
    }
  };

  const handleDeleteReply = async (e: React.MouseEvent, postId: string, replyId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (profile?.role !== "admin") return;
    if (window.confirm("Delete this comment?")) {
      const post = posts.find(p => p.id === postId);
      if (!post) return;
      const updatedReplies = (post.replies || []).filter((r: any) => r.id !== replyId);
      await updateDoc(doc(db, "hoopbuzz_posts", postId), { replies: updatedReplies });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pt-4 animate-in fade-in zoom-in duration-500">
      <div className="flex items-center gap-3 border-b border-white/10 pb-6 mb-6">
        <div className="w-12 h-12 rounded-full bg-[#1da1f2]/10 flex items-center justify-center shrink-0 border border-[#1da1f2]/20">
          <Flame className="text-[#1da1f2]" fill="currentColor" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black italic uppercase text-white tracking-tight">
            HoopBuzz
          </h1>
          <p className="text-white/40 text-sm font-medium">
            Live reacts, wild takes, and instant highlights.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="w-6 h-6 border-2 border-[#1da1f2] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : posts.length === 0 ? (
        <div className="glass-card p-12 flex flex-col items-center justify-center text-center space-y-4">
          <MessagesSquare className="text-white/20" size={48} />
          <div>
            <h3 className="text-white font-bold text-lg">No Buzz Yet</h3>
            <p className="text-white/40 text-sm">
              Posts will appear here as soon as games wrap up.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden hover:bg-white/10 hover:shadow-[0_0_20px_rgba(29,161,242,0.15)] hover:border-[#1da1f2]/30 transition-all duration-300 p-4 sm:p-5">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-[#1da1f2] flex items-center justify-center font-bold text-white uppercase shrink-0">
                  {post.authorName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <span className="font-bold text-white hover:underline cursor-pointer truncate">
                      {post.authorName}
                    </span>
                    <span className="text-white/40 text-sm truncate">
                      {post.authorHandle || `@${post.authorName.replace(/\s+/g, '')}`}
                    </span>
                    <span className="text-white/40 text-sm">·</span>
                    <span className="text-white/40 text-sm whitespace-nowrap">
                      {getRelativeTime(post.timestamp)}
                    </span>
                    {!profileLoading && profile?.role === "admin" && (
                      <button 
                        onClick={(e) => handleDeletePost(e, post.id)}
                        className="ml-auto text-white/30 hover:text-red-400 transition-colors p-1 relative z-50 pointer-events-auto"
                        title="Delete Post"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <div className="prose prose-invert prose-p:text-white/90 prose-p:leading-snug max-w-none text-[15px] mb-3">
                    <ReactMarkdown>{post.articleText}</ReactMarkdown>
                  </div>
                  
                  {/* Reaction Row */}
                  <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/5">
                    <button 
                      onClick={() => handleReaction(post.id, "swish")}
                      className="flex items-center gap-2 text-white/50 hover:text-green-400 transition-colors group"
                    >
                      <div className="p-1.5 rounded-full group-hover:bg-green-400/10">
                        🏀
                      </div>
                      <span className="text-sm font-medium">{post.swishes || 0}</span>
                    </button>
                    
                    <button 
                       onClick={() => handleReaction(post.id, "brick")}
                      className="flex items-center gap-2 text-white/50 hover:text-red-400 transition-colors group"
                    >
                      <div className="p-1.5 rounded-full group-hover:bg-red-400/10">
                        🧱
                      </div>
                      <span className="text-sm font-medium">{post.bricks || 0}</span>
                    </button>

                    <button 
                      onClick={() => setShowReplyPanel(p => ({ ...p, [post.id]: !p[post.id] }))}
                      className="flex items-center gap-2 text-white/50 hover:text-[#1da1f2] transition-colors group ml-auto"
                    >
                      <div className="p-1.5 rounded-full group-hover:bg-[#1da1f2]/10 transition-colors">
                        <MessageCircle size={18} />
                      </div>
                      <span className="text-sm font-medium">{(post.replies || []).length}</span>
                    </button>
                  </div>

                  {/* Replies Section */}
                  {showReplyPanel[post.id] && (
                    <div className="mt-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                      {(post.replies || []).map((reply: any) => (
                         <div key={reply.id} className="flex gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white shrink-0">
                               {reply.author[0]?.toUpperCase()}
                            </div>
                            <div className="bg-white/5 rounded-2xl rounded-tl-none px-4 py-2.5 flex-1 min-w-0">
                               <div className="flex items-baseline gap-2 mb-0.5">
                                 <span className="font-bold text-sm text-white/90">{reply.author}</span>
                                 {!profileLoading && profile?.role === "admin" && (
                                   <button 
                                     onClick={(e) => handleDeleteReply(e, post.id, reply.id)}
                                     className="ml-auto text-white/30 hover:text-red-400 transition-colors relative z-50 pointer-events-auto p-1"
                                     title="Delete Comment"
                                   >
                                     <Trash2 size={14} />
                                   </button>
                                 )}
                               </div>
                               <p className="text-sm text-white/80 leading-snug">{reply.text}</p>
                            </div>
                         </div>
                      ))}
                      
                      <div className="flex items-end gap-2 mt-2">
                        <textarea
                          placeholder="Post your reply..."
                          value={replyText[post.id] || ""}
                          onChange={(e) => setReplyText((prev) => ({ ...prev, [post.id]: e.target.value }))}
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#1da1f2]/50 focus:bg-white/10 resize-none min-h-[44px]"
                          rows={1}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleReplySubmit(post.id);
                            }
                          }}
                        />
                        <button 
                          onClick={() => handleReplySubmit(post.id)}
                          disabled={!replyText[post.id]?.trim()}
                          className="h-[44px] px-4 bg-[#1da1f2] hover:bg-[#1a91da] text-white rounded-xl font-bold flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                        >
                          <Send size={16} />
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {toastMessage && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-indigo-500 text-white px-4 py-2 rounded-xl shadow-lg border border-white/20 animate-in slide-in-from-bottom duration-300">
          <div className="flex flex-row items-center space-x-2">
            <span>✨</span>
            <span className="font-bold text-sm tracking-wide">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
