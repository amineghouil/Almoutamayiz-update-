
import React, { useState } from 'react';
import { LessonBlock, PhilosophyStructuredContent } from '../types'; // Import PhilosophyStructuredContent
import { Quote, User, Sparkles, CheckCircle, List, BrainCircuit, Loader2, BookOpen, Video, Search, Play, ExternalLink, AlertCircle, Layers, Calendar, Users, Sigma, Volume2, Languages } from 'lucide-react';
import { getGeminiClient } from '../lib/gemini';

interface LessonRendererProps {
  lessonId: number;
  content: string;
  completedSubItems: Set<string>;
  onToggle: (lessonId: number, subItemId: string, subjectId: string) => void;
  subjectId: string;
}

const PHILOSOPHER_IMAGES: Record<string, string> = {
    'سقراط': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Socrate_du_Louvre.jpg/240px-Socrate_du_Louvre.jpg',
    'افلاطون': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Plato_Silanion_Musei_Capitolini_MC1377.jpg/220px-Plato_Silanion_Musei_Capitolini_MC1377.jpg',
    'أفلاطون': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Plato_Silanion_Musei_Capitolini_MC1377.jpg/220px-Plto_Silanion_Musei_Capitolini_MC1377.jpg',
    'ارسطو': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Aristotle_Altemps_Inv8575.jpg/220px-Aristotle_Altemps_Inv8575.jpg',
    'أرسطو': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Aristotle_Altemps_Inv8575.jpg/220px-Aristotle_Altemps_Inv8575.jpg',
    'ديكارت': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Frans_Hals_-_Portret_van_Ren%C3%A9_Descartes.jpg/220px-Frans_Hals_-_Portret_van_Ren%C3%A9_Descartes.jpg',
    'كانط': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Kant_gemaelde_3.jpg/220px-Kant_gemaelde_3.jpg',
    'هيغل': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Hegel_portrait_by_Schlesinger_1831.jpg/220px-Hegel_portrait_by_Schlesinger_1831.jpg',
    'هيوم': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Painting_of_David_Hume.jpg/220px-Painting_of_David_Hume.jpg',
    'جون لوك': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/John_Locke.jpg/220px-John_Locke.jpg',
    'فرويد': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Sigmund_Freud%2C_by_Max_Halberstadt_%28cropped_2%29.jpg/220px-Sigmund_Freud%2C_by_Max_Halberstadt_%28cropped_2%29.jpg',
    'ماركس': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Karl_Marx_001.jpg/220px-Karl_Marx_001.jpg',
    'ابن خلدون': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Ibn_Khaldun_statue_in_Tunis_crop.jpg/200px-Ibn_Khaldun_statue_in_Tunis_crop.jpg',
};
const getPhiloImage = (name: string): string | null => {
    if (!name) return null;
    const normalized = name.toLowerCase().trim();
    const key = Object.keys(PHILOSOPHER_IMAGES).find(k => normalized.includes(k));
    return key ? PHILOSOPHER_IMAGES[key] : null;
};
const VideoPlayer: React.FC<{ url: string }> = ({ url }) => {
    const getVideoId = (url: string) => {
        if (!url) return null;
        if (url.includes('src="')) {
            const srcMatch = url.match(/src="([^"]+)"/);
            if (srcMatch && srcMatch[1]) url = srcMatch[1];
        }
        const regExp = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[1].length === 11) ? match[1] : null;
    };
    const videoId = getVideoId(url);
    if (!videoId) return null;
    const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    return (
        <div className="w-full mb-8">
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2 text-red-500">
                <Video className="w-5 h-5" /> فيديو الشرح
            </h3>
            <a href={watchUrl} target="_blank" rel="noopener noreferrer" className="block relative w-full aspect-video bg-[#111] rounded-2xl overflow-hidden shadow-xl border border-neutral-800 group hover:border-red-600 transition-colors cursor-pointer">
                <div className="absolute inset-0 w-full h-full bg-cover bg-center opacity-80 group-hover:opacity-60 transition-opacity duration-300" style={{ backgroundImage: `url(${thumbnailUrl})` }} />
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                    <div className="w-16 h-16 bg-red-600/90 rounded-full flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform duration-300 mb-3">
                         <Play className="w-8 h-8 text-white fill-white ml-1" />
                    </div>
                    <span className="px-4 py-2 bg-black/70 backdrop-blur-sm rounded-full text-white text-xs sm:text-sm font-bold flex items-center gap-2 border border-white/10 group-hover:bg-black/90 transition-colors">
                        <ExternalLink size={14} /> اضغط للمشاهدة على يoutube
                    </span>
                </div>
                <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md">YOUTUBE</div>
            </a>
        </div>
    );
};

const Checkbox: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
    <div onClick={onChange} className="cursor-pointer p-2 rounded-full hover:bg-neutral-800 transition-colors">
        {checked ? <CheckCircle className="w-5 h-5 text-green-500" /> : <div className="w-5 h-5 rounded-full border-2 border-gray-600 group-hover:border-green-500 transition-colors"></div>}
    </div>
);

// --- COMPONENT FOR AUDIO BUTTON WITH LOADING STATE ---
const AudioButton: React.FC<{ text: string }> = ({ text }) => {
    const [status, setStatus] = useState<'idle' | 'loading' | 'playing'>('idle');

    const handlePlay = () => {
        if (status !== 'idle') return; // Prevent double clicks

        // 1. Cancel any currently playing or queued audio to prevent "stacking"
        window.speechSynthesis.cancel();

        setStatus('loading');

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'fr-FR';
        utterance.rate = 0.9;

        // 2. Handle events
        utterance.onstart = () => {
            setStatus('playing');
        };

        utterance.onend = () => {
            setStatus('idle');
        };

        utterance.onerror = (e) => {
            console.error("Speech Error:", e);
            setStatus('idle');
        };

        // 3. Speak
        window.speechSynthesis.speak(utterance);
        
        // Failsafe: Reset if it takes too long (browser issues)
        setTimeout(() => {
            if (status === 'loading') setStatus('idle');
        }, 8000);
    };

    return (
        <button 
            onClick={(e) => { e.stopPropagation(); handlePlay(); }} 
            disabled={status !== 'idle'}
            className={`p-1.5 rounded-full transition-all duration-300 ${
                status === 'playing' 
                ? 'bg-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.6)]' 
                : 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500 hover:text-white'
            }`}
            title="نطق"
        >
            {status === 'loading' ? (
                <Loader2 size={14} className="animate-spin" />
            ) : status === 'playing' ? (
                <Volume2 size={14} className="animate-pulse" />
            ) : (
                <Volume2 size={14} />
            )}
        </button>
    );
};

const PhilosophyArgumentCard: React.FC<{ philosopher: any; subItemId: string; isCompleted: boolean; onToggle: () => void }> = ({ philosopher, subItemId, isCompleted, onToggle }) => {
    const [explanation, setExplanation] = useState('');
    const [loading, setLoading] = useState(false);
    const imageSrc = getPhiloImage(philosopher.name);

    const handleExplain = async () => {
        setLoading(true);
        try {
            const client = getGeminiClient();
            const prompt = `أنت أستاذ فلسفة للطلاب الثانويين. اشرح هذه الحجة الفلسفية ببساطة ووضوح في فقرة واحدة متماسكة. الفيلسوف: ${philosopher.name} الفكرة: ${philosopher.idea} القول: ${philosopher.quote} المثال: ${philosopher.example} الهدف: أن يفهم الطالب كيف يربط بين الفكرة والقول والمثال.`;
            const response = await client.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            setExplanation(response.text || 'تعذر الشرح حالياً.');
        } catch (e) { setExplanation('حدث خطأ في الاتصال بالذكاء الاصطناعي.'); } finally { setLoading(false); }
    };

    return (
        <div className={`bg-neutral-800/50 rounded-xl p-5 border ${isCompleted ? 'border-green-500/30' : 'border-neutral-700'} mb-4 hover:border-neutral-600 transition-colors`}>
            <div className="flex items-center gap-4 mb-4">
                <Checkbox checked={isCompleted} onChange={onToggle} />
                <div className="relative">
                    {imageSrc ? ( <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-purple-500 shadow-lg p-0.5 bg-black"><img src={imageSrc} alt={philosopher.name} className="w-full h-full object-cover rounded-full hover:scale-110 transition-transform duration-500" /></div>) : ( <div className="w-14 h-14 rounded-full bg-purple-900/30 flex items-center justify-center text-purple-400 border-2 border-purple-500/30 shadow-lg"><User size={24} /></div>)}
                    <div className="absolute -bottom-1 -right-1 bg-purple-600 rounded-full p-1 border border-black"><Sparkles size={10} className="text-white" /></div>
                </div>
                <div>
                    <h4 className="font-black text-white text-lg leading-none mb-1">{philosopher.name}</h4>
                    <span className="text-[10px] text-purple-400 font-bold bg-purple-900/20 px-2 py-0.5 rounded-full border border-purple-500/20">فيلسوف</span>
                </div>
            </div>
            <div className="space-y-3 mb-4"><div className="relative pl-3 border-r-2 border-slate-600 pr-0"><p className="text-gray-300 text-sm font-medium leading-relaxed">{philosopher.idea}</p></div>
                {philosopher.quote && ( <div className="flex gap-3 items-start bg-[#111]/40 p-3 rounded-xl border border-yellow-500/30 relative overflow-hidden group"><div className="absolute top-0 right-0 w-1 h-full bg-yellow-500"></div><Quote size={18} className="text-yellow-500 shrink-0 mt-1 opacity-80" /><p className="text-gray-200 text-sm italic font-medium leading-relaxed z-10">"{philosopher.quote}"</p></div>)}
                {philosopher.example && (<div className="flex items-start gap-2 text-xs bg-green-900/10 p-2 rounded-lg border border-green-500/20"><span className="text-green-500 font-bold shrink-0">مثال واقعي:</span><span className="text-gray-300">{philosopher.example}</span></div>)}
            </div>
            {!explanation ? (<button onClick={handleExplain} disabled={loading} className="flex items-center gap-2 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 rounded-xl transition-all w-full justify-center shadow-lg active:scale-95">{loading ? <Loader2 size={16} className="animate-spin" /> : <BrainCircuit size={16} />}<span>{loading ? 'جاري التحليل...' : 'اشرح لي الحجة (AI)'}</span></button>) : (<div className="bg-purple-900/20 border border-purple-500/30 p-4 rounded-xl animate-fadeIn relative"><div className="flex justify-between items-center mb-3 border-b border-purple-500/20 pb-2"><span className="text-purple-300 text-xs font-bold flex items-center gap-2"><BrainCircuit size={12} /> شرح ذكي</span><button onClick={handleExplain} className="text-[10px] text-gray-500 hover:text-white underline">إعادة الشرح</button></div><p className="text-gray-200 text-sm leading-relaxed text-justify">{explanation}</p></div>)}
        </div>
    );
};

const QuickTranslator: React.FC<{ blocks: LessonBlock[] }> = ({ blocks }) => {
    const [word, setWord] = useState('');
    const [translation, setTranslation] = useState('');
    const [loading, setLoading] = useState(false);

    const handleTranslate = async () => {
        if (!word.trim()) return;
        setTranslation('');
        
        const cleanInput = word.trim().toLowerCase();
        
        // 1. Check Local Lesson Data First
        const termBlocks = blocks.filter(b => b.type === 'term_entry');
        
        const localMatch = termBlocks.find(b => 
            (b.text && b.text.toLowerCase().trim() === cleanInput) || 
            (b.extra_1 && b.extra_1.toLowerCase().trim() === cleanInput)
        );

        if (localMatch) {
            // If the user typed the French word (text), show the Arabic (extra_1)
            // If the user typed the Arabic word (extra_1), show the French (text)
            if (localMatch.text.toLowerCase().trim() === cleanInput) {
                setTranslation(localMatch.extra_1 || 'موجود');
            } else {
                setTranslation(localMatch.text);
            }
            return;
        }

        // 2. If not found locally, ask Gemini with strict instruction
        setLoading(true);
        try {
            const client = getGeminiClient();
            const prompt = `
            You are a strict translator for a French-Arabic glossary.
            User input: "${word}"
            
            Rules:
            1. If the input is French, provide the Arabic translation.
            2. If the input is Arabic, provide the French translation.
            3. CRITICAL: The output must be ONE single word (or at most two words if necessary).
            4. Do NOT write sentences like "The translation is...".
            5. Do NOT provide definitions unless it's a translation.
            
            Output:
            `;
            
            // Using stable gemini-2.5-flash
            const response = await client.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            let text = response.text?.trim() || '';
            // Cleanup just in case
            text = text.replace(/^The translation is[:\s]*/i, '').replace(/\.$/, '');
            setTranslation(text || 'فشل الترجمة');
        } catch (e) {
            setTranslation('خطأ في الاتصال');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-4 mb-6">
            <h4 className="text-indigo-300 text-xs font-bold mb-3 flex items-center gap-2">
                <Languages size={14} /> المترجم السريع (محلي + AI)
            </h4>
            <div className="flex gap-2">
                <input 
                    type="text" 
                    value={word}
                    onChange={(e) => setWord(e.target.value)}
                    placeholder="اكتب كلمة فرنسية أو عربية..."
                    className="flex-1 bg-[#1a1a1a] border border-indigo-500/30 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none placeholder:text-gray-600"
                    onKeyDown={(e) => e.key === 'Enter' && handleTranslate()}
                />
                <button 
                    onClick={handleTranslate} 
                    disabled={loading || !word.trim()}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-bold text-sm disabled:opacity-50"
                >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : 'ترجم'}
                </button>
            </div>
            {translation && (
                <div className="mt-2 text-center bg-indigo-500/20 rounded-lg p-2 text-white font-bold animate-fadeIn border border-indigo-500/30">
                    {translation}
                </div>
            )}
        </div>
    );
};

const LessonBlockComponent: React.FC<{ block: LessonBlock }> = ({ block }) => {
    let baseClasses = 'leading-relaxed text-justify transition-colors duration-300 ';
    switch (block.type) {
        // Main Title: Indigo/Purple, slightly smaller font
        case 'title': baseClasses += 'font-black text-xl md:text-2xl mt-8 mb-4 text-indigo-500'; break;
        // Subtitle: Yellow, slightly smaller font
        case 'subtitle': baseClasses += 'font-bold text-lg md:text-xl mt-6 mb-3 text-yellow-500'; break;
        // Paragraph: Very light gray, slightly smaller font
        case 'paragraph':
        default:
            baseClasses += 'text-sm md:text-base my-2 ';
            switch (block.color) {
                case 'green': baseClasses += 'text-yellow-400 bg-yellow-900/10 p-3 rounded-lg border-r-4 border-yellow-500'; break;
                case 'black': default: baseClasses += 'text-gray-300'; break;
            }
    }
    return <div className={baseClasses}>{block.text}</div>;
};

const LessonRenderer: React.FC<LessonRendererProps> = ({ lessonId, content, completedSubItems, onToggle, subjectId }) => {
  const [searchTerm, setSearchTerm] = useState('');

  try {
      let parsed: any = JSON.parse(content);
      let videoUrl: string | undefined;
      if (typeof parsed === 'object' && 'videoUrl' in parsed) videoUrl = parsed.videoUrl;

      if (parsed.type === 'philosophy_structured') {
          const philoContent = parsed as PhilosophyStructuredContent;
          const synthesisTitle = philoContent.synthesisType === 'predominance' ? 'التغليب' : philoContent.synthesisType === 'transcending' ? 'التجاوز' : 'التركيب';
          const positions = philoContent.positions || [];

          return (
              <div className="space-y-8 animate-fadeIn">
                   {videoUrl && <VideoPlayer url={videoUrl} />}
                   <div className="bg-[#1a1a1a] border border-neutral-800 p-6 rounded-2xl flex items-start gap-3"><Checkbox checked={completedSubItems.has('philo_problem')} onChange={() => onToggle(lessonId, 'philo_problem', subjectId)} /><div className="flex-1"><h3 className="text-lg font-black text-indigo-500 mb-4">1. طرح المشكلة</h3><p className="text-gray-300 text-sm leading-loose text-justify">{philoContent.problem}</p></div></div>
                   {positions.map((pos: any, idx: number) => (
                       <div key={idx} className="relative">
                           <div className="flex items-start gap-3 mb-6"><Checkbox checked={completedSubItems.has(`philo_pos_${idx}`)} onChange={() => onToggle(lessonId, `philo_pos_${idx}`, subjectId)} /><h3 className={`text-xl font-black ${idx % 2 === 0 ? 'text-blue-500' : 'text-orange-500'}`}>{pos.title}</h3></div>
                           <div className="space-y-6">
                               {pos.theories.map((theory: any, tIdx: number) => (
                                   <div key={tIdx} className="space-y-4">
                                       {theory.title && <h4 className="text-base font-bold text-yellow-500 border-b border-dashed border-neutral-700 pb-1 w-fit pr-2">{theory.title}</h4>}
                                       {theory.philosophers.map((philo: any, pIdx: number) => {
                                           const subItemId = `philo_arg_${philo.name.replace(/\s/g, '_')}_${idx}`;
                                           return <PhilosophyArgumentCard key={pIdx} philosopher={philo} subItemId={subItemId} isCompleted={completedSubItems.has(subItemId)} onToggle={() => onToggle(lessonId, subItemId, subjectId)} />
                                       })}
                                   </div>
                               ))}
                           </div>
                           {pos.critique && (
                               <div className="mt-6 bg-red-900/10 border border-red-500/20 p-5 rounded-xl flex items-start gap-3"><Checkbox checked={completedSubItems.has(`philo_critique_${idx}`)} onChange={() => onToggle(lessonId, `philo_critique_${idx}`, subjectId)} /><div className="flex-1"><h4 className="font-black text-base text-red-400 mb-3 flex items-center gap-2"><Layers size={18} className="text-red-500"/> نقد الموقف {idx === 0 ? 'الأول' : 'الثاني'}</h4><p className="text-gray-300 text-sm leading-loose text-justify">{pos.critique}</p></div></div>
                           )}
                       </div>
                   ))}
                   <div className="bg-[#1a1a1a] border border-neutral-800 p-6 rounded-2xl flex items-start gap-3"><Checkbox checked={completedSubItems.has('philo_synthesis')} onChange={() => onToggle(lessonId, 'philo_synthesis', subjectId)} /><div className="flex-1"><h3 className="text-lg font-black text-indigo-500 mb-4">{synthesisTitle}</h3><p className="text-gray-300 text-sm leading-loose text-justify">{philoContent.synthesis}</p></div></div>
                   <div className="bg-gradient-to-br from-[#1a1a1a] to-black border border-neutral-800 p-6 rounded-2xl shadow-lg flex items-start gap-3"><Checkbox checked={completedSubItems.has('philo_conclusion')} onChange={() => onToggle(lessonId, 'philo_conclusion', subjectId)} /><div className="flex-1"><h3 className="text-lg font-black text-green-500 mb-4 flex items-center gap-2"><CheckCircle size={20} /> حل المشكلة</h3><p className="text-gray-300 text-sm leading-loose text-justify">{philoContent.conclusion}</p></div></div>
              </div>
          );
      }
      
      let blocks: LessonBlock[] = [];
      if (parsed.type === 'standard') blocks = parsed.blocks || [];
      else if (Array.isArray(parsed)) blocks = parsed;
      else return <div className="whitespace-pre-wrap text-gray-300 text-sm leading-relaxed text-justify">{content}</div>;

      const isListType = blocks.length > 0 && ['date_entry', 'term_entry', 'char_entry', 'math_law'].includes(blocks[0].type);
      const filteredBlocks = isListType && searchTerm ? blocks.filter(b => b.text.includes(searchTerm) || (b.extra_1 && b.extra_1.includes(searchTerm))) : blocks;
      const isFrenchContent = blocks.some(b => b.type === 'term_entry' && b.color === 'indigo');

      return (
          <div className="space-y-3">
              {videoUrl && <VideoPlayer url={videoUrl} />}
              
              {/* Special Features for French Terms */}
              {isFrenchContent && <QuickTranslator blocks={blocks} />}
              
              {isListType && (
                  <div className="sticky top-0 z-10 bg-[#111]/90 backdrop-blur-md pb-4 pt-2">
                      <div className="relative"><Search className="absolute right-3 top-3 text-gray-500 w-5 h-5" /><input type="text" placeholder="بحث..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-[#1a1a1a] border border-neutral-700 rounded-xl py-2.5 pr-10 pl-4 text-white focus:border-yellow-500 outline-none"/></div>
                  </div>
              )}
              {filteredBlocks.map((block) => {
                  const isCompleted = completedSubItems.has(block.id);
                  const toggle = () => onToggle(lessonId, block.id, subjectId);
                  
                  // Flashcards / List Items - Keep Checkboxes for tracking specific items
                  if (block.type === 'date_entry') return (<div key={block.id} className={`flex items-center gap-3 bg-gradient-to-l from-teal-900/20 to-[#1a1a1a] p-4 rounded-xl border-r-4 ${isCompleted ? 'border-green-500' : 'border-teal-500'}`}><Checkbox checked={isCompleted} onChange={toggle} /><div className="flex items-center justify-between flex-1"><div className="flex items-center gap-3 z-10"><div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center text-white shadow-md"><Calendar size={20} /></div><span className="font-black text-white text-right flex-1 text-sm">{block.text}</span></div><span className="bg-black/40 px-3 py-1 rounded-lg font-mono text-teal-300 border border-teal-800 text-xs ml-4 shadow-md z-10">{block.extra_1}</span></div></div>);
                  if (block.type === 'math_law') return (<div key={block.id} className={`flex items-start gap-3 bg-gradient-to-l from-cyan-900/20 to-[#1a1a1a] p-4 rounded-xl border-r-4 ${isCompleted ? 'border-green-500' : 'border-cyan-500'}`}><Checkbox checked={isCompleted} onChange={toggle} /><div className="flex-1"><div className="flex items-center gap-3 mb-2 z-10"><div className="w-10 h-10 bg-cyan-600 rounded-full flex items-center justify-center text-white shadow-md"><Sigma size={20} /></div><h4 className="font-black text-white text-base ltr-text font-mono tracking-wider">{block.text}</h4></div><p className="text-gray-300 text-xs font-bold text-justify relative z-10 pt-2 mt-2 border-t border-cyan-800/50">{block.extra_1}</p></div></div>);
                  if (block.type === 'term_entry') {
                        // Check if it's French (Indigo color) to show audio button
                        const isFrench = block.color === 'indigo';
                        return (
                            <div key={block.id} className={`flex items-start gap-3 bg-gradient-to-l ${block.color === 'indigo' ? 'from-indigo-900/20' : 'from-blue-900/20'} to-[#1a1a1a] p-4 rounded-xl border-r-4 ${isCompleted ? 'border-green-500' : (block.color === 'indigo' ? 'border-indigo-500' : 'border-blue-500')}`}>
                                <Checkbox checked={isCompleted} onChange={toggle} />
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2 z-10">
                                        <div className={`w-10 h-10 ${block.color === 'indigo' ? 'bg-indigo-600' : 'bg-blue-600'} rounded-full flex items-center justify-center text-white shadow-md`}>
                                            <List size={20} />
                                        </div>
                                        <h4 className={`font-black ${block.color === 'indigo' ? 'text-indigo-300' : 'text-blue-300'} text-base flex items-center gap-2`}>
                                            {block.text}
                                            {isFrench && <AudioButton text={block.text} />}
                                        </h4>
                                    </div>
                                    <p className={`text-gray-300 text-xs leading-relaxed text-justify relative z-10 pt-2 mt-2 border-t ${block.color === 'indigo' ? 'border-indigo-800/50' : 'border-blue-800/50'}`}>
                                        {block.extra_1}
                                    </p>
                                </div>
                            </div>
                        );
                  }
                  if (block.type === 'char_entry') return (<div key={block.id} className={`flex items-start gap-3 bg-gradient-to-l from-orange-900/20 to-[#1a1a1a] p-5 rounded-xl border-r-4 ${isCompleted ? 'border-green-500' : 'border-orange-500'}`}><Checkbox checked={isCompleted} onChange={toggle} /><div className="flex-1"><div className="flex items-center gap-3 mb-2 z-10"><div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center text-white shadow-md"><Users size={20} /></div><h4 className="font-black text-white text-base">{block.text}</h4></div><p className="text-gray-300 text-xs leading-relaxed text-justify relative z-10 pt-2 mt-2 border-t border-orange-800/50">{block.extra_1}</p></div></div>);
                  
                  // Standard Text Blocks
                  const showCheckbox = block.type === 'title' || block.type === 'subtitle';
                  
                  if (showCheckbox) {
                      return (
                          <div key={block.id} className="flex items-center gap-3 mt-4">
                              <Checkbox checked={isCompleted} onChange={toggle} />
                              <div className="flex-1">
                                  <LessonBlockComponent block={block} />
                              </div>
                          </div>
                      );
                  }
                  
                  // Paragraphs - No Checkbox, simpler rendering
                  return (
                      <div key={block.id} className="pl-2">
                          <LessonBlockComponent block={block} />
                      </div>
                  );
              })}
              {isListType && filteredBlocks.length === 0 && <p className="text-center text-gray-500 py-4">لا توجد نتائج.</p>}
          </div>
      );
  } catch (e) {
      console.error("Error parsing lesson content:", e);
      return <div className="whitespace-pre-wrap text-gray-300 text-sm leading-relaxed text-justify">{content}</div>;
  }
};

export default LessonRenderer;
