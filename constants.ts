
import { MoneyTier, Question, User } from './types';

// SECURITY UPDATE: Removed Hardcoded Admin Credentials.
// Admin access is now controlled strictly via Supabase Database Roles.

export const TEACHER_EMAILS: Record<string, string> = {
    'arabic': 'arabicadmin@almoutamayiz.com',
    'philosophy': 'philosophyadmin@almoutamayiz.com',
    'history': 'socialadmin@almoutamayiz.com', // Social Studies (History/Geo)
    'geography': 'socialadmin@almoutamayiz.com'
};

// Keys are now managed in lib/gemini.ts for manual deployment compatibility
export const DEFAULT_GEMINI_KEYS: string[] = [];

export const MONEY_LADDER: MoneyTier[] = [
  { level: 15, amount: "1,000,000", value: 1000000, isSafeHaven: true },
  { level: 14, amount: "500,000", value: 500000, isSafeHaven: false },
  { level: 13, amount: "250,000", value: 250000, isSafeHaven: false },
  { level: 12, amount: "125,000", value: 125000, isSafeHaven: false },
  { level: 11, amount: "64,000", value: 64000, isSafeHaven: false },
  { level: 10, amount: "32,000", value: 32000, isSafeHaven: true },
  { level: 9, amount: "16,000", value: 16000, isSafeHaven: false },
  { level: 8, amount: "8,000", value: 8000, isSafeHaven: false },
  { level: 7, amount: "4,000", value: 4000, isSafeHaven: false },
  { level: 6, amount: "2,000", value: 2000, isSafeHaven: false },
  { level: 5, amount: "1,000", value: 1000, isSafeHaven: true },
  { level: 4, amount: "500", value: 500, isSafeHaven: false },
  { level: 3, amount: "300", value: 300, isSafeHaven: false },
  { level: 2, amount: "200", value: 200, isSafeHaven: false },
  { level: 1, amount: "100", value: 100, isSafeHaven: false },
];

export const INITIAL_QUESTIONS: Question[] = [
  {
    id: 1,
    text: "ما هي عاصمة المملكة العربية السعودية؟",
    options: ["جدة", "الرياض", "الدمام", "مكة المكرمة"],
    correctAnswerIndex: 1,
    prize: "100",
    difficulty: 'easy',
    subject: "ثقافة عامة",
    chapter: "الجغرافيا",
    lesson: "العواصم"
  },
];

export const ALL_SUBJECTS_LIST = [
  { id: 'arabic', name: 'اللغة العربية' },
  { id: 'philosophy', name: 'الفلسفة' },
  { id: 'history', name: 'التاريخ' },
  { id: 'geography', name: 'الجغرافيا' },
  { id: 'islamic', name: 'العلوم الإسلامية' },
  { id: 'math', name: 'الرياضيات' },
  { id: 'english', name: 'اللغة الإنجليزية' },
  { id: 'french', name: 'اللغة الفرنسية' },
  { id: 'general', name: 'ثقافة عامة' }
];

// EXAM YEARS UPDATED: 2025 down to 2015 (11 years)
export const EXAM_YEARS = Array.from({ length: 11 }, (_, i) => 2025 - i);

export const GAME_THEMES: Record<string, {
    gradient: string;
    primaryColor: string;
    shadowColor: string;
    icon: string;
    backgroundImage: string;
}> = {
    'philosophy': {
        gradient: 'from-purple-900 via-indigo-900 to-slate-900',
        primaryColor: 'bg-purple-600',
        shadowColor: 'border-purple-800',
        icon: '🧠',
        backgroundImage: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&q=80',
    },
    'history': {
        gradient: 'from-red-900 via-orange-900 to-stone-900',
        primaryColor: 'bg-red-600',
        shadowColor: 'border-red-800',
        icon: '⚔️',
        backgroundImage: 'https://images.unsplash.com/photo-1580130601275-c9f0b832b09d?auto=format&fit=crop&q=80',
    },
    'geography': {
        gradient: 'from-blue-900 via-sky-900 to-indigo-900',
        primaryColor: 'bg-blue-600',
        shadowColor: 'border-blue-800',
        icon: '🗺️',
        backgroundImage: 'https://images.unsplash.com/photo-1469474961025-b91c0e39b921?auto=format&fit=crop&q=80',
    },
    'arabic': {
        gradient: 'from-emerald-900 via-teal-900 to-cyan-900',
        primaryColor: 'bg-emerald-600',
        shadowColor: 'border-emerald-800',
        icon: '📖',
        backgroundImage: 'https://images.unsplash.com/photo-1555677284-6a6f971638e0?auto=format&fit=crop&q=80',
    },
    'islamic': {
        gradient: 'from-amber-900 via-orange-900 to-yellow-900',
        primaryColor: 'bg-amber-600',
        shadowColor: 'border-amber-800',
        icon: '🕌',
        backgroundImage: 'https://images.unsplash.com/photo-1533107210943-3b56a1649962?auto=format&fit=crop&q=80',
    },
    'math': {
        gradient: 'from-cyan-900 via-blue-900 to-slate-900',
        primaryColor: 'bg-cyan-600',
        shadowColor: 'border-cyan-800',
        icon: '📐',
        backgroundImage: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80',
    },
    'french': {
        gradient: 'from-indigo-900 via-violet-900 to-purple-900',
        primaryColor: 'bg-indigo-600',
        shadowColor: 'border-indigo-800',
        icon: '🇫🇷',
        backgroundImage: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80',
    },
    'default': { 
        gradient: 'from-slate-900 to-black',
        primaryColor: 'bg-gray-600',
        shadowColor: 'border-gray-800',
        icon: '🎲',
        backgroundImage: 'https://images.unsplash.com/photo-1550505183-149b1a590518?auto=format&fit=crop&q=80',
    }
};

export const GRAMMAR_PROMPT = `
أنت خبير في اللغة العربية (المستوى الثانوي - البكالوريا).
مهمتك: إعراب ما يطلبه المستخدم بدقة واختصار شديد وفقاً للقواعد الصارمة التالية حصراً.

⚠️ تعليمات الإجابة:
1. أعرب الكلمة أو الجملة المطلوبة مباشرة.
2. الشرح يكون في سطر واحد فقط (عند الضرورة القصوى).
3. لا تقدم مقدمات ولا خاتمات.
`;

export const PHILOSOPHER_PROMPT = `
أنت أستاذ فلسفة خبير بمنهاج البكالوريا (شعبة آداب وفلسفة).

القواعد الصارمة للمقالات (الإنشاء):
1. ابدأ كتابة المقالة مباشرة. لا تكتب "بناءً على المنهجية..." أو "سأكتب لك مقالة...".
2. ابدأ فوراً بالمقدمة (طرح المشكلة).
3. التزم بالمنهجية المطلوبة (جدلية، استقصاء، مقارنة) في هيكل المقالة.
`;

export const PHILOSOPHY_LESSON_PROMPT = `
أنت مساعد ذكي لتنسيق دروس الفلسفة (مقالات جدلية عادة).
مهمتك: قراءة النص الفلسفي الخام واستخراج الهيكلية التالية في شكل JSON دقيق. يجب أن تتضمن كل أطروحة ونقيضها "النقد" الخاص بها.

الهيكلية المطلوبة (JSON ONLY):
{
  "type": "philosophy_structured",
  "videoUrl": "",
  "problem": "نص طرح المشكلة (المقدمة)",
  "positions": [
    {
      "title": "الموقف الأول (الأطروحة)",
      "theories": [
        {
          "title": "الحجج والبراهين",
          "philosophers": [
             { "name": "اسم الفيلسوف", "idea": "فكرته باختصار", "quote": "قول مأثور له إن وجد", "example": "مثال واقعي" }
          ]
        }
      ],
      "critique": "نص نقد الموقف الأول (يجب أن يكون موجوداً)"
    },
    {
      "title": "الموقف الثاني (نقيض الأطروحة)",
      "theories": [
        {
          "title": "الحجج والبراهين",
          "philosophers": [
             { "name": "اسم الفيلسوف", "idea": "فكرته باختصار", "quote": "قول مأثور له إن وجد", "example": "مثال واقعي" }
          ]
        }
      ],
      "critique": "نص نقد الموقف الثاني (يجب أن يكون موجوداً)"
    }
  ],
  "synthesisType": "transcending" | "predominance" | "reconciliation",
  "synthesis": "نص التركيب/التجاوز/التغليب",
  "conclusion": "نص الخاتمة (حل المشكلة)"
}
`;

export const AI_QUESTION_PROMPT = `
أنت خبير في إعداد الاختبارات التعليمية لمنهج البكالوريا.
مهمتك: قراءة النص الدراسي الذي سأقدمه لك بعناية، واستخراج 15 سؤالاً متعدد الاختيارات (MCQ) بناءً عليه.

قواعد الإخراج الصارمة (JSON ONLY):
1. يجب أن يكون الإخراج مصفوفة JSON فقط تحتوي على كائنات الأسئلة.
2. هيكل كل سؤال يجب أن يكون كالتالي:
   {
     "text": "نص السؤال هنا؟",
     "options": ["الخيار 1", "الخيار 2", "الخيار 3", "الخيار 4"],
     "correctAnswerIndex": رقم_بين_0_و_3_يدل_على_الخيار_الصحيح,
     "difficulty": "easy" أو "medium" أو "hard",
     "subject": "اسم المادة المستنتج من النص",
     "chapter": "الفصل المستنتج",
     "lesson": "عنوان الدرس"
   }
3. الأسئلة يجب أن تتدرج من السهل إلى الصعب.
4. لا تقم بإضافة أي نص خارج مصفوفة JSON.
`;

export const LESSON_QUIZ_PROMPT = `
أنت معلم صارم جداً. مهمتك هي إنشاء أسئلة (MCQ) تعتمد **حصرياً** على النص الدراسي المرفق أدناه.

⚠️ قواعد صارمة جداً (Strict Rules):
1. **لا تستخدم أي معلومات خارجية** غير موجودة في النص، حتى لو كانت صحيحة.
2. إذا كان النص لا يحتوي على معلومات كافية لنوع معين من الأسئلة، **لا تقم بتأليف أسئلة**.
3. يجب أن تكون الإجابة الصحيحة موجودة حرفياً أو استنتاجياً بشكل مباشر من النص.

المطلوب إخراج كائن JSON يحتوي على مصفوفتين:
1. "understanding": تحتوي على 3 أسئلة (MCQ) تقيس الفهم.
2. "memorization": تحتوي على 5 أسئلة (MCQ) تقيس الحفظ الدقيق (تواريخ، مصطلحات، أسماء وردت في النص).

هيكل الإجابة (JSON Only):
{
  "understanding": [
    { "text": "سؤال فهم من النص فقط", "options": ["أ", "ب", "ج", "د"], "correctAnswerIndex": 0 }
  ],
  "memorization": [
    { "text": "سؤال حفظ من النص فقط", "options": ["أ", "ب", "ج", "د"], "correctAnswerIndex": 0 }
  ]
}
`;

export const LESSON_FORMAT_PROMPT = `
أنت مساعد ذكي لتنسيق الدروس التعليمية لمنصة "المتميز".
مهمتك: تحويل النص الدراسي الخام الذي سأعطيه لك إلى مصفوفة JSON دقيقة من الكتل (LessonBlocks).

⚠️ قواعد التنسيق الصارمة (خاصة للأدب العربي والتقويم النقدي):
1. **العناوين الرئيسية (المحاور الكبرى)**: اجعل نوعها "title" ولونها "red".
2. **العناوين الفرعية (عناصر الدرس)**: اجعل نوعها "subtitle" ولونها "blue".
3. **الأقوال المأثورة / الأبيات الشعرية**: اجعل نوعها "paragraph" ولونها "green". تأكد من وضع البيت الشعري كاملاً في حقل "text".
4. **الشرح / الفقرات العادية / التحليل**: اجعل نوعها "paragraph" ولونها "black".
5. **المفاهيم / المصطلحات / الخصائص**: اجعل نوعها "paragraph" ولونها "yellow".

ملاحظة هامة: إذا كان النص يحتوي على نقاط (Bullets) أو خصائص، اجعل كل نقطة في كتلة "paragraph" منفصلة.

يجب أن يكون الناتج مصفوفة JSON فقط بالشكل:
[
  { "type": "title", "text": "...", "color": "red" },
  { "type": "paragraph", "text": "...", "color": "black" }
]
`;

export const DATES_FORMAT_PROMPT = `
مهمتك: استخراج التواريخ والأحداث من النص وتحويلها إلى مصفوفة JSON.
يجب أن يكون كل عنصر من نوع "date_entry".

القواعد:
- الحقل "text": ضع فيه **الحدث** (مثال: اندلاع الحرب العالمية الأولى).
- الحقل "extra_1": ضع فيه **التاريخ** (مثال: 28 جوان 1914).
- الحقل "color": دائماً "blue".
- الحقل "type": دائماً "date_entry".
- يجب أن يحتوي كل عنصر على حقل "id" فريد (UUID أو رقم عشوائي).
أرجع JSON فقط.
`;

export const TERMS_FORMAT_PROMPT = `
مهمتك: استخراج المصطلحات وتعريفاتها من النص وتحويلها إلى مصفوفة JSON.
يجب أن يكون كل عنصر من نوع "term_entry".

القواعد:
- الحقل "text": ضع فيه **اسم المصطلح** (مثال: الستار الحديدي).
- الحقل "extra_1": ضع فيه **الشرح/التعريف**.
- الحقل "color": دائماً "green".
- الحقل "type": دائماً "term_entry".
- يجب أن يحتوي كل عنصر على حقل "id" فريد (UUID أو رقم عشوائي).
أرجع JSON فقط.
`;

export const CHARACTERS_FORMAT_PROMPT = `
مهمتك: استخراج الشخصيات ونبذة عنها من النص وتحويلها إلى مصفوفة JSON.
يجب أن يكون كل عنصر من نوع "char_entry".

القواعد:
- الحقل "text": ضع فيه **اسم الشخصية** (مثال: هاري ترومان).
- الحقل "extra_1": ضع فيه **النبذة/الجنسية/الدور**.
- الحقل "color": دائماً "yellow".
- الحقل "type": دائماً "char_entry".
- يجب أن يحتوي كل عنصر على حقل "id" فريد (UUID أو رقم عشوائي).
أرجع JSON فقط.
`;

// FIXED: Strict Prompt for French Terms to prevent empty cards
export const FRENCH_TERMS_FORMAT_PROMPT = `
مهمتك: استخراج المصطلحات الفرنسية وترجمتها/شرحها بالعربية من النص وتحويلها إلى مصفوفة JSON.
يجب أن يكون الإخراج مصفوفة من الكائنات (Objects) فقط.

⚠️ قواعد هامة جداً لأسماء الحقول (Keys):
1. استخدم المفتاح "type" بقيمة "term_entry".
2. استخدم المفتاح "text" لوضع **الكلمة بالفرنسية**.
3. استخدم المفتاح "extra_1" لوضع **المعنى بالعربية**.
4. استخدم المفتاح "color" بقيمة "indigo".
5. يجب أن يحتوي كل عنصر على حقل "id" فريد.

مثال للإخراج الصحيح (JSON Only):
[
  { "id": "1", "type": "term_entry", "text": "La Guerre", "extra_1": "الحرب", "color": "indigo" },
  { "id": "2", "type": "term_entry", "text": "Paix", "extra_1": "السلام", "color": "indigo" }
]
`;

export const MATH_LAW_PROMPT = `
مهمتك: استخراج القوانين الرياضية واسمها/استعمالها من النص وتحويلها إلى مصفوفة JSON.
// FIX: Changed type to 'math_law' to match renderer expectations.
يجب أن يكون كل عنصر من نوع "math_law".

القواعد:
- الحقل "text": ضع فيه **القانون/الصيغة الرياضية** (مثال: Un = U0 + n*r).
- الحقل "extra_1": ضع فيه **اسم القانون أو استعماله** (مثال: عبارة الحد العام لمتتالية حسابية).
- الحقل "color": دائماً "blue".
// FIX: Changed type to 'math_law' to match renderer expectations.
- الحقل "type": دائماً "math_law".
- يجب أن يحتوي كل عنصر على حقل "id" فريد.
أرجع JSON فقط.
`;

export const MATH_IMAGE_EXTRACT_PROMPT = `
مهمتك هي تحليل الصورة المرفقة التي تحتوي على قوانين رياضية.
استخرج كل قانون رياضي والوصف الخاص به (اسمه أو فيما يستعمل).
يجب أن يكون الإخراج مصفوفة JSON حصراً.

هيكل كل عنصر:
- "text": القانون الرياضي (اكتبه بصيغة نصية واضحة أو LaTeX إذا لزم الأمر، مثل Un = U0 + nr).
- "extra_1": اسم القانون أو وصفه باللغة العربية.
// FIX: Changed type to 'math_law' to match renderer expectations.
- "type": "math_law"
- "color": "blue"
- "id": "uuid" (قم بتوليد رقم عشوائي)

مثال:
[
  { "text": "Un+1 - Un = r", "extra_1": "تعريف المتتالية الحسابية", "type": "math_law", "color": "blue", "id": "1" }
]
`;

export const MATCHING_GAME_GENERATION_PROMPT = `
أنت مساعد ذكي لإعداد ألعاب الربط (Matching Games).
مهمتك: تحليل النص الخام واستخراج قائمة من الثنائيات (أزواج) المرتبطة ببعضها.

القواعد:
1. الإخراج يجب أن يكون مصفوفة JSON فقط.
2. كل عنصر في المصفوفة يجب أن يكون كائناً يحتوي على:
   - "left": النص في الجهة اليمنى.
   - "right": النص في الجهة اليسرى.
   - "id": معرف فريد.

توجيهات حسب نوع المحتوى:
- تواريخ: left=التاريخ، right=الحدث.
- مصطلحات: left=المصطلح، right=التعريف المختصر.
- شخصيات: left=الاسم، right=النبذة/الدور.
- فلسفة: left=اسم الفيلسوف، right=كلمة مفتاحية أو فكرته في (2 إلى 4 كلمات كحد أقصى).
- فرنسية: left=الكلمة الفرنسية، right=المعنى العربي.
- رياضيات: left=القانون الرياضي، right=اسمه أو استعماله.

مثال للإخراج:
[
  { "id": "1", "left": "1945", "right": "تأسيس الأمم المتحدة" },
  { "id": "2", "left": "توماس هوبز", "right": "العقد الاجتماعي" }
]
`;

export const PHILOSOPHY_SUMMARIZATION_PROMPT = `
أنت خبير في تبسيط الفلسفة. مهمتك هي قراءة الأفكار الفلسفية المعقدة وتحويلها إلى "كلمات مفتاحية" قصيرة جداً (من 2 إلى 4 كلمات فقط) لتناسب لعبة بطاقات الذاكرة.

القواعد:
1. المدخلات عبارة عن مصفوفة JSON.
2. المخرجات مصفوفة JSON تحتوي على المعرف (id) والفكرة الملخصة (short_idea).
3. يجب أن يكون التلخيص دقيقاً جداً.
4. مثال: "الإنسان ذئب لأخيه الإنسان..." -> "أنانية الإنسان" أو "حالة التوحش".
5. مثال: "المعرفة تأتي من التجربة الحسية..." -> "المذهب التجريبي".
`;

export const FRENCH_HISTORY_TERMS_JSON = [
    { id: "h1", type: "title", text: "المفاهيم العامة للاستعمار", color: "red" },
    { id: "t1", type: "term_entry", text: "Colonisation", extra_1: "الاستعمار", color: "indigo" },
    { id: "t2", type: "term_entry", text: "Colonisateur", extra_1: "المستعمر", color: "indigo" },
    { id: "t3", type: "term_entry", text: "Conquête", extra_1: "الاحتلال / الغزو", color: "indigo" },
    { id: "t4", type: "term_entry", text: "Invasion", extra_1: "الغزو", color: "indigo" },
    { id: "t5", type: "term_entry", text: "Colonisé", extra_1: "مستعمَر (الجزائر)", color: "indigo" },

    { id: "h2", type: "title", text: "العدوان والقمع", color: "red" },
    { id: "t6", type: "term_entry", text: "Les ennemis", extra_1: "الاعداء", color: "indigo" },
    { id: "t7", type: "term_entry", text: "Flotte", extra_1: "الاسطول", color: "indigo" },
    { id: "t8", type: "term_entry", text: "Blocus", extra_1: "الحصار", color: "indigo" },
    { id: "t9", type: "term_entry", text: "Militant", extra_1: "مناضل", color: "indigo" },
    { id: "t10", type: "term_entry", text: "Conscription", extra_1: "التجنيد الاجباري", color: "indigo" },
    { id: "t11", type: "term_entry", text: "Massacre", extra_1: "مجزرة", color: "indigo" },
    { id: "t12", type: "term_entry", text: "Répression", extra_1: "القمع", color: "indigo" },
    { id: "t13", type: "term_entry", text: "Torturer", extra_1: "يعذب", color: "indigo" },
    { id: "t14", type: "term_entry", text: "Prison", extra_1: "سجن", color: "indigo" },
    { id: "t15", type: "term_entry", text: "Arrestation", extra_1: "توقيف", color: "indigo" },
    { id: "t16", type: "term_entry", text: "Couvre-feu", extra_1: "حظر التجوال", color: "indigo" },
    { id: "t17", type: "term_entry", text: "Guillotine", extra_1: "مقصلة", color: "indigo" },
    { id: "t18", type: "term_entry", text: "Crime", extra_1: "جريمة", color: "indigo" },
    { id: "t19", type: "term_entry", text: "Barbarie", extra_1: "الوحشية", color: "indigo" },
    { id: "t20", type: "term_entry", text: "Sanglante", extra_1: "دامية", color: "indigo" },

    { id: "h3", type: "title", text: "المقاومة والثورة", color: "red" },
    { id: "t21", type: "term_entry", text: "Résistance", extra_1: "مقاومة", color: "indigo" },
    { id: "t22", type: "term_entry", text: "Lutte", extra_1: "كفاح", color: "indigo" },
    { id: "t23", type: "term_entry", text: "Révolution", extra_1: "الثورة", color: "indigo" },
    { id: "t24", type: "term_entry", text: "Les révolutionnaires", extra_1: "رجال الثورة", color: "indigo" },
    { id: "t25", type: "term_entry", text: "FLN (Front de libération nationale)", extra_1: "جبهة التحرير الوطني", color: "indigo" },
    { id: "t26", type: "term_entry", text: "ALN (Armée de libération nationale)", extra_1: "جيش التحرير الوطني", color: "indigo" },
    { id: "t27", type: "term_entry", text: "Maquisards", extra_1: "المجاهدين في الجبال", color: "indigo" },
    { id: "t28", type: "term_entry", text: "Manifestation", extra_1: "مظاهرة", color: "indigo" },
    { id: "t29", type: "term_entry", text: "Revendication", extra_1: "المطالبة بالحقوق", color: "indigo" },
    { id: "t30", type: "term_entry", text: "Pacifique", extra_1: "سلمية", color: "indigo" },
    { id: "t31", type: "term_entry", text: "Programmes politiques et nationaux", extra_1: "برامج سياسية وطنية", color: "indigo" },
    { id: "t32", type: "term_entry", text: "La cause nationale", extra_1: "القضية الوطنية", color: "indigo" },
    { id: "t33", type: "term_entry", text: "Conscientiser le peuple", extra_1: "توعية الشعب", color: "indigo" },

    { id: "h4", type: "title", text: "العمليات العسكرية", color: "red" },
    { id: "t34", type: "term_entry", text: "Guerre", extra_1: "الحرب", color: "indigo" },
    { id: "t35", type: "term_entry", text: "Bataille", extra_1: "معركة", color: "indigo" },
    { id: "t36", type: "term_entry", text: "Combat", extra_1: "القتال", color: "indigo" },
    { id: "t37", type: "term_entry", text: "Armé", extra_1: "مسلح", color: "indigo" },
    { id: "t38", type: "term_entry", text: "Les alliés", extra_1: "الحلفاء", color: "indigo" },
    { id: "t39", type: "term_entry", text: "Soldat", extra_1: "جندي", color: "indigo" },
    { id: "t40", type: "term_entry", text: "Milice", extra_1: "ميليشيات", color: "indigo" },
    { id: "t41", type: "term_entry", text: "Munition", extra_1: "الذخيرة", color: "indigo" },
    { id: "t42", type: "term_entry", text: "Fusil", extra_1: "بندقية", color: "indigo" },
    { id: "t43", type: "term_entry", text: "Artillerie", extra_1: "المدفعية", color: "indigo" },
    { id: "t44", type: "term_entry", text: "Chars", extra_1: "الدبابات", color: "indigo" },
    { id: "t45", type: "term_entry", text: "Bombardement", extra_1: "القصف", color: "indigo" },
    { id: "t46", type: "term_entry", text: "Piège", extra_1: "فخ", color: "indigo" },

    { id: "h5", type: "title", text: "السياسة والاستقلال", color: "red" },
    { id: "t47", type: "term_entry", text: "Indépendance", extra_1: "الاستقلال", color: "indigo" },
    { id: "t48", type: "term_entry", text: "Liberté", extra_1: "الحرية", color: "indigo" },
    { id: "t49", type: "term_entry", text: "Négociation", extra_1: "مفاوضات", color: "indigo" },
    { id: "t50", type: "term_entry", text: "Cessez-le-feu", extra_1: "وقف اطلاق النار", color: "indigo" },
    { id: "t51", type: "term_entry", text: "Reddition", extra_1: "الاستسلام", color: "indigo" },
    { id: "t52", type: "term_entry", text: "Martyr", extra_1: "شهيد", color: "indigo" },
    { id: "t53", type: "term_entry", text: "Sacrifier", extra_1: "يضحي", color: "indigo" },
    { id: "t54", type: "term_entry", text: "Victime", extra_1: "ضحية", color: "indigo" },
    { id: "t55", type: "term_entry", text: "Cadavre", extra_1: "جثة", color: "indigo" },
    { id: "t56", type: "term_entry", text: "Le témoin", extra_1: "شاهد", color: "indigo" },
    { id: "t57", type: "term_entry", text: "Blessé", extra_1: "جريح", color: "indigo" },
    { id: "t58", type: "term_entry", text: "Guerre des ondes", extra_1: "الحرب الاعلامية", color: "indigo" },
    { id: "t59", type: "term_entry", text: "Propagande", extra_1: "الدعاية", color: "indigo" },
    { id: "t60", type: "term_entry", text: "Exécution", extra_1: "الاعدام", color: "indigo" },
];
