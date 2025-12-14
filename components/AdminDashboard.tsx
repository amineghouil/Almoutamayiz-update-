
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Question, Notification, AdminMessage, LessonContent, LessonBlock, PhilosophyStructuredContent, User } from '../types';
import { 
  PlusCircle, Trash2, Loader2, Save, Edit3, Sparkles, Inbox, 
  Link as LinkIcon, Camera, ImageIcon, ChevronLeft, ChevronDown, X,
  ArrowUp, ArrowDown, Type, AlignLeft, Palette, RotateCcw,
  MessageCircle, Send, LogOut, RefreshCw, AlertCircle, Database, Eye, MoveUp, MoveDown,
  Bell, Gamepad2, CheckCircle, HelpCircle, Layers, Split, LayoutList, Clock
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { 
    LESSON_FORMAT_PROMPT, DATES_FORMAT_PROMPT, TERMS_FORMAT_PROMPT, CHARACTERS_FORMAT_PROMPT, 
    PHILOSOPHY_LESSON_PROMPT, ALL_SUBJECTS_LIST,
    MATH_LAW_PROMPT, MATH_IMAGE_EXTRACT_PROMPT, EXAM_YEARS, FRENCH_HISTORY_TERMS_JSON, FRENCH_TERMS_FORMAT_PROMPT
} from '../constants';
import { getGeminiClient } from '../lib/gemini';
import PhilosophyLessonEditor from './PhilosophyLessonEditor'; 
import LessonRenderer from './LessonRenderer';

interface AdminDashboardProps {
  currentUser: User;
  questions: Question[];
  onAddQuestion: (q: Question) => void;
  onDeleteQuestion: (id: number) => void;
  onLogout: () => void;
  onPlay: () => void;
  onSeedQuestions?: () => void;
}

const SUBJECTS = ALL_SUBJECTS_LIST;

const TRIMESTERS = [
    { id: 't1', label: 'الفصل الأول' },
    { id: 't2', label: 'الفصل الثاني' },
    { id: 't3', label: 'الفصل الثالث' }
];

const EXAM_TYPES = [
    { id: 'bac', label: 'بكالوريا رسمية' },
    { id: 't1', label: 'اختبارات الفصل الأول' },
    { id: 't2', label: 'اختبارات الفصل الثاني' },
    { id: 't3', label: 'اختبارات الفصل الثالث' },
];

const ALL_LESSON_TYPES = [
    { id: 'intellectual', label: 'البناء الفكري (عربية)' },
    { id: 'linguistic', label: 'البناء اللغوي (عربية)' },
    { id: 'criticism', label: 'التقويم النقدي (عربية)' },
    { id: 'philosophy_article', label: 'مقالة فلسفية (منهجية)' },
    { id: 'lessons', label: 'درس عادي (نص وعناوين)' },
    { id: 'dates', label: 'تواريخ وأحداث' },
    { id: 'terms', label: 'مصطلحات' },
    { id: 'characters', label: 'شخصيات' },
    { id: 'definitions', label: 'تعاريف شرعية' },
    { id: 'math_law', label: 'قوانين رياضية' }, 
];

const INPUT_CLASS = "w-full bg-white dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-400 dark:placeholder:text-gray-500 transition-colors";

// --- MATH KEYBOARD COMPONENT ---
const MATH_SYMBOLS = [
    { label: '√', value: '√' }, { label: '²', value: '²' }, { label: 'ⁿ', value: 'ⁿ' },
    { label: '∞', value: '∞' }, { label: '∈', value: '∈' }, { label: '∉', value: '∉' },
    { label: '∪', value: '∪' }, { label: '∩', value: '∩' }, { label: '≡', value: '≡' },
    { label: 'u₀', value: 'u₀' }, { label: 'uₙ', value: 'uₙ' }, { label: 'uₙ₊₁', value: 'uₙ₊₁' },
    { label: '∫', value: '∫' }, { label: '∑', value: '∑' }, { label: '≠', value: '≠' },
    { label: '≤', value: '≤' }, { label: '≥', value: '≥' }, { label: '→', value: '→' },
    { label: 'lim', value: 'lim ' }, { label: 'ln', value: 'ln ' }, { label: 'e', value: 'e' },
    { label: 'π', value: 'π' }, { label: 'Δ', value: 'Δ' }, { label: 'α', value: 'α' },
    { label: 'β', value: 'β' }, { label: 'θ', value: 'θ' }, { label: 'λ', value: 'λ' },
];

const MathKeyboard: React.FC<{onInsert: (s:string)=>void}> = ({ onInsert }) => (
    <div className="bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 p-2 rounded-xl grid grid-cols-6 sm:grid-cols-9 gap-1 mt-2 animate-fadeIn mb-2">
        {MATH_SYMBOLS.map((sym) => (
            <button key={sym.label} onClick={(e) => { e.preventDefault(); onInsert(sym.value); }} className="bg-white dark:bg-neutral-800 hover:bg-blue-50 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-700 rounded-lg py-1.5 text-sm font-bold shadow-sm active:scale-95 transition-transform text-slate-800 dark:text-white">
                {sym.label}
            </button>
        ))}
    </div>
);

const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser, questions, onAddQuestion, onDeleteQuestion, onLogout }) => {
  // Determine role-based restrictions
  const isTeacher = currentUser.role.startsWith('teacher_');
  
  const getTeacherKeywords = (role: string): string[] => {
      if (role === 'teacher_arabic') return ['اللغة العربية', 'أدب عربي', 'الأدب العربي', 'arabic'];
      if (role === 'teacher_philosophy') return ['الفلسفة', 'فلسفة', 'philosophy'];
      if (role === 'teacher_social') return ['الاجتماعيات', 'التاريخ', 'الجغرافيا', 'history'];
      return [];
  };

  const teacherKeywords = isTeacher ? getTeacherKeywords(currentUser.role) : [];
  const teacherTitle = isTeacher ? 
      (currentUser.role === 'teacher_arabic' ? 'أستاذ اللغة العربية' : 
       currentUser.role === 'teacher_philosophy' ? 'أستاذ الفلسفة' : 
       'أستاذ الاجتماعيات') : 'لوحة الإدارة';

  const [activeTab, setActiveTab] = useState<'lessons' | 'game' | 'notifications' | 'inbox' | 'community' | 'exams' | 'ai'>(() => {
      if (isTeacher) return 'inbox';
      const saved = localStorage.getItem('admin_active_tab');
      return (saved as any) || 'lessons';
  });

  const [loading, setLoading] = useState(false);
  const [lessons, setLessons] = useState<LessonContent[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [inbox, setInbox] = useState<AdminMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [replyText, setReplyText] = useState<string>('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);

  // Notifications Form State
  const [notifTitle, setNotifTitle] = useState('');
  const [notifContent, setNotifContent] = useState('');

  // Games State
  const [gameSubTab, setGameSubTab] = useState<'millionaire' | 'matching'>('millionaire');

  // Millionaire Form State
  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({
      text: '',
      options: ['', '', '', ''],
      correctAnswerIndex: 0,
      difficulty: 'easy',
      subject: 'ثقافة عامة'
  });

  // Matching Game Form State
  const [matchSubject, setMatchSubject] = useState('history');
  const [matchTri, setMatchTri] = useState('t1');
  const [matchTitle, setMatchTitle] = useState('');
  const [matchPairs, setMatchPairs] = useState<{left: string, right: string}[]>([{ left: '', right: '' }, { left: '', right: '' }, { left: '', right: '' }]);

  // Exams State
  const [examSub, setExamSub] = useState('arabic');
  const [examType, setExamType] = useState('bac'); 
  const [examLinks, setExamLinks] = useState<Record<number, string>>({});

  // Lesson Editor State
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null);
  const [lessonTitle, setLessonTitle] = useState(() => localStorage.getItem('draft_lesson_title') || '');
  const [lessonSub, setLessonSub] = useState(() => {
      return localStorage.getItem('draft_lesson_sub') || 'arabic';
  });
  const [lessonTri, setLessonTri] = useState(() => localStorage.getItem('draft_lesson_tri') || 't1');
  const [lessonType, setLessonType] = useState(() => localStorage.getItem('draft_lesson_type') || 'lessons');
  const [lessonContentRaw, setLessonContentRaw] = useState(() => localStorage.getItem('draft_lesson_content') || '');
  const [lessonVideoUrl, setLessonVideoUrl] = useState('');
  const [lessonDuration, setLessonDuration] = useState<number>(10); // Default 10 minutes
  const [formattedContent, setFormattedContent] = useState<any>(null); 
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [isEditingPhilosophyLesson, setIsEditingPhilosophyLesson] = useState(false);
  const [editingPhiloLessonData, setEditingPhiloLessonData] = useState<PhilosophyStructuredContent | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Block Editing
  const [expandedLessonId, setExpandedLessonId] = useState<number | null>(null);
  
  // Image Upload
  const [uploadImage, setUploadImage] = useState<string | null>(null);
  const [isExtractingImage, setIsExtractingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const availableLessonTypes = useMemo(() => {
      let types: string[] = [];
      switch (lessonSub) {
          case 'arabic': types = ['intellectual', 'linguistic', 'criticism', 'lessons']; break;
          case 'philosophy': types = ['philosophy_article', 'lessons']; break;
          case 'history': types = ['lessons', 'dates', 'characters', 'terms']; break;
          case 'geography': types = ['lessons', 'terms']; break;
          case 'math': types = ['math_law']; break;
          case 'french': case 'english': types = ['lessons', 'terms']; break;
          case 'islamic': types = ['lessons', 'definitions']; break;
          default: types = ['lessons']; break;
      }
      return types;
  }, [lessonSub]);

  useEffect(() => {
      const types = availableLessonTypes;
      if (!types.includes(lessonType)) setLessonType(types[0]);
  }, [lessonSub, availableLessonTypes]);

  useEffect(() => {
      if (!isTeacher) {
          localStorage.setItem('admin_active_tab', activeTab);
      } else {
          setActiveTab('inbox');
      }
  }, [activeTab, isTeacher]);
  
  useEffect(() => { fetchUnreadCount(); fetchData(); }, [activeTab]);

  // --- POLLING MECHANISM ---
  useEffect(() => {
      if (activeTab === 'inbox') {
          const interval = setInterval(() => {
              // Only poll if not currently replying
              if (!replyingTo) {
                  fetchData();
                  fetchUnreadCount();
              }
          }, 8000);
          return () => clearInterval(interval);
      }
  }, [activeTab, replyingTo]);

  useEffect(() => {
    if (activeTab === 'lessons' && !isTeacher) { fetchFilteredLessons(); }
  }, [activeTab, lessonSub, lessonTri, lessonType, isTeacher]);

  useEffect(() => {
    if (activeTab === 'exams' && !isTeacher) fetchExamsForSubject();
  }, [examSub, examType, activeTab, isTeacher]);

  useEffect(() => {
      if (isTeacher) return;
      localStorage.setItem('draft_lesson_title', lessonTitle);
      localStorage.setItem('draft_lesson_sub', lessonSub);
      localStorage.setItem('draft_lesson_tri', lessonTri);
      localStorage.setItem('draft_lesson_type', lessonType);
      localStorage.setItem('draft_lesson_content', lessonContentRaw);
  }, [lessonTitle, lessonSub, lessonTri, lessonType, lessonContentRaw, isTeacher]);

  const fetchUnreadCount = async () => {
    try {
        const { data } = await supabase.from('admin_messages').select('content').eq('is_replied', false);
        if (data) {
            let relevantMessages = data;
            if (isTeacher && teacherKeywords.length > 0) {
                 relevantMessages = data.filter(m => teacherKeywords.some(k => m.content.includes(k)));
            }
            setUnreadCount(relevantMessages.length);
        }
    } catch (e) {
        console.error("Error fetching unread count:", e);
    }
  };

  const fetchData = async () => {
      if (activeTab === 'notifications' && !isTeacher) {
          const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
          if (data) setNotifications(data as any);
      } else if (activeTab === 'inbox') {
          // Fetch ALL messages from admin_messages
          const { data, error } = await supabase
            .from('admin_messages')
            .select('*')
            .order('created_at', { ascending: false });
            
          if (data) {
              let msgs = data as AdminMessage[];
              if (isTeacher && teacherKeywords.length > 0) {
                  msgs = msgs.filter(m => {
                      return teacherKeywords.some(keyword => m.content.includes(keyword));
                  });
              }
              setInbox(msgs);
          } else if (error) {
              console.error("Error fetching admin messages:", error);
          }
      }
  };

  const fetchFilteredLessons = async () => {
      setLoading(true);
      setExpandedLessonId(null); 
      const sectionId = `${lessonSub}_${lessonTri}_${lessonType}`;
      
      const { data } = await supabase
        .from('lessons_content')
        .select('*')
        .eq('section_id', sectionId)
        .order('created_at', { ascending: true });
        
      if (data) {
          const sortedData = (data as LessonContent[]).sort((a, b) => {
              const orderA = a.order_index ?? 9999;
              const orderB = b.order_index ?? 9999;
              return orderA - orderB;
          });
          setLessons(sortedData);
      }
      setLoading(false);
  };

  // ... (Other functions unchanged: fetchExamsForSubject, handleSaveAllExams, notification handlers, game handlers) ...
  const fetchExamsForSubject = async () => {
      setLoading(true);
      const subjectName = SUBJECTS.find(s => s.id === examSub)?.name || '';
      
      let query = supabase.from('exams')
          .select('*')
          .eq('subject', subjectName);
          
      if (examType === 'bac') {
          query = query.or('type.eq.bac,type.is.null');
      } else {
          query = query.eq('type', examType);
      }
      
      const { data } = await query;
      
      const links: Record<number, string> = {};
      if (data) {
          data.forEach((e: any) => {
              if (e.year) links[e.year] = e.pdf_url;
          });
      }
      setExamLinks(links);
      setLoading(false);
  };

  const handleSaveAllExams = async () => {
      setLoading(true);
      const subjectName = SUBJECTS.find(s => s.id === examSub)?.name || '';
      try {
          for (const year of EXAM_YEARS) {
              const link = examLinks[year]?.trim();
              
              if (examType === 'bac') {
                  await supabase.from('exams').delete().eq('subject', subjectName).eq('year', year).eq('type', 'bac');
                  await supabase.from('exams').delete().eq('subject', subjectName).eq('year', year).is('type', null);
              } else {
                  await supabase.from('exams').delete().eq('subject', subjectName).eq('year', year).eq('type', examType);
              }

              if (link) {
                  const { error: insError } = await supabase.from('exams').insert({
                      subject: subjectName,
                      year: year,
                      pdf_url: link,
                      type: examType
                  });
                  if (insError) throw insError;
              }
          }
          window.addToast("تم حفظ المواضيع بنجاح", 'success');
          await fetchExamsForSubject();
      } catch (e: any) {
          console.error(e);
          window.addToast("حدث خطأ أثناء الحفظ. تحقق من الاتصال.", 'error');
      } finally {
          setLoading(false);
      }
  };

  const handleSendNotification = async () => {
      if (!notifTitle || !notifContent) return alert("الرجاء ملء العنوان والمحتوى");
      setLoading(true);
      try {
          const { error } = await supabase.from('notifications').insert({
              title: notifTitle,
              content: notifContent,
              created_at: new Date().toISOString()
          });
          if (error) throw error;
          window.addToast("تم إرسال الإشعار بنجاح", 'success');
          setNotifTitle('');
          setNotifContent('');
          fetchData();
      } catch (e: any) {
          alert("خطأ: " + e.message);
      } finally {
          setLoading(false);
      }
  };

  const handleDeleteNotification = async (id: number) => {
      if (!confirm("حذف الإشعار؟")) return;
      await supabase.from('notifications').delete().eq('id', id);
      fetchData();
  };

  const handleAddQuestionSubmit = () => {
      if (!newQuestion.text || !newQuestion.options || newQuestion.options.some(o => !o)) {
          return alert("يرجى ملء السؤال وجميع الخيارات");
      }
      onAddQuestion(newQuestion as Question);
      setNewQuestion({
          text: '',
          options: ['', '', '', ''],
          correctAnswerIndex: 0,
          difficulty: 'easy',
          subject: newQuestion.subject // Keep previous subject
      });
      window.addToast("تم إضافة السؤال بنجاح", 'success');
  };

  const handleAddMatchingPair = () => {
      setMatchPairs([...matchPairs, { left: '', right: '' }]);
  };

  const handleRemoveMatchingPair = (index: number) => {
      setMatchPairs(matchPairs.filter((_, i) => i !== index));
  };

  const handleUpdateMatchingPair = (index: number, field: 'left' | 'right', value: string) => {
      const newPairs = [...matchPairs];
      newPairs[index][field] = value;
      setMatchPairs(newPairs);
  };

  const handleSaveMatchingGame = async () => {
      if (!matchTitle.trim()) return alert("يرجى إدخال عنوان للعبة/الدرس");
      const validPairs = matchPairs.filter(p => p.left.trim() && p.right.trim());
      if (validPairs.length < 5) return alert("يجب إضافة 5 أزواج على الأقل لإنشاء لعبة مطابقة");

      setLoading(true);
      try {
          const blocks = validPairs.map((pair, idx) => ({
              id: `match_pair_${Date.now()}_${idx}`,
              type: 'term_entry',
              text: pair.left,
              extra_1: pair.right,
              color: 'blue'
          }));

          const lessonData = {
              section_id: `${matchSubject}_${matchTri}_terms`,
              title: matchTitle,
              subtitle: 'لعبة مطابقة تفاعلية',
              content: JSON.stringify({
                  type: 'standard',
                  blocks: blocks
              }),
              subject: SUBJECTS.find(s => s.id === matchSubject)?.name || matchSubject,
              color: 'purple',
              order_index: Date.now(),
              duration: 10 // Default duration
          };

          const { error } = await supabase.from('lessons_content').insert(lessonData);
          if (error) throw error;

          window.addToast("تم حفظ لعبة المطابقة بنجاح!", 'success');
          setMatchTitle('');
          setMatchPairs([{ left: '', right: '' }, { left: '', right: '' }, { left: '', right: '' }]);
      } catch (e: any) {
          alert("خطأ: " + e.message);
      } finally {
          setLoading(false);
      }
  };

  const handleAiFormat = async () => {
      if (!lessonContentRaw.trim()) {
          window.addToast("يرجى إدخال نص الدرس أولاً", 'error');
          return;
      }
      setIsProcessingAI(true);
      try {
          const client = getGeminiClient();
          let prompt = LESSON_FORMAT_PROMPT;
          
          if (lessonType === 'dates') prompt = DATES_FORMAT_PROMPT;
          else if (lessonType === 'terms') {
              if (lessonSub === 'french' || lessonSub === 'english') {
                  prompt = FRENCH_TERMS_FORMAT_PROMPT;
              }
              else prompt = TERMS_FORMAT_PROMPT;
          }
          else if (lessonType === 'characters') prompt = CHARACTERS_FORMAT_PROMPT;
          else if (lessonType === 'philosophy_article') prompt = PHILOSOPHY_LESSON_PROMPT;
          else if (lessonType === 'math_law') prompt = MATH_LAW_PROMPT;

          const response = await client.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt + "\n\nالنص المراد تنسيقه:\n" + lessonContentRaw
          });
          
          let jsonStr = response.text || '';
          jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
          
          const startArr = jsonStr.indexOf('[');
          const startObj = jsonStr.indexOf('{');
          
          let startIndex = -1;
          if (startArr !== -1 && (startObj === -1 || startArr < startObj)) startIndex = startArr;
          else if (startObj !== -1) startIndex = startObj;
          
          if (startIndex !== -1) {
              const lastArr = jsonStr.lastIndexOf(']');
              const lastObj = jsonStr.lastIndexOf('}');
              const endIndex = Math.max(lastArr, lastObj);
              if (endIndex !== -1) {
                  jsonStr = jsonStr.substring(startIndex, endIndex + 1);
              }
          }

          if (jsonStr) {
              try {
                  const parsed = JSON.parse(jsonStr);
                  
                  if (lessonType === 'philosophy_article' && parsed.type === 'philosophy_structured') {
                       setEditingPhiloLessonData(parsed);
                       setIsEditingPhilosophyLesson(true);
                       if (parsed.videoUrl) setLessonVideoUrl(parsed.videoUrl);
                       setFormattedContent(parsed);
                  } else {
                       setIsEditingPhilosophyLesson(false);
                       
                       let blocks: any[] = [];
                       if (Array.isArray(parsed)) blocks = parsed;
                       else if (parsed.blocks) blocks = parsed.blocks;
                       
                       const normalized = blocks.map((b: any, idx: number) => {
                           const mainText = b.text || b.term || b.word || b.titre || '';
                           const subText = b.extra_1 || b.definition || b.meaning || b.translation || b.traduction || '';
                           
                           return {
                               ...b,
                               id: `blk_${Date.now()}_${idx}_${Math.random().toString(36).substr(2,9)}`,
                               text: mainText,
                               extra_1: subText,
                               type: b.type || (lessonType === 'terms' ? 'term_entry' : 'paragraph')
                           };
                       });
                       
                       setFormattedContent(normalized);
                  }
                  window.addToast("تم التنسيق بنجاح", 'success');
              } catch (parseError) {
                  console.error(parseError);
                  window.addToast("فشل تحليل رد الذكاء الاصطناعي (JSON غير صالح)", 'error');
              }
          } else {
              window.addToast("لم يتم استلام رد صالح من الذكاء الاصطناعي", 'error');
          }
      } catch (e: any) {
          console.error(e);
          window.addToast(`خطأ في الاتصال بالذكاء الاصطناعي: ${e.message}`, 'error');
      } finally {
          setIsProcessingAI(false);
      }
  };

  const handleSaveLesson = async () => {
      if (!lessonTitle || !formattedContent) return alert("يرجى ملء العنوان والمحتوى");
      
      setLoading(true);
      
      let finalContent = formattedContent;
      
      if (Array.isArray(formattedContent) || (formattedContent.blocks)) {
           let blocks = Array.isArray(formattedContent) ? formattedContent : formattedContent.blocks;
           blocks = blocks.map((b: any, idx: number) => ({ ...b, id: b.id || `blk_${Date.now()}_${idx}` }));
           
           if (lessonType !== 'philosophy_article') { 
               finalContent = {
                   type: 'standard',
                   videoUrl: lessonVideoUrl,
                   blocks: blocks
               };
           }
      }

      if (isEditingPhilosophyLesson && editingPhiloLessonData) {
          finalContent = { ...editingPhiloLessonData, videoUrl: lessonVideoUrl };
      }

      const lessonData = {
          section_id: `${lessonSub}_${lessonTri}_${lessonType}`,
          title: lessonTitle,
          subtitle: '',
          content: JSON.stringify(finalContent),
          subject: SUBJECTS.find(s=>s.id===lessonSub)?.name || lessonSub,
          color: 'blue',
          order_index: editingLessonId ? undefined : (lessons.length + 1),
          duration: lessonDuration
      };

      if (editingLessonId) {
          await supabase.from('lessons_content').update(lessonData).eq('id', editingLessonId);
          setEditingLessonId(null);
      } else {
          await supabase.from('lessons_content').insert(lessonData);
      }
      
      setLessonTitle('');
      setLessonContentRaw('');
      setFormattedContent(null);
      setLessonVideoUrl('');
      setIsEditingPhilosophyLesson(false);
      setLessonDuration(10);
      
      fetchFilteredLessons();
      setLoading(false);
      window.addToast('تم حفظ الدرس بنجاح', 'success');
  };

  // ... (handleMoveLesson, handleImageExtract unchanged) ...
  const handleMoveLesson = async (index: number, direction: 'up' | 'down') => {
      const newLessons = [...lessons];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;

      if (targetIndex < 0 || targetIndex >= newLessons.length) return;

      setLoading(true);

      const temp = newLessons[index];
      newLessons[index] = newLessons[targetIndex];
      newLessons[targetIndex] = temp;
      
      setLessons(newLessons);

      try {
          const item1 = newLessons[index];
          const item2 = newLessons[targetIndex];
          
          const order1 = index + 1; 
          const order2 = targetIndex + 1;

          await supabase.from('lessons_content').update({ order_index: order1 }).eq('id', item1.id);
          await supabase.from('lessons_content').update({ order_index: order2 }).eq('id', item2.id);
          
      } catch (e) {
          console.error("Order update failed", e);
          fetchFilteredLessons(); // Revert
      } finally {
          setLoading(false);
      }
  };

  const handleImageExtract = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      setIsExtractingImage(true);
      try {
          const reader = new FileReader();
          reader.onloadend = async () => {
              const base64Data = (reader.result as string).split(',')[1];
              const client = getGeminiClient();
              
              const response = await client.models.generateContent({
                  model: 'gemini-2.5-flash',
                  contents: {
                      parts: [
                          { inlineData: { mimeType: file.type, data: base64Data } },
                          { text: MATH_IMAGE_EXTRACT_PROMPT }
                      ]
                  }
              });
              
              const jsonStr = response.text?.replace(/```json/g, '').replace(/```/g, '').trim();
              if (jsonStr) {
                  const parsed = JSON.parse(jsonStr);
                  const safeBlocks = Array.isArray(parsed) ? parsed.map((b: any, i:number) => ({...b, id: `blk_${Date.now()}_${i}`})) : parsed;
                  setFormattedContent(safeBlocks);
              }
          };
          reader.readAsDataURL(file);
      } catch (err) {
          alert("فشل استخراج النص من الصورة");
      } finally {
          setIsExtractingImage(false);
      }
  };

  const handleEditLesson = (l: LessonContent) => {
      setEditingLessonId(l.id); 
      setLessonTitle(l.title); 
      setLessonDuration(l.duration || 10);
      
      // AUTO-SET FILTERS TO MATCH LESSON
      const parts = l.section_id.split('_');
      if (parts.length >= 3) {
          setLessonSub(parts[0]);
          setLessonTri(parts[1]);
          setLessonType(parts[2]);
      }
      
      setLessonContentRaw(l.content); 
      try {
          const parsed = JSON.parse(l.content);
          if (parsed.videoUrl) setLessonVideoUrl(parsed.videoUrl);
          
          if (parsed.type === 'philosophy_structured') {
               setEditingPhiloLessonData(parsed); 
               setIsEditingPhilosophyLesson(true); 
               setFormattedContent(parsed);
          } else { 
              let blocks: any[] = [];
              if (parsed.type === 'standard') blocks = parsed.blocks || [];
              else if (Array.isArray(parsed)) blocks = parsed;
              
              const safeBlocks = blocks.map((b, idx) => ({
                  ...b,
                  id: `blk_${Date.now()}_${idx}_${Math.random().toString(36).substr(2,5)}`
              }));
              
              setFormattedContent(safeBlocks);
              setIsEditingPhilosophyLesson(false); 
          }
      } catch { 
          setFormattedContent(null); 
          setIsEditingPhilosophyLesson(false); 
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteLesson = async (id: number) => { if(confirm('حذف؟')) { await supabase.from('lessons_content').delete().eq('id', id); fetchFilteredLessons(); } };
  
  // ... (updateBlock, addBlock, removeBlock, moveBlock, handleSeedFrenchTerms, handleReplySubmit unchanged) ...
  const updateBlock = (blockId: string, field: string, value: string) => {
      if (!formattedContent) return;
      let blocks = Array.isArray(formattedContent) ? [...formattedContent] : [...formattedContent.blocks];
      const idx = blocks.findIndex((b: any) => b.id === blockId);
      if (idx !== -1) {
          blocks[idx] = { ...blocks[idx], [field]: value };
          setFormattedContent(Array.isArray(formattedContent) ? blocks : { ...formattedContent, blocks });
      }
  };

  const addBlock = () => {
      const newBlock: LessonBlock = { id: `blk_${Date.now()}_new`, type: 'paragraph', text: 'نص جديد', color: 'black' };
      let blocks = Array.isArray(formattedContent) ? [...formattedContent] : (formattedContent?.blocks || []);
      blocks.push(newBlock);
      setFormattedContent(Array.isArray(formattedContent) ? blocks : { ...(formattedContent || { type: 'standard' }), blocks });
  };

  const removeBlock = (blockId: string) => {
      let blocks = Array.isArray(formattedContent) ? [...formattedContent] : [...formattedContent.blocks];
      blocks = blocks.filter((b: any) => b.id !== blockId);
      setFormattedContent(Array.isArray(formattedContent) ? blocks : { ...formattedContent, blocks });
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
      let blocks = Array.isArray(formattedContent) ? [...formattedContent] : [...formattedContent.blocks];
      if (direction === 'up' && index > 0) {
          [blocks[index], blocks[index - 1]] = [blocks[index - 1], blocks[index]];
      } else if (direction === 'down' && index < blocks.length - 1) {
          [blocks[index], blocks[index + 1]] = [blocks[index + 1], blocks[index]];
      }
      setFormattedContent(Array.isArray(formattedContent) ? blocks : { ...formattedContent, blocks });
  };

  const handleSeedFrenchTerms = async () => {
      if (!confirm("هل أنت متأكد من إدراج مصطلحات التاريخ (فرنسية) تلقائياً؟")) return;
      setLoading(true);
      try {
          const lessonData = {
              section_id: `french_t1_terms`, 
              title: "مصطلحات التاريخ بالفرنسية (مترجمة)",
              subtitle: "قائمة شاملة مع الترجمة",
              content: JSON.stringify({
                  type: 'standard',
                  blocks: FRENCH_HISTORY_TERMS_JSON
              }),
              subject: "اللغة الفرنسية", 
              color: "blue",
              duration: 15
          };

          const { error } = await supabase.from('lessons_content').insert(lessonData);
          if (error) throw error;
          window.addToast("تم إدراج المصطلحات بنجاح!", "success");
          
          setLessonSub('french');
          setLessonTri('t1');
          setLessonType('terms');
          
          setTimeout(() => fetchFilteredLessons(), 100);
          
      } catch (e: any) {
          console.error(e);
          window.addToast("حدث خطأ أثناء الإدراج: " + e.message, "error");
      } finally {
          setLoading(false);
      }
  };

  const handleReplySubmit = async (message: AdminMessage) => {
      if (!replyText.trim()) return;
      if (!message.id) { alert("خطأ: معرف الرسالة مفقود"); return; }
      
      setLoading(true);
      try {
          const { error: rpcError } = await supabase.rpc('reply_to_consultation', { 
              p_message_id: message.id, 
              p_reply_text: replyText 
          });

          if (rpcError) {
              console.warn("RPC failed or not available, falling back to standard update", rpcError);
              const { error: updateError } = await supabase
                .from('admin_messages')
                .update({ 
                    is_replied: true,
                    response: replyText 
                })
                .eq('id', message.id);
              
              if (updateError) throw updateError;
          }

          const notificationPayload = {
              type: 'consultation_reply',
              question: message.content,
              answer: replyText,
              responder: teacherTitle || currentUser.name,
              subject: teacherTitle || 'Admin'
          };

          const { error: notifError } = await supabase.from('notifications').insert({
              user_id: message.user_id, 
              title: 'تم الرد على استشارتك',
              content: JSON.stringify(notificationPayload),
              is_consultation_reply: true,
              reply_data: notificationPayload
          });

          if (notifError) console.error("Notification insert error:", notifError);

          setReplyText('');
          setReplyingTo(null);
          
          setInbox(prev => prev.map(m => m.id === message.id ? { ...m, is_replied: true, response: replyText } : m));
          setUnreadCount(prev => Math.max(0, prev - 1));
          
          window.addToast('تم إرسال الرد بنجاح ووصل للطالب', 'success');
          
      } catch (err: any) {
          console.error(err);
          alert('خطأ في العملية: ' + (err.message || "فشل الاتصال بقاعدة البيانات"));
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-white flex flex-col md:flex-row">
      {/* ... (Preview Modal and Sidebar - Keep existing) ... */}
      
      {/* PREVIEW MODAL */}
      {isPreviewOpen && (
          <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col">
              <div className="flex justify-between items-center p-4 border-b border-neutral-800 bg-neutral-900">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2"><Eye size={20}/> معاينة الدرس</h3>
                  <button onClick={() => setIsPreviewOpen(false)} className="p-2 bg-red-600 rounded-full text-white hover:bg-red-500"><X size={20}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full custom-scrollbar">
                  {formattedContent && (
                      <LessonRenderer 
                          lessonId={0} 
                          content={JSON.stringify(Array.isArray(formattedContent) ? { type: 'standard', videoUrl: lessonVideoUrl, blocks: formattedContent } : { ...formattedContent, videoUrl: lessonVideoUrl })} 
                          completedSubItems={new Set()} 
                          onToggle={() => {}} 
                          subjectId={lessonSub}
                      />
                  )}
                  {!formattedContent && <p className="text-center text-gray-500 mt-20">لا يوجد محتوى للمعاينة</p>}
              </div>
          </div>
      )}

      <aside className="w-full md:w-64 bg-white dark:bg-neutral-900 border-b md:border-r border-slate-200 dark:border-neutral-800 flex-shrink-0">
          <div className="p-6">
              <h1 className="text-xl font-black text-blue-600 dark:text-yellow-500">
                  {teacherTitle}
              </h1>
          </div>
          <nav className="p-4 space-y-2 flex md:block overflow-x-auto">
              {!isTeacher && (
                  <>
                    <button onClick={() => setActiveTab('lessons')} className={`block w-full text-right p-3 rounded-xl font-bold whitespace-nowrap ${activeTab === 'lessons' ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-neutral-800'}`}>الدروس</button>
                    <button onClick={() => setActiveTab('exams')} className={`block w-full text-right p-3 rounded-xl font-bold whitespace-nowrap ${activeTab === 'exams' ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-neutral-800'}`}>البكالوريات والفروض</button>
                    <button onClick={() => setActiveTab('game')} className={`block w-full text-right p-3 rounded-xl font-bold whitespace-nowrap ${activeTab === 'game' ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-neutral-800'}`}>الألعاب</button>
                    <button onClick={() => setActiveTab('notifications')} className={`block w-full text-right p-3 rounded-xl font-bold whitespace-nowrap ${activeTab === 'notifications' ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-neutral-800'}`}>الإشعارات</button>
                  </>
              )}
              
              <button onClick={() => setActiveTab('inbox')} className={`block w-full text-right p-3 rounded-xl font-bold whitespace-nowrap ${activeTab === 'inbox' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-500 dark:text-gray-300'}`}>
                  {isTeacher ? 'صندوق الاستشارات' : 'استشارات الطلاب'}
                  {unreadCount > 0 && <span className="mr-2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{unreadCount}</span>}
              </button>
              
              <button onClick={onLogout} className="block w-full text-right p-3 rounded-xl font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 whitespace-nowrap mt-4 md:mt-2">
                  <LogOut size={20} className="inline ml-2" />
                  خروج
              </button>
          </nav>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {activeTab === 'lessons' && !isTeacher && (
              <div className="space-y-6">
                   <h2 className="text-2xl font-bold">إدارة الدروس</h2>
                   <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm">
                       {isEditingPhilosophyLesson && editingPhiloLessonData ? (
                           <PhilosophyLessonEditor
                               lessonId={editingLessonId || 0}
                               initialData={editingPhiloLessonData}
                               videoUrl={lessonVideoUrl}
                               onSave={(updatedData) => {
                                   setEditingPhiloLessonData(updatedData);
                                   setFormattedContent(updatedData);
                                   setLessonVideoUrl(updatedData.videoUrl);
                                   setTimeout(handleSaveLesson, 100);
                               }}
                               onCancel={() => { setIsEditingPhilosophyLesson(false); setFormattedContent(null); }}
                           />
                       ) : (
                           <div className="space-y-4">
                               <div className="flex justify-between items-center mb-4">
                                   <h3 className="font-bold text-lg">{editingLessonId ? 'تعديل درس' : 'إضافة درس جديد'}</h3>
                                   <div className="flex gap-2">
                                       <button onClick={handleSeedFrenchTerms} className="text-sm bg-indigo-600 text-white px-3 py-1 rounded-lg hover:bg-indigo-500 flex items-center gap-1">
                                            <Database size={14} /> إدراج مصطلحات التاريخ (فرنسية)
                                       </button>

                                       <button onClick={() => { setLessonContentRaw(''); setLessonTitle(''); setFormattedContent(null); setLessonVideoUrl(''); }} className="text-sm bg-gray-200 dark:bg-neutral-800 px-3 py-1 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-neutral-700"><RotateCcw size={14} className="inline ml-1"/> مسح</button>
                                       {editingLessonId && <button onClick={() => { setEditingLessonId(null); setLessonTitle(''); setFormattedContent(null); }} className="text-sm text-red-500">إلغاء التعديل</button>}
                                   </div>
                               </div>
                               
                               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                   <select value={lessonSub} onChange={e => setLessonSub(e.target.value)} className={INPUT_CLASS}>{SUBJECTS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                                   <select value={lessonTri} onChange={e => setLessonTri(e.target.value)} className={INPUT_CLASS}>{TRIMESTERS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}</select>
                                   <select value={lessonType} onChange={e => setLessonType(e.target.value)} className={INPUT_CLASS}>
                                       {availableLessonTypes.map(typeId => {
                                           const typeObj = ALL_LESSON_TYPES.find(t => t.id === typeId);
                                           return typeObj ? <option key={typeObj.id} value={typeObj.id}>{typeObj.label}</option> : null;
                                       })}
                                   </select>
                               </div>

                               <div className="flex gap-4">
                                   <input type="text" value={lessonTitle} onChange={e => setLessonTitle(e.target.value)} placeholder="عنوان الدرس" className={`${INPUT_CLASS} flex-1`} />
                                   <div className="relative w-32">
                                       <Clock className="absolute right-3 top-3 text-gray-400 w-5 h-5" />
                                       <input 
                                            type="number" 
                                            value={lessonDuration} 
                                            onChange={e => setLessonDuration(Number(e.target.value))} 
                                            className={`${INPUT_CLASS} pr-10`} 
                                            placeholder="دقيقة"
                                            min="1"
                                       />
                                   </div>
                               </div>
                               
                               {/* ... (Rest of Lesson Editor UI including Content Textarea and AI Button) ... */}
                               <div className="relative">
                                    <LinkIcon className="absolute right-3 top-3 text-gray-400 w-5 h-5" />
                                    <input type="text" value={lessonVideoUrl} onChange={e => setLessonVideoUrl(e.target.value)} placeholder="رابط فيديو يوتيوب (اختياري)" className={`${INPUT_CLASS} pr-10`} dir="ltr" />
                               </div>
                               
                               <div className="relative">
                                   <textarea 
                                       value={lessonContentRaw} 
                                       onChange={e => setLessonContentRaw(e.target.value)} 
                                       placeholder="الصق نص الدرس هنا ليتم تنسيقه تلقائياً..." 
                                       className="w-full h-40 bg-slate-50 dark:bg-black border border-slate-300 dark:border-neutral-700 rounded-xl p-3 outline-none focus:border-blue-500 transition-colors"
                                   />
                                   {lessonType === 'math_law' && (
                                       <div className="absolute top-2 left-2">
                                           <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageExtract} />
                                           <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-blue-600 rounded-lg text-white hover:bg-blue-500 shadow-lg" title="استخراج من صورة">
                                               {isExtractingImage ? <Loader2 className="animate-spin w-5 h-5" /> : <Camera className="w-5 h-5" />}
                                           </button>
                                       </div>
                                   )}
                                   {(lessonType === 'math_law' || lessonSub === 'math') && (
                                       <MathKeyboard onInsert={(sym) => setLessonContentRaw(prev => prev + sym)} />
                                   )}
                               </div>
                               
                               <button 
                                   onClick={handleAiFormat} 
                                   disabled={isProcessingAI || !lessonContentRaw}
                                   className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                                >
                                   {isProcessingAI ? <Loader2 className="animate-spin" /> : <Sparkles />}
                                   <span>تنسيق ذكي (AI)</span>
                               </button>

                               {formattedContent && (
                                   <div className="mt-8 space-y-4 border-t border-slate-200 dark:border-neutral-800 pt-6 animate-fadeIn">
                                       <div className="flex justify-between items-center">
                                           <h4 className="font-bold flex items-center gap-2 text-lg"><Edit3 className="text-yellow-500"/> محرر الكتل ({Array.isArray(formattedContent) ? formattedContent.length : formattedContent.blocks?.length || 0})</h4>
                                           <div className="flex gap-2">
                                               <button onClick={() => setIsPreviewOpen(true)} className="text-sm bg-blue-600 text-white px-3 py-1 rounded-lg flex items-center gap-1 hover:bg-blue-500"><Eye size={14}/> معاينة</button>
                                               <button onClick={addBlock} className="text-sm bg-green-600 text-white px-3 py-1 rounded-lg flex items-center gap-1 hover:bg-green-500"><PlusCircle size={14}/> إضافة كتلة</button>
                                           </div>
                                       </div>
                                       
                                       <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar border border-neutral-800/50 p-2 rounded-xl">
                                            {(Array.isArray(formattedContent) ? formattedContent : formattedContent.blocks || []).map((block: any, index: number) => (
                                                <div key={block.id || index} className="bg-slate-50 dark:bg-black border border-slate-200 dark:border-neutral-800 p-3 rounded-xl flex gap-3 items-start group">
                                                    <div className="flex flex-col gap-1 mt-1 items-center">
                                                        <span className="text-xs text-center text-gray-500 font-mono w-5 h-5 flex items-center justify-center bg-neutral-900 rounded-full">{index + 1}</span>
                                                        <button onClick={() => moveBlock(index, 'up')} className="p-1 hover:bg-slate-200 dark:hover:bg-neutral-800 rounded text-gray-400 hover:text-white"><ArrowUp size={14}/></button>
                                                        <button onClick={() => moveBlock(index, 'down')} className="p-1 hover:bg-slate-200 dark:hover:bg-neutral-800 rounded text-gray-400 hover:text-white"><ArrowDown size={14}/></button>
                                                    </div>
                                                    
                                                    <div className="flex-1 space-y-2">
                                                        <div className="flex gap-2 items-center">
                                                            <select 
                                                                value={block.type} 
                                                                onChange={(e) => updateBlock(block.id, 'type', e.target.value)} 
                                                                className="bg-white dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg p-1 text-xs outline-none"
                                                            >
                                                                <option value="title">عنوان رئيسي</option>
                                                                <option value="subtitle">عنوان فرعي</option>
                                                                <option value="paragraph">فقرة</option>
                                                                <option value="term_entry">مصطلح</option>
                                                                <option value="date_entry">تاريخ</option>
                                                                <option value="char_entry">شخصية</option>
                                                            </select>
                                                            <select 
                                                                value={block.color || 'black'} 
                                                                onChange={(e) => updateBlock(block.id, 'color', e.target.value)} 
                                                                className="bg-white dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg p-1 text-xs outline-none w-24"
                                                            >
                                                                <option value="black">عادي</option>
                                                                <option value="red">أحمر</option>
                                                                <option value="blue">أزرق</option>
                                                                <option value="green">أخضر</option>
                                                                <option value="yellow">أصفر</option>
                                                                <option value="indigo">نيلي (فرنسي)</option>
                                                            </select>
                                                            <div className={`w-3 h-3 rounded-full ${block.color === 'red' ? 'bg-red-500' : block.color === 'blue' ? 'bg-blue-500' : block.color === 'green' ? 'bg-green-500' : block.color === 'yellow' ? 'bg-yellow-500' : block.color === 'indigo' ? 'bg-indigo-500' : 'bg-gray-500'}`}></div>
                                                        </div>
                                                        <textarea 
                                                            value={block.text} 
                                                            onChange={(e) => updateBlock(block.id, 'text', e.target.value)} 
                                                            className="w-full bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 rounded-lg p-2 text-sm outline-none min-h-[60px]"
                                                            placeholder="النص..."
                                                        />
                                                        {['term_entry', 'date_entry', 'char_entry'].includes(block.type) && (
                                                            <input 
                                                                type="text" 
                                                                value={block.extra_1 || ''} 
                                                                onChange={(e) => updateBlock(block.id, 'extra_1', e.target.value)}
                                                                className="w-full bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 rounded-lg p-2 text-sm outline-none"
                                                                placeholder="معلومة إضافية (تاريخ، تعريف...)"
                                                            />
                                                        )}
                                                    </div>
                                                    
                                                    <button onClick={() => removeBlock(block.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 size={16}/></button>
                                                </div>
                                            ))}
                                       </div>
                                       
                                       <button onClick={handleSaveLesson} className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all mt-4">
                                           <Save size={20} /> حفظ الدرس
                                       </button>
                                   </div>
                               )}
                           </div>
                       )}
                       
                       <div className="mt-10 space-y-3 pt-8 border-t border-slate-200 dark:border-neutral-800">
                           <h3 className="font-bold text-lg mb-4">قائمة الدروس ({lessons.length})</h3>
                           {lessons.map((l, index) => (
                               <div key={l.id} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-black rounded-xl border border-slate-200 dark:border-neutral-800 hover:border-blue-500 transition-colors">
                                   <div className="flex gap-2">
                                       <div className="flex flex-col gap-1 mr-2">
                                            <button onClick={() => handleMoveLesson(index, 'up')} disabled={index === 0} className="p-1 hover:bg-neutral-800 rounded disabled:opacity-30"><MoveUp size={14}/></button>
                                            <button onClick={() => handleMoveLesson(index, 'down')} disabled={index === lessons.length - 1} className="p-1 hover:bg-neutral-800 rounded disabled:opacity-30"><MoveDown size={14}/></button>
                                       </div>
                                       <div className="flex flex-col">
                                           <span className="font-bold">{l.title}</span>
                                           <span className="text-xs text-gray-500">{l.section_id}</span>
                                           <span className="text-[10px] text-yellow-500 mt-1 flex items-center gap-1"><Clock size={10}/> {l.duration || 10} دقيقة</span>
                                       </div>
                                   </div>
                                   <div className="flex gap-2">
                                       <button onClick={() => handleEditLesson(l)} className="p-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg"><Edit3 size={16}/></button>
                                       <button onClick={() => handleDeleteLesson(l.id)} className="p-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg"><Trash2 size={16}/></button>
                                   </div>
                               </div>
                           ))}
                       </div>
                   </div>
              </div>
          )}

          {/* ... (Keep Notifications, Games, Exams, Inbox Tabs unchanged) ... */}
          {activeTab === 'notifications' && !isTeacher && (
              <div className="space-y-6">
                  <h2 className="text-2xl font-bold flex items-center gap-2"><Bell className="w-6 h-6 text-yellow-500"/> إدارة الإشعارات</h2>
                  
                  {/* Create Notification */}
                  <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm space-y-4">
                      <input 
                          type="text" 
                          value={notifTitle}
                          onChange={(e) => setNotifTitle(e.target.value)}
                          placeholder="عنوان الإشعار"
                          className={INPUT_CLASS}
                      />
                      <textarea 
                          value={notifContent}
                          onChange={(e) => setNotifContent(e.target.value)}
                          placeholder="محتوى الإشعار..."
                          className="w-full h-32 bg-slate-50 dark:bg-black border border-slate-300 dark:border-neutral-700 rounded-xl p-3 outline-none focus:border-blue-500 transition-colors"
                      />
                      <button onClick={handleSendNotification} disabled={loading} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                          {loading ? <Loader2 className="animate-spin"/> : <Send/>}
                          <span>إرسال للجميع</span>
                      </button>
                  </div>

                  {/* History */}
                  <div className="mt-8">
                      <h3 className="font-bold text-lg mb-4">سجل الإشعارات</h3>
                      <div className="space-y-3">
                          {notifications.map((n) => (
                              <div key={n.id} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-black rounded-xl border border-slate-200 dark:border-neutral-800">
                                  <div>
                                      <h4 className="font-bold">{n.title}</h4>
                                      <p className="text-sm text-gray-500">{n.content.substring(0, 50)}...</p>
                                      <span className="text-xs text-gray-400">{new Date(n.created_at).toLocaleDateString('ar-SA')}</span>
                                  </div>
                                  <button onClick={() => handleDeleteNotification(n.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 size={16}/></button>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          )}

          {activeTab === 'game' && !isTeacher && (
              <div className="space-y-6">
                  <h2 className="text-2xl font-bold flex items-center gap-2"><Gamepad2 className="w-6 h-6 text-purple-500"/> إدارة الألعاب</h2>
                  
                  {/* Game Switcher Tabs */}
                  <div className="flex bg-neutral-900 p-1 rounded-xl w-full max-w-md border border-neutral-800">
                      <button 
                          onClick={() => setGameSubTab('millionaire')}
                          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${gameSubTab === 'millionaire' ? 'bg-neutral-800 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
                      >
                          من سيربح البكالوريا
                      </button>
                      <button 
                          onClick={() => setGameSubTab('matching')}
                          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${gameSubTab === 'matching' ? 'bg-neutral-800 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
                      >
                          لعبة المطابقة
                      </button>
                  </div>

                  {/* MILLIONAIRE GAME MANAGER */}
                  {gameSubTab === 'millionaire' && (
                      <>
                        <h3 className="font-bold text-lg border-b border-gray-700 pb-2 flex items-center gap-2 text-green-500">
                            <Layers size={18} /> بنك أسئلة من سيربح البكالوريا
                        </h3>
                        <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm space-y-4">
                            
                            <div className="grid grid-cols-2 gap-4">
                                <select 
                                    value={newQuestion.subject}
                                    onChange={(e) => setNewQuestion(prev => ({...prev, subject: e.target.value}))}
                                    className={INPUT_CLASS}
                                >
                                    {SUBJECTS.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                </select>
                                <select 
                                    value={newQuestion.difficulty}
                                    onChange={(e) => setNewQuestion(prev => ({...prev, difficulty: e.target.value as any}))}
                                    className={INPUT_CLASS}
                                >
                                    <option value="easy">سهل</option>
                                    <option value="medium">متوسط</option>
                                    <option value="hard">صعب</option>
                                </select>
                            </div>

                            <input 
                                type="text" 
                                value={newQuestion.text}
                                onChange={(e) => setNewQuestion(prev => ({...prev, text: e.target.value}))}
                                placeholder="نص السؤال"
                                className={INPUT_CLASS}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[0, 1, 2, 3].map((idx) => (
                                    <div key={idx} className="flex gap-2 items-center">
                                        <input 
                                            type="radio" 
                                            name="correctAnswer"
                                            checked={newQuestion.correctAnswerIndex === idx}
                                            onChange={() => setNewQuestion(prev => ({...prev, correctAnswerIndex: idx}))}
                                            className="accent-green-500 w-5 h-5"
                                        />
                                        <input 
                                            type="text"
                                            value={newQuestion.options![idx]}
                                            onChange={(e) => {
                                                const newOpts = [...newQuestion.options!];
                                                newOpts[idx] = e.target.value;
                                                setNewQuestion(prev => ({...prev, options: newOpts}));
                                            }}
                                            placeholder={`الخيار ${idx + 1}`}
                                            className={INPUT_CLASS}
                                        />
                                    </div>
                                ))}
                            </div>

                            <button onClick={handleAddQuestionSubmit} className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                                <PlusCircle size={20}/> إضافة للسجل
                            </button>
                        </div>

                        {/* Existing Questions List */}
                        <div className="mt-8">
                            <h3 className="font-bold text-lg mb-4">الأسئلة المسجلة ({questions.length})</h3>
                            <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                                {questions.map((q) => (
                                    <div key={q.id} className="bg-slate-50 dark:bg-black p-4 rounded-xl border border-slate-200 dark:border-neutral-800 flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-sm mb-1">{q.text}</p>
                                            <div className="flex gap-2 text-xs text-gray-500">
                                                <span className="bg-neutral-800 px-2 py-0.5 rounded">{q.subject}</span>
                                                <span className={`px-2 py-0.5 rounded ${q.difficulty === 'hard' ? 'text-red-400 bg-red-900/20' : 'text-green-400 bg-green-900/20'}`}>{q.difficulty}</span>
                                                <span className="text-green-500 font-bold">الإجابة: {q.options[q.correctAnswerIndex]}</span>
                                            </div>
                                        </div>
                                        <button onClick={() => onDeleteQuestion(q.id)} className="text-red-500 hover:bg-red-900/20 p-2 rounded-lg"><Trash2 size={16}/></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                      </>
                  )}

                  {/* MATCHING GAME MANAGER */}
                  {gameSubTab === 'matching' && (
                      <>
                        <h3 className="font-bold text-lg border-b border-gray-700 pb-2 flex items-center gap-2 text-purple-500">
                            <LayoutList size={18} /> منشئ ألعاب المطابقة
                        </h3>
                        <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm space-y-4">
                            <div className="flex gap-4 mb-2">
                                 <select value={matchSubject} onChange={e => setMatchSubject(e.target.value)} className={INPUT_CLASS}>
                                     {SUBJECTS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                 </select>
                                 <select value={matchTri} onChange={e => setMatchTri(e.target.value)} className={INPUT_CLASS}>
                                     {TRIMESTERS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                 </select>
                            </div>
                            <input 
                                type="text" 
                                value={matchTitle} 
                                onChange={e => setMatchTitle(e.target.value)} 
                                placeholder="عنوان اللعبة (مثال: مصطلحات الحرب الباردة)" 
                                className={INPUT_CLASS + " font-bold"}
                            />
                            
                            <div className="bg-black/30 rounded-xl p-4 space-y-2 border border-neutral-700">
                                <div className="flex justify-between text-xs text-gray-400 font-bold px-2">
                                    <span>العمود الأيمن (التعريف/الحدث)</span>
                                    <span>العمود الأيسر (المصطلح/التاريخ)</span>
                                </div>
                                {matchPairs.map((pair, idx) => (
                                    <div key={idx} className="flex gap-2 items-center">
                                        <span className="text-gray-500 text-xs w-4">{idx+1}</span>
                                        <input type="text" placeholder="اليمين..." value={pair.right} onChange={e => handleUpdateMatchingPair(idx, 'right', e.target.value)} className="flex-1 bg-black border border-neutral-700 rounded-lg p-2 text-sm text-white"/>
                                        <Split size={14} className="text-gray-600"/>
                                        <input type="text" placeholder="اليسار..." value={pair.left} onChange={e => handleUpdateMatchingPair(idx, 'left', e.target.value)} className="flex-1 bg-black border border-neutral-700 rounded-lg p-2 text-sm text-white"/>
                                        <button onClick={() => handleRemoveMatchingPair(idx)} className="p-2 text-red-500 hover:bg-red-900/20 rounded"><Trash2 size={14}/></button>
                                    </div>
                                ))}
                                <button onClick={handleAddMatchingPair} className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-gray-300 rounded-lg text-xs font-bold border border-neutral-700 dashed border-2 mt-2">
                                    + إضافة زوج جديد
                                </button>
                            </div>

                            <button onClick={handleSaveMatchingGame} disabled={loading} className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg">
                                {loading ? <Loader2 className="animate-spin"/> : <Save/>}
                                <span>حفظ اللعبة</span>
                            </button>
                        </div>
                      </>
                  )}
              </div>
          )}

          {activeTab === 'exams' && !isTeacher && (
              <div className="space-y-6">
                   <div className="flex justify-between items-center">
                       <h2 className="text-2xl font-bold">إدارة بنك الفروض والبكالوريات</h2>
                       <button onClick={handleSaveAllExams} disabled={loading} className="fixed bottom-6 left-6 z-50 bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-full font-bold shadow-2xl flex items-center gap-3 transition-all hover:scale-105 active:scale-95 disabled:opacity-50">
                           {loading ? <Loader2 className="animate-spin"/> : <Save/>}
                           <span>حفظ التغييرات</span>
                       </button>
                   </div>
                   
                   <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm">
                       {/* ... (Exams Management UI) ... */}
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 p-4 bg-slate-50 dark:bg-black rounded-xl border border-slate-100 dark:border-neutral-800">
                           <div>
                               <label className="text-sm font-bold text-gray-500 mb-2 block">1. اختر المادة:</label>
                               <select 
                                    value={examSub} 
                                    onChange={e => setExamSub(e.target.value)} 
                                    className={`${INPUT_CLASS} text-lg font-bold border-2 border-blue-500/20 focus:border-blue-500`}
                               >
                                   {SUBJECTS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                               </select>
                           </div>
                           <div>
                               <label className="text-sm font-bold text-gray-500 mb-2 block">2. اختر نوع الامتحان:</label>
                               <select value={examType} onChange={e => setExamType(e.target.value)} className={`${INPUT_CLASS} text-lg font-bold border-2 border-green-500/20 focus:border-green-500`}>
                                   {EXAM_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                               </select>
                           </div>
                       </div>

                       <div className="space-y-3">
                           {EXAM_YEARS.map(year => (
                               <div key={year} className="flex items-center gap-4">
                                   <div className="w-24 h-12 flex items-center justify-center bg-slate-100 dark:bg-neutral-800 rounded-xl font-black text-xl text-slate-700 dark:text-gray-300 shadow-sm border border-slate-200 dark:border-neutral-700">
                                       {year}
                                   </div>
                                   <div className="flex-1 relative">
                                       <LinkIcon className="absolute right-4 top-3.5 text-gray-400 w-5 h-5" />
                                       <input
                                           type="text"
                                           value={examLinks[year] || ''}
                                           onChange={(e) => setExamLinks(prev => ({ ...prev, [year]: e.target.value }))}
                                           className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-xl py-3 pr-12 pl-4 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 placeholder:text-gray-500 transition-colors text-left dir-ltr"
                                           placeholder="https://drive.google.com/..."
                                           dir="ltr"
                                       />
                                   </div>
                               </div>
                           ))}
                       </div>
                   </div>
              </div>
          )}

          {activeTab === 'inbox' && (
              <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                      <h2 className="text-2xl font-bold flex items-center gap-2">
                          <Inbox className="w-6 h-6 text-blue-500" />
                          {isTeacher ? 'الاستشارات الواردة' : 'استشارات الطلاب'}
                      </h2>
                      <button onClick={() => { fetchData(); fetchUnreadCount(); }} className="p-2 bg-slate-100 dark:bg-neutral-800 rounded-full hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors" title="تحديث يدوي">
                          <RefreshCw size={18} className="text-slate-500 dark:text-gray-400" />
                      </button>
                  </div>
                  
                  {inbox.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                          <Inbox className="w-16 h-16 mb-4 opacity-20" />
                          <p>لا توجد استشارات جديدة.</p>
                      </div>
                  ) : (
                      inbox.map((msg) => (
                      <div key={msg.id} className={`bg-white dark:bg-neutral-900 p-4 rounded-xl border ${msg.is_replied ? 'border-green-500/20 opacity-70' : 'border-neutral-800 shadow-md'} relative group`}>
                          {msg.is_replied && <div className="absolute top-2 left-2 text-green-500 text-xs font-bold bg-green-500/10 px-2 py-1 rounded">تم الرد</div>}
                          <h4 className="font-bold text-blue-400 mb-2 flex items-center gap-2"><MessageCircle size={16} /> {msg.user_name}</h4>
                          <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed bg-black/20 p-3 rounded-lg">{msg.content}</p>
                          <div className="mt-2 text-xs text-gray-500 flex justify-between items-center">
                              <span>{new Date(msg.created_at).toLocaleString('ar-SA')}</span>
                              {!msg.is_replied && (
                                  <button onClick={() => setReplyingTo(msg.id)} className="text-blue-400 hover:text-blue-300 underline font-bold flex items-center gap-1">
                                      <Send size={12} className="rtl:-rotate-90"/> رد على الطالب
                                  </button>
                              )}
                          </div>
                          
                          {/* Reply Box */}
                          {replyingTo === msg.id && (
                              <div className="mt-4 pt-4 border-t border-neutral-800 animate-fadeIn">
                                  <textarea 
                                      value={replyText} 
                                      onChange={(e) => setReplyText(e.target.value)} 
                                      className="w-full bg-black border border-neutral-700 rounded-lg p-3 text-sm text-white mb-2 h-24 resize-none"
                                      placeholder="اكتب ردك هنا..."
                                  />
                                  <div className="flex gap-2 justify-end">
                                      <button onClick={() => setReplyingTo(null)} className="px-4 py-2 text-xs text-gray-400 hover:text-white">إلغاء</button>
                                      <button onClick={() => handleReplySubmit(msg)} disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-green-500">
                                          {loading ? <Loader2 className="animate-spin w-3 h-3" /> : <Send className="w-3 h-3 rtl:-rotate-90" />} إرسال الرد
                                      </button>
                                  </div>
                              </div>
                          )}
                      </div>
                  ))
                  )}
              </div>
          )}
      </main>
    </div>
  );
};

export default AdminDashboard;
