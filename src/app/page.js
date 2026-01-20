'use client';

import { useState, useRef, useEffect } from 'react';
import NextImage from 'next/image';
import { 
  Camera, Image as ImageIcon, X, Loader2, 
  Users, Sparkles, Check, ChevronRight, 
  RefreshCw, HandCoins, ScanLine, Plus, Clock 
} from 'lucide-react';
import { analyzeReceipt } from './actions'; 

export default function Home() {
  // --- STATE ---
  const [step, setStep] = useState(1);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [friends, setFriends] = useState(['Aku']); 
  const [currentName, setCurrentName] = useState('');
  const [items, setItems] = useState([]);
  
  // Loading State Khusus
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(8); // Estimasi 8 detik
  const [loadingMsg, setLoadingMsg] = useState("Menghubungkan ke AI...");

  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  useEffect(() => { window.scrollTo(0, 0); }, [step]);

  // --- EFEK LOADING TIMER ---
  useEffect(() => {
    let timer;
    if (isLoading) {
      setCountdown(8); // Reset ke 8 detik
      
      // Kata-kata lucu saat loading
      const messages = [
        "Sedang menerawang struk...",
        "Memisahkan pajak & service...",
        "Mengeja nama menu...",
        "Jangan lupa bayar ya...",
        "Sedikit lagi...",
        "Hampir selesai..."
      ];

      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) return 1; // Mentok di 1 detik
          return prev - 1;
        });
        // Ganti pesan secara acak
        setLoadingMsg(messages[Math.floor(Math.random() * messages.length)]);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isLoading]);

  // --- LOGIKA ---
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const addFriend = (e) => {
    e.preventDefault();
    const val = currentName.trim();
    if (val && !friends.includes(val)) {
      setFriends([...friends, val]);
      setCurrentName('');
    }
  };

  const removeFriend = (name) => setFriends(friends.filter(f => f !== name));

  const handleProcess = async () => {
    if (!image || friends.length === 0) return;
    setIsLoading(true); // Memicu Popup Loading
    
    try {
      const formData = new FormData();
      formData.append('file', image);
      
      const result = await analyzeReceipt(formData);
      if (result.error) { alert(result.error); setIsLoading(false); return; }

      const formattedItems = result.data.items.map(item => ({ ...item, assignedTo: [] }));
      setItems(formattedItems);
      setStep(2);
    } catch (error) {
      console.error(error); alert("Gagal koneksi. Coba lagi.");
    } finally { setIsLoading(false); }
  };

  // --- LOGIKA STEP 2 & 3 ---
  const toggleAssign = (idx, friend) => {
    const newItems = [...items];
    const item = newItems[idx];
    if (item.assignedTo.includes(friend)) item.assignedTo = item.assignedTo.filter(f => f !== friend);
    else item.assignedTo.push(friend);
    setItems(newItems);
  };

  const assignAll = (idx) => {
    const newItems = [...items];
    newItems[idx].assignedTo = newItems[idx].assignedTo.length === friends.length ? [] : [...friends];
    setItems(newItems);
  };

  const calculateResult = () => {
    const unassigned = items.filter(i => i.assignedTo.length === 0);
    if (unassigned.length > 0 && !confirm(`Ada ${unassigned.length} menu belum dipilih. Lanjut?`)) return;
    setStep(3);
  };

  const getBillPerPerson = () => {
    const bill = {};
    friends.forEach(f => bill[f] = 0);
    items.forEach(item => {
      if (item.assignedTo.length > 0) {
        const split = item.price / item.assignedTo.length;
        item.assignedTo.forEach(p => bill[p] += split);
      }
    });
    return bill;
  };

  const resetAll = () => {
    if(confirm("Ulangi dari awal?")) { setStep(1); setImage(null); setPreview(null); setItems([]); }
  };

  // --- UI RENDER ---
  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 pb-32">
      
      {/* === POPUP LOADING (OVERLAY) === */}
      {isLoading && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-300 px-6 text-center">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-xs flex flex-col items-center relative overflow-hidden">
            {/* Dekorasi Background */}
            <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 animate-pulse"></div>
            
            <div className="relative mb-4">
              <Loader2 size={48} className="text-indigo-600 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center font-bold text-xs text-indigo-800">
                {countdown}
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-slate-800 mb-1">Mohon Tunggu</h3>
            <p className="text-slate-500 text-sm mb-4">Estimasi: {countdown} detik lagi</p>
            
            <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-xs font-medium animate-pulse">
              "{loadingMsg}"
            </div>
          </div>
        </div>
      )}

      {/* NAVBAR */}
      <nav className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-3 z-50 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2 text-indigo-700">
          <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
            <HandCoins size={20} />
          </div>
          <span className="font-bold text-lg tracking-tight">SplitYuk</span>
        </div>
        {step > 1 && (
          <button onClick={resetAll} className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full flex gap-1 hover:bg-slate-200 transition">
            <RefreshCw size={12} /> Reset
          </button>
        )}
      </nav>

      <div className="max-w-md mx-auto p-4 pt-6">
        
        {/* === STEP 1: INPUT & UPLOAD === */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* HERO */}
            <div className="text-center py-4 px-2">
              <h1 className="text-3xl font-extrabold text-indigo-950 tracking-tight mb-3">
                Bayar Woy! 💸
              </h1>
              <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">
                Makan bareng enak, pas bayar jangan ngilang. Yuk hitung siapa bayar berapa biar adil.
              </p>
            </div>

            {/* DAFTAR PEMAKAN */}
            <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <h2 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
                <Users size={16} className="text-indigo-600"/> 1. Siapa Aja?
              </h2>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {friends.map(f => (
                  <div key={f} className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-2xl text-sm font-bold flex gap-2 items-center border border-indigo-100 animate-in zoom-in duration-200">
                    {f} 
                    {f !== 'Aku' && <button onClick={() => removeFriend(f)}><X size={14} className="hover:text-red-500"/></button>}
                  </div>
                ))}
                
                <form onSubmit={addFriend} className="flex items-center gap-2">
                  <input
                    value={currentName}
                    onChange={e => setCurrentName(e.target.value)}
                    placeholder="Nama..."
                    className="w-28 px-3 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <button 
                    type="submit" 
                    disabled={!currentName} 
                    className="bg-slate-900 text-white p-2.5 rounded-xl hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition shadow-md"
                  >
                    <Plus size={16} />
                  </button> 
                </form>
              </div>
            </section>

            {/* SCAN STRUK */}
            <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <h2 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
                <ScanLine size={16} className="text-indigo-600"/> 2. Scan Struk
              </h2>

              <input type="file" ref={galleryInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" />
              <input type="file" ref={cameraInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" capture="environment" />

              {preview ? (
                <div className="relative h-80 w-full rounded-2xl overflow-hidden bg-slate-900 shadow-inner group">
                  <NextImage src={preview} alt="Struk" fill className="object-contain opacity-90" />
                  
                  {!isLoading && (
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/20 to-transparent z-10 animate-scan pointer-events-none"></div>
                  )}

                  <button 
                    onClick={() => {setImage(null); setPreview(null)}} 
                    className="absolute top-3 right-3 bg-black/50 backdrop-blur text-white p-2 rounded-full hover:bg-red-500 transition z-20"
                  >
                    <X size={18} />
                  </button>
                  
                  <div className="absolute bottom-3 left-0 right-0 text-center">
                    <span className="text-xs text-white/80 bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm">
                      Struk Terdeteksi
                    </span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => cameraInputRef.current?.click()}
                    className="h-40 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white flex flex-col items-center justify-center gap-3 transition-transform active:scale-95 shadow-lg shadow-indigo-200 relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="p-4 bg-white/20 rounded-full backdrop-blur-sm">
                      <Camera size={32} />
                    </div>
                    <span className="font-bold">Kamera</span>
                  </button>

                  <button 
                    onClick={() => galleryInputRef.current?.click()}
                    className="h-40 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex flex-col items-center justify-center gap-3 transition-transform active:scale-95 border border-slate-200"
                  >
                     <div className="p-4 bg-white rounded-full shadow-sm text-slate-500">
                      <ImageIcon size={32} />
                    </div>
                    <span className="font-bold">Galeri</span>
                  </button>
                </div>
              )}
            </section>
          </div>
        )}

        {/* === STEP 2: ASSIGN UI === */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right duration-300">
             <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3 items-start">
                <div className="bg-blue-100 text-blue-600 p-2 rounded-xl shrink-0"><Sparkles size={18} /></div>
                <div>
                  <p className="text-sm font-bold text-blue-900">Pilih Pemilik Menu</p>
                  <p className="text-xs text-blue-700 mt-1">Klik nama teman di bawah menu.</p>
                </div>
              </div>

              {items.map((item, idx) => (
                <div key={idx} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
                  <div className="flex justify-between items-start mb-4 border-b border-slate-50 pb-3">
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg leading-tight">{item.name}</h3>
                      <div className="text-xs text-slate-400 mt-1 font-mono bg-slate-50 px-2 py-1 rounded inline-block">
                        {item.qty}x @ {Math.round(item.price / item.qty).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-indigo-600 text-lg">Rp {item.price.toLocaleString()}</p>
                      <button onClick={() => assignAll(idx)} className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg mt-1 font-bold hover:bg-indigo-100 transition">
                        PILIH SEMUA
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {friends.map(friend => {
                      const active = item.assignedTo.includes(friend);
                      return (
                        <button key={friend} onClick={() => toggleAssign(idx, friend)} 
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-2 
                            ${active 
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200 scale-105' 
                              : 'bg-white text-slate-500 border-slate-100 hover:border-indigo-200'}
                          `}
                        >
                          {friend}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* === STEP 3: RESULT UI === */}
        {step === 3 && (
          <div className="space-y-4 animate-in zoom-in-95 duration-300">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center">
              <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-green-100">
                <Check size={40} strokeWidth={4} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Total Tagihan</h2>
              <p className="text-slate-500 text-sm">Screenshot halaman ini ya!</p>
            </div>

            <div className="grid gap-3">
              {Object.entries(getBillPerPerson()).map(([name, total]) => (
                <div key={name} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center font-bold text-xl text-indigo-600">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-bold text-slate-800 text-lg">{name}</span>
                  </div>
                  <span className="font-bold text-xl text-indigo-600">Rp {Math.ceil(total).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* === STICKY ACTION BUTTON (BOTTOM) === */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-xl border-t border-slate-200 z-40 safe-area-bottom shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
        <div className="max-w-md mx-auto">
          {step === 1 && (
            <button
              onClick={handleProcess}
              disabled={!image || friends.length === 0 || isLoading}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-indigo-300 hover:bg-indigo-700 hover:-translate-y-1 active:translate-y-0 disabled:bg-slate-300 disabled:shadow-none disabled:transform-none transition-all flex justify-center items-center gap-3"
            >
              <Sparkles size={20} fill="currentColor" />
              Scan & Bagi Tagihan
            </button>
          )}

          {step === 2 && (
             <button onClick={calculateResult} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg shadow-xl hover:bg-slate-800 active:scale-[0.98] transition flex justify-center items-center gap-2">
               Hitung Total <ChevronRight />
             </button>
          )}

          {step === 3 && (
            <button onClick={resetAll} className="w-full bg-slate-100 text-slate-700 py-4 rounded-2xl font-bold text-lg hover:bg-slate-200 transition">
              Scan Lagi
            </button>
          )}
        </div>
      </div>

    </main>
  );
}