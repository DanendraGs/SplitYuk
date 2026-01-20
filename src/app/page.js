'use client';

import { useState, useRef, useEffect } from 'react';
import NextImage from 'next/image';
import { 
  Camera, Image as ImageIcon, X, Loader2, 
  Users, Sparkles, Check, ChevronRight, ChevronDown, ChevronUp,
  RefreshCw, HandCoins, ScanLine, Plus, Receipt, Wand2, Calculator,
  AlertTriangle, Trash2
} from 'lucide-react';
import { analyzeReceipt } from './actions'; 

export default function Home() {
  // --- STATE UTAMA ---
  const [step, setStep] = useState(1);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [friends, setFriends] = useState(['Aku']); 
  const [currentName, setCurrentName] = useState('');
  const [items, setItems] = useState([]);
  
  // State Nominal (Rupiah)
  const [taxAmount, setTaxAmount] = useState(0); 
  const [serviceAmount, setServiceAmount] = useState(0); 
  const [roundingAmount, setRoundingAmount] = useState(0); 
  const [expandedUser, setExpandedUser] = useState(null);
  
  // UI UX States
  const [isLoading, setIsLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false); // <--- State untuk Modal Baru
  const [countdown, setCountdown] = useState(8);
  const [loadingMsg, setLoadingMsg] = useState("Menghubungkan ke AI...");

  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  useEffect(() => { window.scrollTo(0, 0); }, [step]);

  // --- LOADING TIMER ---
  useEffect(() => {
    let timer;
    if (isLoading) {
      setCountdown(8);
      const messages = [
        "Menerawang struk...", "Memisahkan pajak...", "Mengeja menu...", 
        "Menghitung recehan...", "Sedikit lagi..."
      ];
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) return 1;
          return prev - 1;
        });
        setLoadingMsg(messages[Math.floor(Math.random() * messages.length)]);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isLoading]);

  // --- LOGIKA UTAMA ---
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
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', image);
      
      const result = await analyzeReceipt(formData);
      if (result.error) { alert(result.error); setIsLoading(false); return; }

      const formattedItems = result.data.items.map(item => ({ ...item, assignedTo: [] }));
      setItems(formattedItems);

      if (result.data.tax_total) setTaxAmount(result.data.tax_total);
      if (result.data.service_total) setServiceAmount(result.data.service_total);
      
      setStep(2);
    } catch (error) {
      console.error(error); alert("Gagal koneksi. Coba lagi.");
    } finally { setIsLoading(false); }
  };

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

  // --- LOGIKA RESET BARU (MODAL) ---
  const triggerReset = () => {
    setShowResetModal(true); // Buka Modal
  };

  const confirmReset = () => {
    // Aksi Reset Sebenarnya
    setStep(1); 
    setImage(null); 
    setPreview(null); 
    setItems([]); 
    setTaxAmount(0); 
    setServiceAmount(0); 
    setRoundingAmount(0); 
    setExpandedUser(null);
    setShowResetModal(false); // Tutup Modal
  };

  const cancelReset = () => {
    setShowResetModal(false); // Tutup Modal aja
  };

  // --- PERHITUNGAN BILL ---
  const getCalculatedBill = () => {
    const billData = {};
    friends.forEach(f => {
      billData[f] = { items: [], subtotal: 0, extraCharge: 0, total: 0 };
    });

    let totalSubtotalAll = 0;

    items.forEach(item => {
      if (item.assignedTo.length > 0) {
        const splitPrice = item.price / item.assignedTo.length;
        item.assignedTo.forEach(p => {
          billData[p].items.push({ 
            name: item.name, 
            qtyShare: (item.qty / item.assignedTo.length).toFixed(1), 
            priceShare: splitPrice 
          });
          billData[p].subtotal += splitPrice;
        });
        totalSubtotalAll += item.price;
      }
    });

    const totalExtras = (parseFloat(taxAmount) || 0) + (parseFloat(serviceAmount) || 0) + (parseFloat(roundingAmount) || 0);
    let grandTotal = 0;

    Object.keys(billData).forEach(name => {
      const person = billData[name];
      let share = 0;
      if (totalSubtotalAll > 0) {
        share = (person.subtotal / totalSubtotalAll) * totalExtras;
      }
      person.extraCharge = share;
      person.total = person.subtotal + share;
      grandTotal += person.total;
    });

    return { billData, grandTotal, totalSubtotalAll };
  };

  const { billData, grandTotal, totalSubtotalAll } = step === 3 ? getCalculatedBill() : { billData: {}, grandTotal: 0, totalSubtotalAll: 0 };

  // --- UI RENDER ---
  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 pb-40 relative">
      
      {/* === MODAL KONFIRMASI RESET (BARU) === */}
      {showResetModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop Blur */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={cancelReset} // Klik luar untuk batal
          ></div>
          
          {/* Kartu Modal */}
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xs p-6 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-4 mx-auto">
              <RefreshCw size={28} />
            </div>
            
            <h3 className="text-xl font-bold text-slate-800 text-center mb-2">
              Mulai Scan Baru?
            </h3>
            <p className="text-slate-500 text-center text-sm mb-6 leading-relaxed">
              Data tagihan yang sekarang akan dihapus dan kamu akan kembali ke awal.
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={cancelReset}
                className="py-3 px-4 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
              >
                Batal
              </button>
              <button 
                onClick={confirmReset}
                className="py-3 px-4 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200 transition flex items-center justify-center gap-2"
              >
                 Ulangi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOADING OVERLAY */}
      {isLoading && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-300 px-6 text-center">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-xs flex flex-col items-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 animate-pulse"></div>
            <div className="relative mb-4">
              <Loader2 size={48} className="text-indigo-600 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center font-bold text-xs text-indigo-800">{countdown}</div>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-1">Mohon Tunggu</h3>
            <p className="text-slate-500 text-sm mb-4">Estimasi: {countdown} detik lagi</p>
            <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-xs font-medium animate-pulse">"{loadingMsg}"</div>
          </div>
        </div>
      )}

      {/* NAVBAR */}
      <nav className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-3 z-50 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2 text-indigo-700">
          <div className="bg-indigo-600 text-white p-1.5 rounded-lg"><HandCoins size={20} /></div>
          <span className="font-bold text-lg tracking-tight">SplitYuk</span>
        </div>
        {step > 1 && (
          <button onClick={triggerReset} className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full flex gap-1 hover:bg-slate-200 transition">
            <RefreshCw size={12} /> Reset
          </button>
        )}
      </nav>

      <div className="max-w-md mx-auto p-4 pt-6">
        
        {/* === STEP 1: INPUT & UPLOAD === */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center py-4 px-2">
              <h1 className="text-3xl font-extrabold text-indigo-950 tracking-tight mb-3">Bayar Woy! 💸</h1>
              <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">Makan bareng enak, pas bayar jangan ngilang. Yuk hitung siapa bayar berapa biar adil.</p>
            </div>
            <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <h2 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
                <Users size={16} className="text-indigo-600"/> Siapa Aja?
              </h2>
              <div className="flex flex-wrap gap-2 mb-4">
                {friends.map(f => (
                  <div key={f} className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-2xl text-sm font-bold flex gap-2 items-center border border-indigo-100 animate-in zoom-in duration-200">
                    {f} {f !== 'Aku' && <button onClick={() => removeFriend(f)}><X size={14} className="hover:text-red-500"/></button>}
                  </div>
                ))}
                <form onSubmit={addFriend} className="flex items-center gap-2">
                  <input value={currentName} onChange={e => setCurrentName(e.target.value)} placeholder="Nama..." className="w-28 px-3 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                  <button type="submit" disabled={!currentName} className="bg-slate-900 text-white p-2.5 rounded-xl hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition shadow-md"><Plus size={16} /></button> 
                </form>
              </div>
            </section>
            <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <h2 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
                <ScanLine size={16} className="text-indigo-600"/> Scan Struk
              </h2>
              <input type="file" ref={galleryInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" />
              <input type="file" ref={cameraInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" capture="environment" />
              {preview ? (
                <div className="relative h-80 w-full rounded-2xl overflow-hidden bg-slate-900 shadow-inner group">
                  <NextImage src={preview} alt="Struk" fill className="object-contain opacity-90" />
                  {!isLoading && <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/20 to-transparent z-10 animate-scan pointer-events-none"></div>}
                  <button onClick={() => {setImage(null); setPreview(null)}} className="absolute top-3 right-3 bg-black/50 backdrop-blur text-white p-2 rounded-full hover:bg-red-500 transition z-20"><X size={18} /></button>
                  <div className="absolute bottom-3 left-0 right-0 text-center"><span className="text-xs text-white/80 bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm">Struk Terdeteksi</span></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => cameraInputRef.current?.click()} className="h-40 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white flex flex-col items-center justify-center gap-3 transition-transform active:scale-95 shadow-lg shadow-indigo-200 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="p-4 bg-white/20 rounded-full backdrop-blur-sm"><Camera size={32} /></div>
                    <span className="font-bold">Kamera</span>
                  </button>
                  <button onClick={() => galleryInputRef.current?.click()} className="h-40 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex flex-col items-center justify-center gap-3 transition-transform active:scale-95 border border-slate-200">
                     <div className="p-4 bg-white rounded-full shadow-sm text-slate-500"><ImageIcon size={32} /></div>
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
                  <p className="text-xs text-blue-700 mt-1">Klik nama teman, lalu cek kolom Rupiah di bawah.</p>
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
                      <button onClick={() => assignAll(idx)} className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg mt-1 font-bold hover:bg-indigo-100 transition">PILIH SEMUA</button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {friends.map(friend => {
                      const active = item.assignedTo.includes(friend);
                      return (
                        <button key={friend} onClick={() => toggleAssign(idx, friend)} 
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-2 
                            ${active ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200 scale-105' : 'bg-white text-slate-500 border-slate-100 hover:border-indigo-200'}
                          `}>
                          {friend}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              
              {/* INPUT NOMINAL TAX & SERVICE (RUPIAH) */}
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                 <h3 className="font-bold text-slate-700 flex items-center gap-2 text-sm uppercase tracking-wide">
                    <Receipt size={16} className="text-indigo-600"/> Biaya Tambahan (Dalam Rupiah)
                 </h3>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="text-xs font-bold text-slate-500 mb-1 block">Pajak (Tax) Rp</label>
                       <input type="number" value={taxAmount} onChange={e => setTaxAmount(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none" placeholder="0" />
                    </div>
                    <div>
                       <label className="text-xs font-bold text-slate-500 mb-1 block">Service Charge Rp</label>
                       <input type="number" value={serviceAmount} onChange={e => setServiceAmount(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none" placeholder="0" />
                    </div>
                 </div>

                 {/* KOLOM PEMBULATAN */}
                 <div className="pt-2 border-t border-slate-100">
                    <label className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
                      <Calculator size={12}/> Pembulatan / Selisih (Rp)
                    </label>
                    <div className="flex gap-2 items-center">
                        <input type="number" value={roundingAmount} onChange={e => setRoundingAmount(e.target.value)} className="w-full bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-yellow-500/20 outline-none" placeholder="Contoh: 400 atau -100" />
                        <span className="text-xs text-slate-400 shrink-0 w-1/3 leading-tight">
                            Masukkan selisih angka (misal 400) biar totalnya pas struk.
                        </span>
                    </div>
                 </div>

                 <div className="text-xs text-slate-400 bg-slate-50 p-2 rounded-lg text-center flex items-center justify-center gap-2">
                    <Wand2 size={12} /> Biaya ini akan dibagi proporsional ke semua orang.
                 </div>
              </div>
          </div>
        )}

        {/* === STEP 3: RESULT UI === */}
        {step === 3 && (
          <div className="space-y-4 animate-in zoom-in-95 duration-300">
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3 items-center">
               <div className="bg-blue-100 text-blue-600 p-2 rounded-xl shrink-0"><Check size={18} /></div>
               <p className="text-sm font-bold text-blue-900">Tagihan Siap! <span className="font-normal text-blue-700">Klik nama untuk melihat detail.</span></p>
            </div>

            <div className="grid gap-3">
              {Object.entries(billData).map(([name, data]) => {
                const isExpanded = expandedUser === name;
                return (
                  <div key={name} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden transition-all">
                    <button onClick={() => setExpandedUser(isExpanded ? null : name)} className="w-full p-5 flex justify-between items-center bg-white hover:bg-slate-50 transition active:bg-slate-100">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center font-bold text-xl text-indigo-600">{name.charAt(0).toUpperCase()}</div>
                        <div className="text-left">
                           <span className="font-bold text-slate-800 text-lg block">{name}</span>
                           <span className="text-xs text-slate-400 font-medium">{data.items.length} Menu • Klik untuk rincian</span>
                        </div>
                      </div>
                      <div className="text-right">
                         <span className="font-bold text-xl text-indigo-600 block">Rp {Math.ceil(data.total).toLocaleString()}</span>
                         {isExpanded ? <ChevronUp size={16} className="ml-auto mt-1 text-slate-400"/> : <ChevronDown size={16} className="ml-auto mt-1 text-slate-400"/>}
                      </div>
                    </button>
                    {isExpanded && (
                       <div className="bg-slate-50 p-5 border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Rincian Menu</p>
                          <div className="space-y-2 mb-4">
                             {data.items.map((item, i) => (
                                <div key={i} className="flex justify-between text-sm text-slate-600">
                                   <span>{item.name} <span className="text-slate-400 text-xs">({item.name === item.name ? '' : 'Patungan'})</span></span>
                                   <span className="font-mono text-slate-800">Rp {Math.round(item.priceShare).toLocaleString()}</span>
                                </div>
                             ))}
                          </div>
                          <div className="border-t border-slate-200 my-2 pt-2 space-y-1">
                             <div className="flex justify-between text-xs text-slate-500">
                                <span>Subtotal</span>
                                <span>Rp {Math.round(data.subtotal).toLocaleString()}</span>
                             </div>
                             <div className="flex justify-between text-xs text-slate-500">
                                <span>Tax, Service, dll</span>
                                <span>+ Rp {Math.round(data.extraCharge).toLocaleString()}</span>
                             </div>
                          </div>
                          <div className="flex justify-between text-sm font-bold text-indigo-700 border-t border-indigo-100 pt-2 mt-2">
                             <span>Total Bayar</span>
                             <span>Rp {Math.ceil(data.total).toLocaleString()}</span>
                          </div>
                       </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl mt-6">
               <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-400 text-sm font-medium">Subtotal Menu</span>
                  <span className="font-mono text-slate-200">Rp {Math.round(totalSubtotalAll).toLocaleString()}</span>
               </div>
               <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-700">
                  <span className="text-slate-400 text-sm font-medium">Total Extra (Tax/Svc)</span>
                  <span className="font-mono text-slate-200">+ Rp {Math.round(grandTotal - totalSubtotalAll).toLocaleString()}</span>
               </div>
               <div className="flex justify-between items-end">
                  <div>
                     <span className="text-slate-400 text-xs uppercase tracking-widest font-bold block mb-1">Total Keseluruhan</span>
                     <h2 className="text-3xl font-extrabold tracking-tight">Rp {Math.ceil(grandTotal).toLocaleString()}</h2>
                  </div>
                  <div className="bg-white/10 p-2 rounded-xl">
                     <Receipt size={24} className="text-indigo-400" />
                  </div>
               </div>
            </div>
          </div>
        )}

      </div>

      {/* ACTION BUTTON */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-xl border-t border-slate-200 z-40 safe-area-bottom shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
        <div className="max-w-md mx-auto">
          {step === 1 && (
            <button onClick={handleProcess} disabled={!image || friends.length === 0 || isLoading} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-indigo-300 hover:bg-indigo-700 hover:-translate-y-1 active:translate-y-0 disabled:bg-slate-300 disabled:shadow-none disabled:transform-none transition-all flex justify-center items-center gap-3">
              <Sparkles size={20} fill="currentColor" /> Scan & Bagi Tagihan
            </button>
          )}
          {step === 2 && (
             <button onClick={calculateResult} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg shadow-xl hover:bg-slate-800 active:scale-[0.98] transition flex justify-center items-center gap-2">Hitung Total <ChevronRight /></button>
          )}
          {step === 3 && (
            <button onClick={triggerReset} className="w-full bg-slate-100 text-slate-700 py-4 rounded-2xl font-bold text-lg hover:bg-slate-200 transition">Scan Lagi</button>
          )}
        </div>
      </div>
    </main>
  );
}