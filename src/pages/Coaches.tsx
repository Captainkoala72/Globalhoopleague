import React, { useState, useEffect } from "react";
import { collection, query, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { Shield, Users, Plus, Trash2, Edit2, X, Activity, Brain, Target } from "lucide-react";

interface Coach {
  id: string;
  name: string;
  teamName: string;
  archetype: string;
  offFocus: string;
  offTempo: string;
  offRebounding: string;
  defFocus: string;
  defAggression: string;
  defRebounding: string;
  development: number;
  motivation: number;
  leadership: number;
}

const ARCHETYPES = ["Balanced", "Defensive Minded", "Inside Offense", "Midrange Offense", "Outside Offense"];
const OFF_FOCUS = ["Balanced", "Inside", "Midrange", "Outside"];
const OFF_TEMPO = ["Average", "Fast Paced"];
const OFF_REB = ["Balanced", "Crash Boards", "Get Back on D"];
const DEF_FOCUS = ["Balanced", "Interior", "Perimeter"];
const DEF_AGG = ["Average", "Physical", "Conservative"];
const DEF_REB = ["Balanced", "Crash Boards", "Fast Break"];

export function Coaches() {
  const { profile } = useAuth();
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Omit<Coach, "id">>({
    name: "",
    teamName: "",
    archetype: "Balanced",
    offFocus: "Balanced",
    offTempo: "Average",
    offRebounding: "Balanced",
    defFocus: "Balanced",
    defAggression: "Average",
    defRebounding: "Balanced",
    development: 5,
    motivation: 5,
    leadership: 5,
  });

  useEffect(() => {
    const q = query(collection(db, "coaches"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Coach));
      setCoaches(fetched);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleOpenModal = (coach?: Coach) => {
    if (coach) {
      setEditingId(coach.id);
      setFormData(coach);
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        teamName: "",
        archetype: "Balanced",
        offFocus: "Balanced",
        offTempo: "Average",
        offRebounding: "Balanced",
        defFocus: "Balanced",
        defAggression: "Average",
        defRebounding: "Balanced",
        development: 5,
        motivation: 5,
        leadership: 5,
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.teamName) return alert("Name and Team Name required.");
    try {
      if (editingId) {
        await updateDoc(doc(db, "coaches", editingId), formData);
      } else {
        await addDoc(collection(db, "coaches"), formData);
      }
      setIsModalOpen(false);
    } catch (e) {
      console.error(e);
      alert("Failed to save coach");
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm("Delete this coach?")) return;
    await deleteDoc(doc(db, "coaches", id));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'range' || type === 'number' ? Number(value) : value
    }));
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="w-8 h-8 border-4 border-[#c1ff00] border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="flex items-center justify-between border-b border-white/10 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
            <Users className="text-orange-500" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black italic uppercase text-white tracking-tight">Coaches</h1>
            <p className="text-white/40 text-sm font-medium uppercase tracking-wider">Tactical Masterminds</p>
          </div>
        </div>
        {profile?.role === "admin" && (
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-[#c1ff00] text-black px-4 py-2 rounded-lg font-bold text-sm hover:brightness-110 transition-all"
          >
            <Plus size={16} /> Add Coach
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coaches.map(coach => (
          <div key={coach.id} className="glass-card p-6 border border-white/10 flex flex-col gap-4 relative group">
            {profile?.role === "admin" && (
              <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleOpenModal(coach)} className="p-1.5 bg-white/10 rounded hover:bg-[#c1ff00] hover:text-black transition-colors"><Edit2 size={14}/></button>
                <button onClick={(e) => handleDelete(e, coach.id)} className="p-1.5 bg-white/10 rounded hover:bg-red-500 transition-colors"><Trash2 size={14}/></button>
              </div>
            )}
            <div>
              <h2 className="text-xl font-black uppercase text-white">{coach.name}</h2>
              <div className="text-[#c1ff00] text-sm font-bold uppercase tracking-wider">{coach.teamName}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 border-y border-white/10 py-4">
              <div>
                <div className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-1">Archetype</div>
                <div className="text-sm font-semibold text-white/90">{coach.archetype}</div>
              </div>
              <div>
                <div className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-1">Tempo</div>
                <div className="text-sm font-semibold text-white/90">{coach.offTempo}</div>
              </div>
              <div className="col-span-2">
                <div className="text-[10px] text-orange-400 uppercase font-black tracking-widest mb-1">Offense</div>
                <div className="text-xs text-white/70">{coach.offFocus} • {coach.offRebounding}</div>
              </div>
              <div className="col-span-2">
                <div className="text-[10px] text-blue-400 uppercase font-black tracking-widest mb-1">Defense</div>
                <div className="text-xs text-white/70">{coach.defFocus} • {coach.defAggression} • {coach.defRebounding}</div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <Brain size={14} className="text-white/40" />
                <div className="flex-1 bg-white/10 rounded-full h-1.5 overflow-hidden"><div className="bg-[#c1ff00] h-full" style={{width: `${(coach.development / 10) * 100}%`}}></div></div>
                <div className="w-4 text-xs font-mono text-white/60 text-right">{coach.development}</div>
              </div>
              <div className="flex items-center gap-3">
                <Activity size={14} className="text-white/40" />
                <div className="flex-1 bg-white/10 rounded-full h-1.5 overflow-hidden"><div className="bg-[#c1ff00] h-full" style={{width: `${(coach.motivation / 10) * 100}%`}}></div></div>
                <div className="w-4 text-xs font-mono text-white/60 text-right">{coach.motivation}</div>
              </div>
              <div className="flex items-center gap-3">
                <Target size={14} className="text-white/40" />
                <div className="flex-1 bg-white/10 rounded-full h-1.5 overflow-hidden"><div className="bg-[#c1ff00] h-full" style={{width: `${(coach.leadership / 10) * 100}%`}}></div></div>
                <div className="w-4 text-xs font-mono text-white/60 text-right">{coach.leadership}</div>
              </div>
            </div>
          </div>
        ))}
        {coaches.length === 0 && (
          <div className="col-span-full py-12 text-center text-white/40 glass-card">No coaches found. Admin must add them.</div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#15202b] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto hidden-scrollbar relative shadow-2xl">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-white/50 hover:text-white p-2">
              <X size={20} />
            </button>
            <div className="p-6 md:p-8 space-y-6">
              <h2 className="text-2xl font-black uppercase italic text-white flex items-center gap-2">
                <Shield className="text-[#c1ff00]" /> {editingId ? "Edit Coach" : "Add Coach"}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white/60 uppercase">Coach Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#c1ff00] outline-none" placeholder="e.g. Gregg Popovich" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white/60 uppercase">Team Name</label>
                  <input type="text" name="teamName" value={formData.teamName} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#c1ff00] outline-none" placeholder="e.g. San Antonio Spurs" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white/60 uppercase">Archetype</label>
                  <select name="archetype" value={formData.archetype} onChange={handleChange} className="w-full bg-[#1e2a38] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#c1ff00] outline-none">
                    {ARCHETYPES.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div></div> {/* spacer */}

                <div className="col-span-full border-t border-white/10 pt-4"><h3 className="text-white font-bold uppercase text-sm mb-4 text-orange-400">Offense</h3></div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white/60 uppercase">Focus</label>
                  <select name="offFocus" value={formData.offFocus} onChange={handleChange} className="w-full bg-[#1e2a38] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#c1ff00] outline-none">
                    {OFF_FOCUS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white/60 uppercase">Tempo</label>
                  <select name="offTempo" value={formData.offTempo} onChange={handleChange} className="w-full bg-[#1e2a38] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#c1ff00] outline-none">
                    {OFF_TEMPO.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white/60 uppercase">Rebounding</label>
                  <select name="offRebounding" value={formData.offRebounding} onChange={handleChange} className="w-full bg-[#1e2a38] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#c1ff00] outline-none">
                    {OFF_REB.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>

                <div className="col-span-full border-t border-white/10 pt-4"><h3 className="text-white font-bold uppercase text-sm mb-4 text-blue-400">Defense</h3></div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white/60 uppercase">Focus</label>
                  <select name="defFocus" value={formData.defFocus} onChange={handleChange} className="w-full bg-[#1e2a38] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#c1ff00] outline-none">
                    {DEF_FOCUS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white/60 uppercase">Aggression</label>
                  <select name="defAggression" value={formData.defAggression} onChange={handleChange} className="w-full bg-[#1e2a38] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#c1ff00] outline-none">
                    {DEF_AGG.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white/60 uppercase">Rebounding</label>
                  <select name="defRebounding" value={formData.defRebounding} onChange={handleChange} className="w-full bg-[#1e2a38] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#c1ff00] outline-none">
                    {DEF_REB.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>

                <div className="col-span-full border-t border-white/10 pt-4"><h3 className="text-white font-bold uppercase text-sm mb-4 text-[#c1ff00]">Intangibles (1-10)</h3></div>

                <div className="space-y-1.5 col-span-full">
                  <label className="flex justify-between text-xs font-bold text-white/60 uppercase"><span>Development</span> <span className="text-white">{formData.development}</span></label>
                  <input type="range" name="development" min="1" max="10" value={formData.development} onChange={handleChange} className="w-full accent-[#c1ff00]" />
                </div>
                <div className="space-y-1.5 col-span-full">
                  <label className="flex justify-between text-xs font-bold text-white/60 uppercase"><span>Motivation</span> <span className="text-white">{formData.motivation}</span></label>
                  <input type="range" name="motivation" min="1" max="10" value={formData.motivation} onChange={handleChange} className="w-full accent-[#c1ff00]" />
                </div>
                <div className="space-y-1.5 col-span-full">
                  <label className="flex justify-between text-xs font-bold text-white/60 uppercase"><span>Leadership</span> <span className="text-white">{formData.leadership}</span></label>
                  <input type="range" name="leadership" min="1" max="10" value={formData.leadership} onChange={handleChange} className="w-full accent-[#c1ff00]" />
                </div>

                <div className="col-span-full pt-4">
                  <button onClick={handleSave} className="w-full bg-[#c1ff00] text-black font-black uppercase italic py-4 rounded-xl hover:brightness-110 transition-all text-lg">
                    {editingId ? "Update Coach" : "Add Coach"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
