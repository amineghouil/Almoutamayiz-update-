
import React, { useState } from 'react';
import { User, Lock, Mail, UserPlus, LogIn, Eye, EyeOff, CheckSquare, Square, BookOpen, Sparkles, Users, Gamepad2, AlertCircle, BrainCircuit, ArrowRight, GraduationCap } from 'lucide-react';
import SmartParser from './SmartParser';

interface AuthScreenProps {
  onLogin: (email: string, pass: string) => Promise<void>;
  onRegister: (name: string, email: string, pass: string) => Promise<void>;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, onRegister }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showSmartParser, setShowSmartParser] = useState(false); // State for public parser
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const mapSupabaseError = (msg: string) => {
      if (msg.includes("User already registered") || msg.includes("unique")) return "هذا البريد الإلكتروني مسجل مسبقاً.";
      if (msg.includes("Invalid login credentials")) return "خطأ في معلومات الدخول يرجى التأكد و اعادة المحاولة";
      if (msg.includes("Email not confirmed")) return "يرجى تفعيل حسابك عبر الرابط المرسل لبريدك.";
      if (msg.includes("Password should be at least")) return "كلمة المرور يجب أن تكون 6 أحرف على الأقل.";
      if (msg.includes("CONFIRMATION_SENT")) return "تم إرسال رابط التفعيل إلى بريدك الإلكتروني بنجاح!";
      return msg || "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
        if (isLogin) {
            if (!email || !password) {
                throw new Error("يرجى ملء البريد الإلكتروني وكلمة المرور.");
            }
            await onLogin(email, password);
        } else {
            const reservedNames = ['admin', 'administrator', 'root', 'support', 'مدير', 'ادمن', 'أدمن', 'مشرف', 'الادارة', 'الإدارة'];
            if (reservedNames.some(reserved => name.toLowerCase().includes(reserved))) {
                throw new Error("هذا الاسم محجوز ولا يمكن استخدامه.");
            }

            if (password !== confirmPassword) {
                throw new Error("كلمة المرور وتأكيد كلمة المرور غير متطابقين.");
            }
            if (!agreeTerms) {
                throw new Error("يجب الموافقة على سياسة الخصوصية وشروط الاستخدام.");
            }
            if (!name || !email || !password) {
                throw new Error("يرجى ملء جميع الحقول المطلوبة.");
            }
            await onRegister(name, email, password);
        }
    } catch (err: any) {
        setErrorMsg(mapSupabaseError(err.message || ''));
        setLoading(false);
    }
  };

  // --- PUBLIC SMART PARSER VIEW ---
  if (showSmartParser) {
      return (
          <div className="min-h-screen bg-black text-white p-4 sm:p-8 animate-fadeIn flex flex-col items-center">
              <div className="w-full max-w-3xl">
                  <button 
                      onClick={() => setShowSmartParser(false)}
                      className="mb-8 flex items-center gap-2 px-5 py-3 bg-neutral-900 rounded-xl border border-neutral-800 text-gray-300 hover:text-brand hover:border-brand transition-all shadow-lg"
                  >
                      <ArrowRight className="w-5 h-5" />
                      <span className="font-bold">عودة لتسجيل الدخول</span>
                  </button>
                  
                  <div className="bg-neutral-900/50 p-8 rounded-3xl border border-neutral-800 shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-light/10 rounded-full blur-3xl"></div>
                      <div className="text-center mb-6 relative z-10">
                          <h2 className="text-2xl font-black text-white mb-2">تجربة المعرب الذكي</h2>
                          <p className="text-gray-400">استخدم أدواتنا الذكية مجاناً قبل التسجيل</p>
                      </div>
                      <SmartParser />
                  </div>
              </div>
          </div>
      );
  }

  // --- MAIN AUTH VIEW ---
  return (
    <div className="relative flex flex-col items-center justify-start min-h-screen w-full overflow-y-auto overflow-x-hidden font-cairo text-center bg-black">
      
      {/* ABSTRACT BACKGROUND - Pure Black with Brand Yellow Waves */}
      <div className="fixed inset-0 z-0 bg-black overflow-hidden pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[120%] h-[40%] bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-brand-dark/20 via-black to-black opacity-40 blur-3xl"></div>
          <div className="absolute -top-20 -right-20 w-[600px] h-[600px] bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-brand-dark/10 via-black to-black opacity-20 blur-3xl"></div>
          <div 
              className="absolute inset-0 opacity-[0.03]"
              style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='20' viewBox='0 0 100 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M21.184 20c.357-.13.72-.264 1.088-.402l1.768-.661C33.64 15.347 39.647 14 50 14c10.271 0 15.362 1.222 24.629 4.928.955.383 1.869.74 2.75 1.072h6.225c-2.51-.73-5.139-1.691-8.233-2.928C65.888 12.878 61.4 12 50 12c-11.4 0-15.888.878-25.371 5.072-3.094 1.237-5.723 2.198-8.233 2.928h4.788zM79.559 10.6c.873-.232 1.709-.481 2.512-.728 9.771-3.008 13.906-3.872 17.929-3.872s8.158.864 17.929 3.872c.803.247 1.639.496 2.513.728V9.72c-.896-.263-1.762-.518-2.593-.765C108.312 6.09 103.553 5 95 5c-8.553 0-13.312 1.09-22.849 3.955-.831.247-1.697.502-2.592.765v.88zM50 20c10.63 0 16.035-1.127 25.86-5.056 3.237-1.295 5.922-2.28 8.448-2.944h-5.05c-1.928.45-4.17.96-6.662 1.956C63.837 17.463 59.1 18 50 18c-9.1 0-13.837-.537-22.596-4.044-2.492-.996-4.734-1.506-6.662-1.956h-5.05c2.526.664 5.211 1.649 8.448 2.944C33.965 18.873 39.37 20 50 20zM0 6.07c1.37-.417 2.723-.846 4.075-1.25C13.896 1.883 18.61 1 25 1c6.39 0 11.104.883 20.925 3.82 1.352.404 2.705.833 4.075 1.25V5.19c-1.467-.446-2.903-.893-4.32-1.317C36.19 1.01 31.63 0 25 0c-6.63 0-11.19 1.01-20.68 3.873-1.417.424-2.853.871-4.32 1.317v.88z' fill='%23ffc633' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                  backgroundSize: '200px 40px'
              }}
          />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col items-center justify-center p-6 py-12 gap-8">
        
        <div className="w-full flex flex-col items-center justify-center gap-6 text-center">
            <div className="relative group">
                <div className="absolute -inset-6 bg-brand/10 rounded-full blur-2xl group-hover:bg-brand/20 transition-all duration-500"></div>
                <img 
                    src="https://i.ibb.co/bjLDwBbd/IMG-20250722-114332.png" 
                    alt="Logo" 
                    className="relative w-32 md:w-40 h-auto drop-shadow-2xl mb-4 transform hover:scale-105 transition-transform duration-500 mx-auto"
                />
            </div>
            <h1 className="text-4xl md:text-6xl font-black leading-tight text-white">
                تطبيق <span className="text-brand">المتميز</span>
            </h1>
            
            {/* The Requested Slogan */}
            <div className="relative px-6 py-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm mt-2">
                <p className="text-lg md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-light via-white to-brand-light animate-pulse leading-relaxed">
                    المتميز أكثر من مجرد تطبيق ، المتميز مدرسة إلكترونية
                </p>
            </div>

            <p className="text-base md:text-lg text-slate-300 leading-relaxed font-light max-w-xl">
                بوابتك الشاملة للتحضير للبكالوريا: دروس تفاعلية، أدوات ذكاء اصطناعي، ألعاب تعليمية ومجتمع دراسي متكامل.
            </p>

            {/* PUBLIC TOOL BUTTON */}
            <button 
                onClick={() => setShowSmartParser(true)}
                className="group relative flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-3 rounded-full transition-all hover:scale-105 active:scale-95 shadow-lg backdrop-blur-sm"
            >
                <div className="p-2 bg-gradient-to-tr from-brand to-brand-dim rounded-full shadow-lg group-hover:shadow-brand/50 transition-shadow">
                    <BrainCircuit className="w-5 h-5 text-black" />
                </div>
                <div className="text-right">
                    <span className="block text-xs text-gray-400 font-bold">لست مسجلاً؟</span>
                    <span className="block text-sm text-white font-bold">جرب المعرب الذكي مجاناً</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-white mr-2 rtl:rotate-180" />
            </button>
        </div>

        <div className="w-full max-w-md">
            <div className="glass-panel border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden transition-all duration-300 bg-neutral-900/50 backdrop-blur-md">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-1">
                    {isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
                </h2>
                <p className="text-sm text-slate-400">
                    {isLogin ? 'تابع تقدمك الدراسي من حيث توقفت' : 'انضم إلينا وابدأ رحلة التميز'}
                </p>
            </div>
            
            {errorMsg && (
                <div className={`mb-4 rounded-xl p-3 flex items-center gap-2 text-xs font-bold animate-fadeIn ${errorMsg.includes('بنجاح') ? 'bg-green-500/10 border border-green-500/50 text-green-200' : 'bg-red-500/10 border border-red-500/50 text-red-200'}`}>
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                <div className="relative group animate-fadeIn">
                    <User className="absolute right-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-brand" />
                    <input type="text" placeholder="الاسم الكامل" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pr-12 pl-4 text-white focus:outline-none focus:border-brand transition-colors placeholder:text-slate-500 text-center" required={!isLogin} />
                </div>
                )}
                <div className="relative group">
                    <Mail className="absolute right-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-brand" />
                    <input type="email" placeholder="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pr-12 pl-4 text-white focus:outline-none focus:border-brand transition-colors placeholder:text-slate-500 text-center" required />
                </div>
                <div className="relative group">
                    <Lock className="absolute right-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-brand" />
                    <input type={showPassword ? "text" : "password"} placeholder="كلمة المرور" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pr-12 pl-12 text-white focus:outline-none focus:border-brand transition-colors placeholder:text-slate-500 text-center" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-4 top-3.5 text-slate-500 hover:text-brand transition-colors">{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
                </div>
                {!isLogin && (
                    <div className="relative group animate-fadeIn">
                        <Lock className="absolute right-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-brand" />
                        <input type={showPassword ? "text" : "password"} placeholder="تأكيد كلمة المرور" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={`w-full bg-black/50 border rounded-xl py-3 pr-12 pl-4 text-white focus:outline-none transition-colors placeholder:text-slate-500 text-center ${confirmPassword && password !== confirmPassword ? 'border-red-500' : 'border-white/10 focus:border-brand'}`} required={!isLogin} />
                    </div>
                )}
                {!isLogin && (
                    <div className="flex items-center gap-3 mt-4 animate-fadeIn justify-center">
                        <button type="button" onClick={() => setAgreeTerms(!agreeTerms)} className={`mt-1 transition-colors ${agreeTerms ? 'text-brand' : 'text-slate-500'}`}>{agreeTerms ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}</button>
                        <p className="text-xs text-slate-400 leading-relaxed text-center">أوافق على <span className="text-brand font-bold cursor-pointer hover:underline">سياسة الخصوصية</span> و <span className="text-brand font-bold cursor-pointer hover:underline">شروط الاستخدام</span>.</p>
                    </div>
                )}
                
                {/* 3D BUTTON IMPLEMENTATION */}
                <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full mt-6 bg-brand hover:bg-brand-light text-black font-black py-4 rounded-xl border-b-[6px] border-brand-dark active:border-b-0 active:translate-y-[6px] transition-all flex items-center justify-center gap-2 text-lg shadow-[0_10px_20px_-10px_rgba(255,198,51,0.3)]"
                >
                    {loading ? <div className="w-6 h-6 border-4 border-black border-t-transparent rounded-full animate-spin"></div> : (isLogin ? <LogIn className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />)}
                    <span>{isLogin ? 'دخول' : 'إنشاء الحساب'}</span>
                </button>

                <p className="text-center text-sm text-slate-400 mt-4">
                  {isLogin ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟'}
                  <button type="button" onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); }} className="font-bold text-brand hover:underline mx-2">
                    {isLogin ? 'سجل الآن' : 'ادخل الآن'}
                  </button>
                </p>
            </form>
            </div>
        </div>

        <div className="w-full max-w-5xl mx-auto mt-8 px-4">
            <h3 className="text-slate-400 text-sm mb-6 uppercase tracking-widest font-bold">كل ما يحتاجه الطالب في مكان واحد</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-black/40 backdrop-blur-sm border border-white/10 p-5 rounded-2xl flex flex-col items-center text-center hover:bg-black/50 transition-colors group">
                    <div className="p-3 bg-blue-500/10 rounded-full mb-3 group-hover:bg-blue-500/20 transition-colors">
                        <BookOpen className="w-6 h-6 text-blue-400" />
                    </div>
                    <h3 className="font-bold text-white text-sm mb-1">دروس تفاعلية</h3>
                    <p className="text-[10px] text-slate-400 leading-relaxed">ملخصات شاملة مع نظام تتبع التقدم وإكمال الدروس</p>
                </div>
                <div className="bg-black/40 backdrop-blur-sm border border-white/10 p-5 rounded-2xl flex flex-col items-center text-center hover:bg-black/50 transition-colors group">
                    <div className="p-3 bg-brand/10 rounded-full mb-3 group-hover:bg-brand/20 transition-colors">
                        <Sparkles className="w-6 h-6 text-brand" />
                    </div>
                    <h3 className="font-bold text-white text-sm mb-1">ذكاء اصطناعي</h3>
                    <p className="text-[10px] text-slate-400 leading-relaxed">معرب آلي، مصحح مقالات فلسفية، ومنشئ محتوى فوري</p>
                </div>
                <div className="bg-black/40 backdrop-blur-sm border border-white/10 p-5 rounded-2xl flex flex-col items-center text-center hover:bg-black/50 transition-colors group">
                    <div className="p-3 bg-green-500/10 rounded-full mb-3 group-hover:bg-green-500/20 transition-colors">
                        <GraduationCap className="w-6 h-6 text-green-400" />
                    </div>
                    <h3 className="font-bold text-white text-sm mb-1">استشارات أساتذة</h3>
                    <p className="text-[10px] text-slate-400 leading-relaxed">تواصل مع أساتذة متخصصين لطرح أسئلتك وتلقي الإجابات</p>
                </div>
                <div className="bg-black/40 backdrop-blur-sm border border-white/10 p-5 rounded-2xl flex flex-col items-center text-center hover:bg-black/50 transition-colors group">
                    <div className="p-3 bg-purple-500/10 rounded-full mb-3 group-hover:bg-purple-500/20 transition-colors">
                        <Gamepad2 className="w-6 h-6 text-purple-400" />
                    </div>
                    <h3 className="font-bold text-white text-sm mb-1">ألعاب تعليمية</h3>
                    <p className="text-[10px] text-slate-400 leading-relaxed">تنافس في "من سيربح البكالوريا" ولعبة المطابقة لترسيخ المعلومات</p>
                </div>
            </div>
        </div>

        <div className="mt-4 mb-4 text-center">
            <p className="text-[10px] md:text-xs font-mono text-slate-500 tracking-widest opacity-60">
                تم إنشاء هذا التطبيق من طرف GH.A/2025
            </p>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
