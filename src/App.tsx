import { useState, useEffect, FormEvent, ChangeEvent, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Phone, Send, MapPin, Calendar, CheckCircle2, ChevronRight, 
  Hash, LayoutDashboard, LogOut, Trash2, Search, Filter, Mail, Lock, Eye, EyeOff, HelpCircle, X, Info,
  ShieldCheck, Home, ArrowRight, Download
} from 'lucide-react';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp, Timestamp, writeBatch } from 'firebase/firestore';
import { 
  onAuthStateChanged, 
  User as FirebaseUser, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { db, auth, signInWithGoogle } from './firebase';
import { UZBEKISTAN_REGIONS, UZBEKISTAN_DATA, NEIGHBORHOOD_SAMPLES } from './constants';

interface FormData {
  firstName: string;
  lastName: string;
  phone: string;
  telegram: string;
  region: string;
  district: string;
  neighborhood: string;
  age: string;
}

interface RegistrationRecord extends FormData {
  id: string;
  createdAt: Timestamp;
}

export default function App() {
  const [view, setView] = useState<'form' | 'admin' | 'auth'>('form');
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot-password'>('login');
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState<{success: boolean, message?: string} | null>(null);
  const [botConfigured, setBotConfigured] = useState<boolean | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean, message: string} | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [adminFilters, setAdminFilters] = useState({
    region: '',
    district: '',
    neighborhood: ''
  });

  // Auth form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    phone: '+998',
    telegram: '',
    region: '',
    district: '',
    neighborhood: '',
    age: '',
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const isAdmin = user?.email === 'eyfelchik@gmail.com' || user?.email === 'cinselc@gmail.com';

  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const handleAuth = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError('');
    try {
      if (authMode === 'signup') {
        await createUserWithEmailAndPassword(auth, email, password);
        setView('form');
      } else if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        setView('form');
      } else if (authMode === 'forgot-password') {
        await sendPasswordResetEmail(auth, email);
        setResetSent(true);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderHelp = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
      onClick={() => setShowHelp(false)}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-card rounded-[40px] w-full max-w-lg overflow-hidden border border-slate-200/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600/10 text-blue-600 rounded-2xl flex items-center justify-center">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-xl">Yordam markazi</h3>
              <p className="text-xs text-slate-500">TURON ROBOTICS PARK bo'yicha yo'riqnoma</p>
            </div>
          </div>
          <button 
            onClick={() => setShowHelp(false)}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all text-slate-500 hover:text-slate-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-10 space-y-10 overflow-y-auto max-h-[70vh]">
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.3)]" />
              <h4 className="text-slate-900 font-bold text-lg">Foydalanish tartibi</h4>
            </div>
            <ul className="space-y-6">
              {[
                "Ro'yxatdan o'tish formasidagi barcha majburiy maydonlarni to'ldiring.",
                "Telefon raqamingizni +998 formatida to'g'ri kiriting.",
                "Ma'lumotlar yuborilgach, operatorlarimiz siz bilan bog'lanadi."
              ].map((item, idx) => (
                <li key={idx} className="flex gap-4 items-start group">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600/10 text-blue-600 flex items-center justify-center rounded-lg text-xs font-bold border border-blue-600/20 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    {idx + 1}
                  </span>
                  <span className="text-sm text-slate-600 leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-6 text-slate-600 text-sm">
             <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-indigo-600 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.3)]" />
              <h4 className="text-slate-900 font-bold text-lg">Adminlar uchun</h4>
            </div>
            <p className="leading-relaxed">Administratorlar ariza qoldirgan barcha foydalanuvchilar ro'yxatini ko'rish, qidirish va o'chirish imkoniyatiga ega.</p>
            <p className="text-xs italic bg-slate-100 p-4 rounded-xl border border-slate-200">Kirish uchun yuqoridagi "Kirish" tugmasi orqali avtorizatsiyadan o'ting.</p>
          </section>

          <section className="space-y-4">
            <div className="p-6 rounded-3xl bg-blue-600/5 border border-blue-600/10">
              <div className="flex items-center gap-3 mb-3 text-blue-600">
                <ShieldCheck className="w-5 h-5" />
                <h4 className="font-bold">Xavfsizlik</h4>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">Sizning shaxsiy ma'lumotlaringiz xavfsiz saqlanadi va uchinchi shaxslarga berilmaydi.</p>
            </div>
          </section>
        </div>


      </motion.div>
    </motion.div>
  );

  const renderAuth = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card p-10 rounded-[40px] max-w-md mx-auto relative z-10"
    >
      <div className="text-center mb-10">
        <h2 className="text-3xl font-extrabold text-slate-900 mb-3">
          {authMode === 'login' ? 'Xush Kelibsiz' : (authMode === 'signup' ? 'Hisob Yarating' : 'Parolni Tiklash')}
        </h2>
        <p className="text-slate-500">
          {authMode === 'login' 
            ? 'Portalga kirish uchun ma\'lumotlaringizni kiriting' 
            : (authMode === 'signup' ? 'Yangi hisob yarating' : 'Emailingizga tiklash havolasini yuboramiz')}
        </p>
      </div>

      {resetSent ? (
        <div className="text-center space-y-8 py-6">
          <div className="w-20 h-20 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="space-y-3">
            <h4 className="text-xl font-bold text-slate-900">Email yuborildi!</h4>
            <p className="text-slate-500 text-sm leading-relaxed">
              Parolni tiklash uchun ko'rsatmalar <br /><b className="text-slate-900">{email}</b> manziliga yuborildi.
            </p>
          </div>
          <button
            onClick={() => {
              setAuthMode('login');
              setResetSent(false);
            }}
            className="w-full py-4 rounded-2xl bg-slate-100 border border-slate-200 text-slate-900 font-bold hover:bg-slate-200 transition-all"
          >
            Kirish sahifasiga qaytish
          </button>
        </div>
      ) : (
        <form onSubmit={handleAuth} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                required
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl glass-input"
                placeholder="example@mail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {authMode !== 'forgot-password' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <label className="text-sm font-semibold text-slate-700">Parol</label>
                {authMode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setAuthMode('forgot-password')}
                    className="text-xs text-blue-600 font-bold hover:text-blue-500 transition-colors"
                  >
                    Unutdingizmi?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full pl-12 pr-12 py-3.5 rounded-2xl glass-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}

          {authError && (
            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-center">
              <p className="text-sm text-red-600 font-medium">{authError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
            ) : (
              authMode === 'login' ? 'Kirish' : (authMode === 'signup' ? 'Ro\'yxatdan o\'tish' : 'Emailni yuborish')
            )}
          </button>

          {authMode !== 'forgot-password' && (
            <div className="space-y-6">
              <div className="relative text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <span className="relative px-4 bg-white text-sm text-slate-500 uppercase tracking-widest font-bold">Yoki</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  signInWithGoogle();
                  setView('form');
                }}
                className="w-full py-4 rounded-2xl border border-slate-200 text-slate-900 font-bold flex items-center justify-center gap-3 hover:bg-slate-50 transition-all"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Google orqali kirish
              </button>
            </div>
          )}

          <div className="text-center pt-2">
            {authMode === 'login' ? (
              <p className="text-slate-500 text-sm">
                Hisobingiz yo'qmi?
                <button
                  type="button"
                  onClick={() => setAuthMode('signup')}
                  className="ml-2 text-blue-600 font-bold hover:text-blue-500 transition-colors"
                >
                  Ro'yxatdan o'ting
                </button>
              </p>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setResetSent(false);
                }}
                className="text-blue-600 font-bold hover:text-blue-500 flex items-center justify-center gap-2 mx-auto transition-colors text-sm"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                Kirish sahifasiga qaytish
              </button>
            )}
          </div>
        </form>
      )}
    </motion.div>
  );

  const fetchRegistrations = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'registrations'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RegistrationRecord));
      setRegistrations(data);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (view === 'admin' && isAdmin) {
      fetchRegistrations();
      checkBotStatus();
    }
  }, [view, isAdmin]);

  const checkBotStatus = async () => {
    try {
      const res = await fetch("/api/bot-status");
      const data = await res.json();
      setBotConfigured(data.isConfigured);
    } catch (err) {
      console.error("Bot status check error:", err);
    }
  };

  const handleTestBot = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/test-telegram", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setTestResult({ success: true, message: "Bot muvaffaqiyatli ulandi! Telegram guruhingizni tekshiring." });
      } else {
        setTestResult({ success: false, message: data.error || "Xatolik yuz berdi" });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setTestLoading(false);
    }
  };

  const neighborhoodOptions = formData.district ? NEIGHBORHOOD_SAMPLES[formData.district] || [] : [];

  const validate = () => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!formData.firstName.trim()) newErrors.firstName = "Ismingizni kiriting";
    if (!formData.lastName.trim()) newErrors.lastName = "Familiyangizni kiriting";
    if (formData.phone.length < 13) newErrors.phone = "Telefon raqamini to'liq kiriting";
    if (!formData.telegram.trim()) newErrors.telegram = "Telegram foydalanuvchi nomini kiriting";
    if (!formData.region) newErrors.region = "Viloyatni tanlang";
    if (!formData.district.trim()) newErrors.district = "Tumanni tanlang";
    if (!formData.neighborhood.trim()) newErrors.neighborhood = "Mahallani tanlang";
    
    const ageNum = parseInt(formData.age);
    if (!formData.age) {
      newErrors.age = "Yoshingizni kiriting";
    } else if (isNaN(ageNum) || ageNum < 10 || ageNum > 20) {
      newErrors.age = "Yoshingiz 10 va 20 oralig'ida bo'lishi kerak";
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.keys(newErrors)[0] as keyof FormData;
      const element = document.getElementsByName(firstError)[0];
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setLoading(true);
      setTelegramStatus(null);
      try {
        await addDoc(collection(db, 'registrations'), {
          ...formData,
          age: parseInt(formData.age),
          createdAt: serverTimestamp()
        });
        
        // Send Telegram notification
        try {
          const res = await fetch("/api/notify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data: formData }),
          });
          
          const contentType = res.headers.get("content-type");
          let result;
          
          if (contentType && contentType.includes("application/json")) {
            result = await res.json();
            if (res.ok) {
              setTelegramStatus({ success: true });
            } else {
              setTelegramStatus({ success: false, message: result.details || result.error || "Noma'lum xatolik" });
              console.error("Telegram notification failed:", result);
            }
          } else {
            const errorText = await res.text();
            console.error("Non-JSON response from server:", errorText);
            setTelegramStatus({ 
              success: false, 
              message: `Server noto'g'ri formatda javob qaytardi (${res.status}). Iltimos, server sozlamalarini tekshiring.` 
            });
          }
        } catch (notifyErr: any) {
          console.error("Failed to send Telegram notification:", notifyErr);
          setTelegramStatus({ success: false, message: notifyErr.message });
        }

        setIsSubmitted(true);
        setFormData({
          firstName: '', lastName: '', phone: '+998', telegram: '',
          region: '', district: '', neighborhood: '', age: ''
        });
      } catch (err) {
        console.error("Submission error:", err);
        alert("Xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Haqiqatdan ham ushbu ma'lumotni o'chirishni xohlaysizmi?")) return;
    setIsDeleting(id);
    try {
      await deleteDoc(doc(db, 'registrations', id));
      setRegistrations(prev => prev.filter(r => r.id !== id));
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    } catch (err) {
      console.error("Delete error:", err);
      alert("O'chirishda xatolik yuz berdi");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!window.confirm(`Haqiqatdan ham tanlangan ${selectedIds.length} ta ma'lumotni o'chirishni xohlaysizmi?`)) return;
    
    setIsBulkDeleting(true);
    try {
      const batch = writeBatch(db);
      selectedIds.forEach(id => {
        batch.delete(doc(db, 'registrations', id));
      });
      await batch.commit();
      
      setRegistrations(prev => prev.filter(r => !selectedIds.includes(r.id)));
      setSelectedIds([]);
    } catch (error) {
      console.error('Bulk deletion error:', error);
      alert('Tanlangan ma\'lumotlarni o\'chirishda xatolik yuz berdi');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredRegistrations.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRegistrations.map(r => r.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleDownloadCSV = () => {
    if (!filteredRegistrations.length) return;
    
    const headers = ["Ism", "Familiya", "Telefon", "Telegram", "Viloyat", "Tuman", "Mahalla", "Yosh", "Sana"];
    const rows = filteredRegistrations.map(r => [
      r.firstName,
      r.lastName,
      r.phone,
      `@${r.telegram}`,
      r.region,
      r.district,
      r.neighborhood,
      r.age,
      r.createdAt?.toDate().toLocaleDateString()
    ]);

    const csvContent = "\uFEFF" + [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `registrations_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRegistrations = useMemo(() => {
    return registrations.filter(r => {
      const matchesSearch = 
        r.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.phone.includes(searchTerm) ||
        r.telegram.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRegion = !adminFilters.region || r.region === adminFilters.region;
      const matchesDistrict = !adminFilters.district || r.district === adminFilters.district;
      const matchesNeighborhood = !adminFilters.neighborhood || r.neighborhood.toLowerCase().includes(adminFilters.neighborhood.toLowerCase());

      return matchesSearch && matchesRegion && matchesDistrict && matchesNeighborhood;
    });
  }, [registrations, searchTerm, adminFilters]);

  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (!value.startsWith('+998')) value = '+998';
    const numbers = value.slice(4).replace(/\D/g, '');
    setFormData({ ...formData, phone: '+998' + numbers.slice(0, 9) });
  };

  const renderForm = () => {
    const districts = formData.region ? UZBEKISTAN_DATA[formData.region] || [] : [];
    
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card max-w-2xl w-full p-8 md:p-12 rounded-[40px] mx-auto"
      >
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
          Online Ro'yxatdan O'tish
        </h1>
        <p className="text-slate-500 text-lg">Iltimos, barcha maydonlarni diqqat bilan to'ldiring.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* First Name */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700 ml-1">Ismingiz</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                name="firstName"
                type="text"
                placeholder="Masalan: Aziz"
                className={`w-full pl-12 pr-4 py-3.5 rounded-2xl glass-input ${errors.firstName ? 'border-red-500/50' : ''}`}
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>
            {errors.firstName && <p className="text-xs text-red-600 ml-1">{errors.firstName}</p>}
          </div>

          {/* Last Name */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700 ml-1">Familiyangiz</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                name="lastName"
                type="text"
                placeholder="Masalan: Karimov"
                className={`w-full pl-12 pr-4 py-3.5 rounded-2xl glass-input ${errors.lastName ? 'border-red-500/50' : ''}`}
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
            {errors.lastName && <p className="text-xs text-red-600 ml-1">{errors.lastName}</p>}
          </div>

          {/* Phone */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700 ml-1">Telefon raqami</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                name="phone"
                type="tel"
                placeholder="+998 90 123 45 67"
                className={`w-full pl-12 pr-4 py-3.5 rounded-2xl glass-input ${errors.phone ? 'border-red-500/50' : ''}`}
                value={formData.phone}
                onChange={handlePhoneChange}
              />
            </div>
            {errors.phone && <p className="text-xs text-red-600 ml-1">{errors.phone}</p>}
          </div>

          {/* Age */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700 ml-1">Yoshingiz (10-20)</label>
            <div className="relative">
              <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                name="age"
                type="number"
                placeholder="15"
                className={`w-full pl-12 pr-4 py-3.5 rounded-2xl glass-input ${errors.age ? 'border-red-500/50' : ''}`}
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              />
            </div>
            {errors.age && <p className="text-xs text-red-600 ml-1">{errors.age}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Region */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700 ml-1">Viloyat</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select
                name="region"
                className={`w-full pl-12 pr-10 py-3.5 rounded-2xl glass-input appearance-none cursor-pointer ${errors.region ? 'border-red-500/50' : ''}`}
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value, district: '', neighborhood: '' })}
              >
                <option value="" className="bg-white">Viloyatni tanlang</option>
                {UZBEKISTAN_REGIONS.map(region => (
                  <option key={region} value={region} className="bg-white">{region}</option>
                ))}
              </select>
              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
            </div>
            {errors.region && <p className="text-xs text-red-600 ml-1">{errors.region}</p>}
          </div>

          {/* District */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700 ml-1">Tuman</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select
                name="district"
                disabled={!formData.region}
                className={`w-full pl-12 pr-10 py-3.5 rounded-2xl glass-input appearance-none cursor-pointer disabled:opacity-30 ${errors.district ? 'border-red-500/50' : ''}`}
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value, neighborhood: '' })}
              >
                <option value="" className="bg-white">Tumanni tanlang</option>
                {districts.map(district => (
                  <option key={district} value={district} className="bg-white">{district}</option>
                ))}
              </select>
              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
            </div>
            {errors.district && <p className="text-xs text-red-600 ml-1">{errors.district}</p>}
          </div>
        </div>

        {/* Neighborhood */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-700 ml-1">Mahalla</label>
          <div className="relative group">
            <Home className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              list="neighborhoods"
              name="neighborhood"
              placeholder={formData.district ? "Mahalla nomini tanlang yoki yozing" : "Avval tumanni tanlang"}
              disabled={!formData.district}
              className={`w-full pl-12 pr-4 py-3.5 rounded-2xl glass-input disabled:opacity-30 ${errors.neighborhood ? 'border-red-500/50' : ''}`}
              value={formData.neighborhood}
              onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
            />
            <datalist id="neighborhoods">
              {neighborhoodOptions.map(option => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </div>
          {errors.neighborhood && <p className="text-xs text-red-600 ml-1">{errors.neighborhood}</p>}
        </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700 ml-1">Telegram foydalanuvchi nomi</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-slate-400 font-bold">@</div>
              <input
                name="telegram"
                type="text"
                placeholder="username"
                className={`w-full pl-12 pr-4 py-3.5 rounded-2xl glass-input ${errors.telegram ? 'border-red-500/50' : ''}`}
                value={formData.telegram}
                onChange={(e) => {
                  let val = e.target.value;
                  val = val.replace(/https?:\/\/t\.me\//, '');
                  val = val.replace('@', '');
                  setFormData({ ...formData, telegram: val });
                }}
              />
            </div>
            {errors.telegram && <p className="text-xs text-red-600 ml-1">{errors.telegram}</p>}
          </div>

        <div className="pt-6">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl hover:from-blue-500 hover:to-indigo-500 transition-all shadow-xl shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group flex items-center justify-center gap-3"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Ariza Topshirish
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
    );
  };

  const renderAdmin = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-[40px] overflow-hidden"
    >
      <div className="p-10 border-b border-slate-100 space-y-10 bg-white/50 backdrop-blur-xl">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-10">
          <div className="space-y-1">
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Admin Panel</h2>
            <p className="text-slate-500 font-medium">Barcha arizalar va statistikalar boshqaruvi</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 xl:justify-end flex-1">
            <div className="relative group flex-1 min-w-[280px] max-w-md">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-all duration-300 group-focus-within:scale-110" />
              <input 
                type="text"
                placeholder="Ism, raqam yoki telegram..."
                className="w-full pl-14 pr-6 py-4 bg-slate-100/50 border border-slate-200 rounded-3xl outline-none focus:border-blue-500/50 focus:bg-white focus:shadow-xl focus:shadow-blue-500/5 transition-all text-sm text-slate-900 placeholder:text-slate-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-1 py-1 bg-slate-100/50 border border-slate-200 rounded-3xl">
                <select 
                  className="pl-4 pr-10 py-3 bg-transparent outline-none text-sm font-bold text-slate-700 cursor-pointer appearance-none min-w-[160px]"
                  value={adminFilters.region}
                  onChange={(e) => setAdminFilters({ ...adminFilters, region: e.target.value, district: '' })}
                >
                  <option value="" className="bg-white">Viloyatlar</option>
                  {UZBEKISTAN_REGIONS.map(reg => (
                    <option key={reg} value={reg} className="bg-white">{reg}</option>
                  ))}
                </select>
                <div className="w-[1px] h-4 bg-slate-200" />
                <select 
                  disabled={!adminFilters.region}
                  className="pl-4 pr-10 py-3 bg-transparent outline-none text-sm font-bold text-slate-700 cursor-pointer appearance-none min-w-[160px] disabled:opacity-30"
                  value={adminFilters.district}
                  onChange={(e) => setAdminFilters({ ...adminFilters, district: e.target.value })}
                >
                  <option value="" className="bg-white">Tumanlar</option>
                  {adminFilters.region && UZBEKISTAN_DATA[adminFilters.region]?.map(dist => (
                    <option key={dist} value={dist} className="bg-white">{dist}</option>
                  ))}
                </select>
                <div className="w-[1px] h-4 bg-slate-200" />
                <input 
                  type="text"
                  placeholder="Mahalla..."
                  className="pl-4 pr-4 py-3 bg-transparent outline-none text-sm font-bold text-slate-700 w-[140px]"
                  value={adminFilters.neighborhood}
                  onChange={(e) => setAdminFilters({ ...adminFilters, neighborhood: e.target.value })}
                />
              </div>

              {(adminFilters.region || searchTerm || adminFilters.neighborhood) && (
                <button 
                  onClick={() => {
                    setAdminFilters({ region: '', district: '', neighborhood: '' });
                    setSearchTerm('');
                  }}
                  className="w-12 h-12 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-full transition-all border border-red-100"
                  title="Tozalash"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
              
              <button 
                onClick={handleDownloadCSV}
                className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 text-slate-600 rounded-full hover:bg-slate-50 hover:text-blue-600 transition-all shadow-sm"
                title="CSV yuklash"
              >
                <Download className="w-5 h-5" />
              </button>

              <button 
                onClick={fetchRegistrations}
                disabled={loading}
                className="w-12 h-12 flex items-center justify-center bg-blue-600 text-white rounded-full shadow-lg shadow-blue-500/20 hover:bg-blue-700 hover:-translate-y-0.5 transition-all active:translate-y-0 disabled:opacity-30"
                title="Yangilash"
              >
                <Filter className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className="bg-white/40 p-8 rounded-[32px] border border-slate-100 group hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-500 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-3xl rounded-full translate-x-12 -translate-y-12" />
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 group-hover:text-blue-600 transition-colors">Jami arizalar</div>
            <div className="text-4xl font-black text-slate-900 flex items-baseline gap-2">
              {filteredRegistrations.length}
              <span className="text-xs font-bold text-slate-400">ta</span>
            </div>
          </div>
          <div className="bg-white/40 p-8 rounded-[32px] border border-slate-100 group hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-500 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-3xl rounded-full translate-x-12 -translate-y-12" />
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 group-hover:text-emerald-600 transition-colors">Bugungilar</div>
            <div className="text-4xl font-black text-slate-900 flex items-baseline gap-2">
              {filteredRegistrations.filter(r => r.createdAt?.toDate().toDateString() === new Date().toDateString()).length}
              <span className="text-xs font-bold text-slate-400">ta</span>
            </div>
          </div>
          <div className="bg-white/40 p-8 rounded-[32px] border border-slate-100 group hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-3xl rounded-full translate-x-12 -translate-y-12" />
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 group-hover:text-indigo-600 transition-colors">Yosh ko'rsatkichi</div>
            <div className="text-4xl font-black text-slate-900 flex items-baseline gap-2">
              {filteredRegistrations.length > 0 
                ? Math.round(filteredRegistrations.reduce((acc, curr) => acc + Number(curr.age), 0) / filteredRegistrations.length) 
                : 0}
              <span className="text-xs font-bold text-slate-400">o'rtacha</span>
            </div>
          </div>
        </div>

        {botConfigured === false ? (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-6 bg-red-50 border border-red-200 rounded-[30px] flex flex-col md:flex-row md:items-center justify-between gap-6"
          >
            <div className="flex items-center gap-4 text-red-700">
              <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center">
                <Info className="w-6 h-6" />
              </div>
              <div className="text-sm">
                <h4 className="font-black text-base mb-0.5">Telegram Bot o'rnatilmagan!</h4> 
                <p className="opacity-80">Yangi arizalar guruhga bormaydi. <code>TELEGRAM_BOT_TOKEN</code> ni sozlang.</p>
              </div>
            </div>
            <a 
              href="https://t.me/BotFather" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-6 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all text-center text-sm"
            >
              @BotFather orqali bot yarating
            </a>
          </motion.div>
        ) : botConfigured === true && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-6 bg-slate-50 border border-slate-200 rounded-[30px] flex flex-col gap-6"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4 text-slate-700">
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="text-sm">
                  <h4 className="font-black text-base mb-0.5">Telegram Bot sozlangan</h4> 
                  <p className="opacity-80 text-xs">Bot arizalarni guruhga yuborishga tayyor.</p>
                </div>
              </div>
              
              <button 
                onClick={handleTestBot}
                disabled={testLoading}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 hover:text-blue-600 transition-all text-sm disabled:opacity-50"
              >
                {testLoading ? (
                  <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Botni sinab ko'rish
              </button>
            </div>

            {testResult && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className={`p-4 rounded-xl text-sm font-medium flex items-center gap-2 ${testResult.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}
              >
                {testResult.success ? <CheckCircle2 className="w-4 h-4" /> : <X className="w-4 h-4" />}
                {testResult.message}
              </motion.div>
            )}
          </motion.div>
        )}
      </div>

      <div className="overflow-x-auto relative min-h-[500px]">
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 bg-white/60 backdrop-blur-md flex items-center justify-center pt-10"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="w-14 h-14 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-sm font-bold text-slate-500 tracking-widest uppercase">Yuklanmoqda...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] border-b border-slate-100">
            <tr>
              <th className="px-10 py-5 w-12">
                <input 
                  type="checkbox" 
                  className="w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                  checked={selectedIds.length > 0 && selectedIds.length === filteredRegistrations.length}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="px-10 py-5">Foydalanuvchi</th>
              <th className="px-10 py-5">Aloqa</th>
              <th className="px-10 py-5">Hudud</th>
              <th className="px-10 py-5 text-center">Yosh</th>
              <th className="px-10 py-5">Sana</th>
              <th className="px-10 py-5 text-right">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredRegistrations.map((reg) => (
              <tr 
                key={reg.id} 
                className={`hover:bg-blue-50/30 transition-all duration-300 group ${selectedIds.includes(reg.id) ? 'bg-blue-50/50' : ''}`}
              >
                <td className="px-10 py-8">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                    checked={selectedIds.includes(reg.id)}
                    onChange={() => toggleSelect(reg.id)}
                  />
                </td>
                <td className="px-10 py-8">
                  <div className="font-bold text-slate-800 text-lg mb-0.5">{reg.firstName} {reg.lastName}</div>
                  <div className="text-[10px] font-medium text-slate-400 tracking-wider">ID: {reg.id.slice(0, 8).toUpperCase()}</div>
                </td>
                <td className="px-10 py-8">
                  <div className="space-y-1.5">
                    <div className="text-sm font-bold text-slate-700 flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                      <Phone className="w-3.5 h-3.5 opacity-50" /> {reg.phone}
                    </div>
                    <a 
                      href={`https://t.me/${reg.telegram}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-xs text-blue-500 font-bold hover:text-blue-700 flex items-center gap-2 transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" /> @{reg.telegram}
                    </a>
                  </div>
                </td>
                <td className="px-10 py-8">
                  <div className="font-bold text-slate-700 text-sm mb-0.5">{reg.region}</div>
                  <div className="text-xs text-slate-400 font-medium">{reg.district}, {reg.neighborhood}</div>
                </td>
                <td className="px-10 py-8 text-center">
                  <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[11px] font-bold tracking-wide shadow-sm transition-transform group-hover:scale-105 ${
                    Number(reg.age) < 15 
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                      : 'bg-blue-50 text-blue-600 border border-blue-100'
                  }`}>
                    {reg.age} yosh
                  </span>
                </td>
                <td className="px-10 py-8">
                  <div className="font-bold text-slate-700 text-sm mb-0.5">{reg.createdAt?.toDate().toLocaleDateString()}</div>
                  <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    {reg.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </td>
                <td className="px-10 py-8 text-right">
                  <div className="flex justify-end items-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                    {isDeleting === reg.id ? (
                      <div className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-600 rounded-2xl border border-red-100">
                        <Trash2 className="w-5 h-5 animate-spin" />
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleDelete(reg.id)}
                        disabled={!!isDeleting}
                        className="w-12 h-12 flex items-center justify-center rounded-2xl text-red-500 bg-red-50/50 border border-red-100 hover:bg-red-500 hover:text-white hover:shadow-lg hover:shadow-red-500/20 transition-all duration-300 active:scale-95 disabled:opacity-30"
                        title="O'chirish"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredRegistrations.length === 0 && !loading && (
              <tr>
                <td colSpan={7} className="px-8 py-32 text-center">
                  <div className="flex flex-col items-center gap-4 opacity-40">
                    <Search className="w-12 h-12 text-slate-400" />
                    <p className="text-lg font-bold text-slate-500">Ma'lumotlar topilmadi</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 bg-white/90 backdrop-blur-2xl p-3 pl-8 rounded-[40px] border border-blue-100 shadow-[0_20px_50px_rgba(37,99,235,0.15)] flex items-center gap-10 min-w-[500px]"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-black shadow-lg shadow-blue-500/30">
                {selectedIds.length}
              </div>
              <span className="text-base font-bold text-slate-700">tanlandi</span>
            </div>
            
            <div className="flex items-center gap-3 flex-1 justify-end">
              <button 
                onClick={() => setSelectedIds([])}
                className="px-6 py-3 text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors"
              >
                Bekor qilish
              </button>
              
              <button 
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
                className="flex items-center gap-3 px-10 py-4 bg-red-500 text-white rounded-[25px] font-black hover:bg-red-600 hover:shadow-xl hover:shadow-red-500/25 transition-all duration-300 disabled:opacity-50 active:scale-95"
              >
                {isBulkDeleting ? (
                  <>
                    <Filter className="w-5 h-5 animate-spin" />
                    O'chirilmoqda...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    Ommaviy o'chirish
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col font-sans">
      {/* Background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/5 blur-[120px] rounded-full" />
      </div>

      <AnimatePresence>
        {showHelp && renderHelp()}
      </AnimatePresence>

      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-7xl w-full mx-auto flex items-center justify-between mb-12 relative z-10"
      >
        <div 
          className="flex items-center gap-3 group cursor-pointer"
          onClick={() => setView('form')}
        >
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-slate-900 tracking-widest text-xl">TURON <span className="text-blue-600">ROBOTICS</span> PARK</span>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowHelp(true)}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-all"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          {isAdmin && (
            <button 
              onClick={() => setView(view === 'admin' ? 'form' : 'admin')}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                view === 'admin' 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              {view === 'admin' ? 'Formaga qaytish' : 'Admin Panel'}
            </button>
          )}

          {user ? (
            <button 
              onClick={() => signOut(auth)}
              className="px-5 py-2.5 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-all font-bold text-sm flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Chiqish
            </button>
          ) : (
            <button 
              onClick={() => setView('auth')}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                view === 'auth'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Kirish
            </button>
          )}
        </div>
      </motion.header>

      <main className="flex-1 flex items-center justify-center relative z-10">
        <div className="w-full">
          {isSubmitted ? (
            <motion.div 
              key="success"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card max-w-md w-full p-10 rounded-[32px] text-center mx-auto"
            >
              <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-blue-600" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-3">Yuborildi!</h2>
              <p className="text-slate-500 mb-6 text-lg">Ma'lumotlaringiz muvaffaqiyatli yuborildi. Tez orada biz siz bilan bog'lanamiz.</p>
              
              {telegramStatus && !telegramStatus.success && (
                <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm">
                  <div className="font-bold mb-1">Telegram xabarnomasi yuborilmadi:</div>
                  <div className="opacity-80 italic">{telegramStatus.message || "Server xatosi"}</div>
                </div>
              )}

              <button 
                onClick={() => setIsSubmitted(false)}
                className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 active:scale-[0.98]"
              >
                Yana ariza topshirish
              </button>
            </motion.div>
          ) : (
            view === 'form' ? renderForm() : (view === 'admin' ? renderAdmin() : renderAuth())
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl w-full mx-auto py-12 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10 border-t border-slate-200 mt-12 px-6">
        <div className="text-slate-500 text-sm">
          © 2026 TURON ROBOTICS PARK. Barcha huquqlar himoyalangan.
        </div>
        <div className="flex gap-8">
          <button className="text-sm text-slate-500 hover:text-slate-900 transition-colors underline decoration-slate-200 underline-offset-4">Biz haqimizda</button>
          <button className="text-sm text-slate-500 hover:text-slate-900 transition-colors underline decoration-slate-200 underline-offset-4">Yordam</button>
          <button className="text-sm text-slate-500 hover:text-slate-900 transition-colors underline decoration-slate-200 underline-offset-4">Maxfiylik</button>
        </div>
      </footer>
    </div>
  );
}
