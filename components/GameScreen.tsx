import React, { useState, useEffect } from 'react';
import { Question, Lifelines, MoneyTier } from '../types';
import { Users, Phone, XCircle, Clock, LogOut, Sparkles, BookOpen, Layers, CheckCircle, X } from 'lucide-react';
import { playClickSound, playCorrectSound, playLifelineSound, playWrongSound } from '../utils/audio';

// Custom small points ladder
const POINTS_LADDER: MoneyTier[] = [
  { level: 15, amount: "15 نقاط", value: 15, isSafeHaven: true },
  { level: 14, amount: "14 نقطة", value: 14, isSafeHaven: false },
  { level: 13, amount: "13 نقطة", value: 13, isSafeHaven: false },
  { level: 12, amount: "12 نقطة", value: 12, isSafeHaven: false },
  { level: 11, amount: "11 نقطة", value: 11, isSafeHaven: false },
  { level: 10, amount: "10 نقاط", value: 10, isSafeHaven: true },
  { level: 9, amount: "9 نقاط", value: 9, isSafeHaven: false },
  { level: 8, amount: "8 نقاط", value: 8, isSafeHaven: false },
  { level: 7, amount: "7 نقاط", value: 7, isSafeHaven: false },
  { level: 6, amount: "6 نقاط", value: 6, isSafeHaven: false },
  { level: 5, amount: "5 نقاط", value: 5, isSafeHaven: true },
  { level: 4, amount: "4 نقاط", value: 4, isSafeHaven: false },
  { level: 3, amount: "3 نقاط", value: 3, isSafeHaven: false },
  { level: 2, amount: "2 نقاط", value: 2, isSafeHaven: false },
  { level: 1, amount: "1 نقطة", value: 1, isSafeHaven: false },
];

interface GameScreenProps {
  questions: Question[];
  onGameOver: (amountWon: string, numericValue: number) => void;
  onVictory: (amountWon:string, numericValue: number) => void;
  onExit: () => void;
}

const MoneyLadder: React.FC<{ currentLevel: number, ladderData: MoneyTier[] }> = ({ currentLevel, ladderData }) => {
    return (
        <div className="w-full flex flex-col-reverse justify-center py-4 px-2 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 h-fit max-h-[80vh] overflow-y-auto custom-scrollbar">
            {ladderData.map((tier) => {
                const isActive = currentLevel === tier.level;
                const isPassed = currentLevel > tier.level;
                return (
                    <div key={tier.level} className={`
                        flex items-center justify-between text-xs md:text-sm py-1.5 px-3 rounded-lg mb-1 transition-all duration-300
                        ${isActive ? 'bg-gradient-to-r from-orange-600 to-yellow-600 text-white scale-105 shadow-lg font-bold border border-yellow-400' : ''}
                        ${isPassed ? 'text-green-400 opacity-60' : ''}
                        ${!isActive && !isPassed ? (tier.isSafeHaven ? 'text-white font-bold' : 'text-orange-300/70') : ''}
                    `}>
                        <span className={`w-6 ${isActive ? 'text-white' : 'text-orange-500'}`}>{tier.level}</span>
                        <span className="font-mono tracking-wider">{tier.amount}</span>
                        {tier.isSafeHaven && <span className="w-2 h-2 rounded-full bg-white ml-2"></span>}
                    </div>
                );
            })}
        </div>
    );
};

const GameScreen: React.FC<GameScreenProps> = ({ questions, onGameOver, onVictory, onExit }) => {
  const maxLevels = Math.min(15, questions.length);
  const activeLadder = POINTS_LADDER.slice(POINTS_LADDER.length - maxLevels);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [gameState, setGameState] = useState<'waiting' | 'selected' | 'revealed'>('waiting');
  const [lifelines, setLifelines] = useState<Lifelines>({ fiftyFifty: true, askAudience: true, callFriend: true });
  const [disabledOptions, setDisabledOptions] = useState<number[]>([]);
  const [timer, setTimer] = useState(45);
  const [audienceData, setAudienceData] = useState<number[] | null>(null);
  const [showLadderMobile, setShowLadderMobile] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const isAiQuestion = (currentQuestion as any).isAi;

  // Sound effects on mount
  useEffect(() => {
      // playIntroSound(); // Optional
  }, []);

  useEffect(() => {
    if (gameState !== 'waiting') return;
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState, currentQuestionIndex]);

  const handleTimeOut = () => {
    playWrongSound();
    const safeData = getSafeAmountData(currentQuestionIndex);
    onGameOver(safeData.amount, safeData.value);
  };

  const getSafeAmountData = (index: number): { amount: string, value: number } => {
    if (index === 0) return { amount: "0", value: 0 };
    const safeTier = activeLadder
        .filter(t => t.level <= index && t.isSafeHaven)
        .sort((a, b) => b.level - a.level)[0];
    if (safeTier) return { amount: safeTier.amount, value: safeTier.value };
    return { amount: "0 نقطة", value: 0 };
  };

  const handleOptionSelect = (index: number) => {
    if (gameState !== 'waiting' || disabledOptions.includes(index)) return;
    playClickSound();
    setSelectedOption(index);
    setGameState('selected');

    setTimeout(() => {
      setGameState('revealed');
      if (index === currentQuestion.correctAnswerIndex) {
        playCorrectSound();
        setTimeout(() => {
          if (currentQuestionIndex < maxLevels - 1) {
            handleNextLevel();
          } else {
            const finalTier = activeLadder.find(t => t.level === maxLevels);
            onVictory(finalTier?.amount || "15 نقطة", finalTier?.value || 15);
          }
        }, 2000);
      } else {
        playWrongSound();
        setTimeout(() => {
          const safeData = getSafeAmountData(currentQuestionIndex);
          onGameOver(safeData.amount, safeData.value);
        }, 2500);
      }
    }, 2000); // Suspense delay
  };

  const handleNextLevel = () => {
    setCurrentQuestionIndex(prev => prev + 1);
    setSelectedOption(null);
    setGameState('waiting');
    setDisabledOptions([]);
    setAudienceData(null);
    setTimer(45);
  };

  const useFiftyFifty = () => {
    if (!lifelines.fiftyFifty || gameState !== 'waiting') return;
    playLifelineSound();
    const correct = currentQuestion.correctAnswerIndex;
    let wrongOptions = [0, 1, 2, 3].filter(i => i !== correct);
    // Remove 2 wrong answers
    while (wrongOptions.length > 1) {
        const randomIdx = Math.floor(Math.random() * wrongOptions.length);
        wrongOptions.splice(randomIdx, 1);
    }
    // Now wrongOptions has 1 item left (the one to KEEP). 
    // We need to disable the other 2.
    const toDisable = [0, 1, 2, 3].filter(i => i !== correct && !wrongOptions.includes(i));
    
    setDisabledOptions(toDisable);
    setLifelines(prev => ({ ...prev, fiftyFifty: false }));
  };

  const useAskAudience = () => {
    if (!lifelines.askAudience || gameState !== 'waiting') return;
    playLifelineSound();
    const correct = currentQuestion.correctAnswerIndex;
    let data = [0, 0, 0, 0];
    let remaining = 100;
    const correctChance = Math.floor(Math.random() * 40) + 45; // 45-85% for correct
    data[correct] = correctChance;
    remaining -= correctChance;
    [0, 1, 2, 3].filter(i => i !== correct).forEach((i, idx, arr) => {
        if (idx === arr.length - 1) {
            data[i] = remaining;
        } else {
            const val = Math.floor(Math.random() * remaining);
            data[i] = val;
            remaining -= val;
        }
    });
    setAudienceData(data);
    setLifelines(prev => ({ ...prev, askAudience: false }));
  };

  const useCallFriend = () => {
    if (!lifelines.callFriend || gameState !== 'waiting') return;
    playLifelineSound();
    const correct = currentQuestion.correctAnswerIndex;
    const isCorrect = Math.random() > 0.2; // 80% chance friend knows
    const choice = isCorrect ? correct : [0, 1, 2, 3].filter(i => i !== correct)[Math.floor(Math.random()*3)];
    const friendName = ["أحمد", "سارة", "محمد", "يوسف"][Math.floor(Math.random()*4)];
    alert(`${friendName}: "أظن أن الإجابة الصحيحة هي ${currentQuestion.options[choice]}... أنا متأكد بنسبة ${isCorrect ? '90' : '40'}%."`);
    setLifelines(prev => ({ ...prev, callFriend: false }));
  };

  const getOptionClasses = (index: number) => {
    let base = "relative group w-full py-4 px-6 rounded-full border-2 transition-all duration-300 flex items-center overflow-hidden active:scale-95 shadow-md ";
    
    if (disabledOptions.includes(index)) {
        return base + " border-slate-700 bg-slate-900/50 opacity-30 cursor-not-allowed";
    }

    if (gameState === 'selected' && selectedOption === index) {
        return base + " border-yellow-500 bg-yellow-600/40 text-yellow-100 shadow-[0_0_20px_rgba(234,179,8,0.5)]";
    }

    if (gameState === 'revealed') {
        if (index === currentQuestion.correctAnswerIndex) {
            return base + " border-green-500 bg-green-600/40 text-white shadow-[0_0_20px_rgba(34,197,94,0.6)] animate-pulse";
        }
        if (index === selectedOption) {
            return base + " border-red-500 bg-red-600/40 text-white shadow-[0_0_20px_rgba(239,68,68,0.6)]";
        }
    }

    return base + " border-blue-500/30 bg-gradient-to-b from-slate-800 to-slate-900 hover:border-yellow-400 hover:bg-slate-800 text-white";
  };
  
  const handleExitClick = () => {
    if (window.confirm("هل أنت متأكد من رغبتك في الانسحاب؟ ستحتفظ بما وصلت إليه من نقاط آمنة.")) {
      const safeData = getSafeAmountData(currentQuestionIndex);
      // If manually exiting, maybe give them current level if not safe? Usually you take safe haven.
      // But let's stick to safe haven logic for simplicity or current amount if we want to be generous?
      // Millionaire rules: Walk away = Take current money. Drop out (fail) = Drop to safe haven.
      // Let's implement "Walk Away" = Take previous level amount.
      let walkAwayAmount = "0";
      let walkAwayValue = 0;
      if (currentQuestionIndex > 0) {
          const prevTier = activeLadder.find(t => t.level === currentQuestionIndex);
          if (prevTier) {
              walkAwayAmount = prevTier.amount;
              walkAwayValue = prevTier.value;
          }
      }
      onGameOver(walkAwayAmount, walkAwayValue);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#02020a] text-white font-cairo overflow-hidden relative selection:bg-yellow-500 selection:text-black">
      
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1e1b4b_0%,_#000000_80%)] z-0"></div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 z-0 animate-pulse"></div>

      {/* Top Bar */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-30">
        <button onClick={() => onExit()} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors border border-white/10 text-gray-400 hover:text-white">
            <XCircle className="w-6 h-6" />
        </button>
        
        <div className="flex flex-col items-center gap-1">
            <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center text-2xl font-black shadow-2xl backdrop-blur-sm transition-all duration-500 ${timer <= 10 ? 'border-red-500 text-red-500 animate-ping' : 'border-blue-500 text-blue-400'}`}>
                {timer}
            </div>
        </div>

        <button onClick={() => setShowLadderMobile(!showLadderMobile)} className="md:hidden p-2 bg-white/5 rounded-full border border-white/10 text-yellow-500">
            <Layers className="w-6 h-6" />
        </button>
      </div>

      {/* Main Game Container */}
      <div className="flex w-full h-full relative z-10">
          
          {/* Main Content */}
          <div className="flex-1 flex flex-col items-center justify-center p-4 w-full max-w-5xl mx-auto">
             
             {/* Question Info */}
             <div className="mb-6 text-center space-y-2">
                 <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-blue-900/30 border border-blue-500/30 text-blue-200 text-xs font-bold shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                     <BookOpen size={14} />
                     <span>{currentQuestion.subject}</span>
                     <span className="text-blue-500">•</span>
                     <span>{currentQuestion.lesson || 'سؤال عام'}</span>
                 </div>
                 {isAiQuestion && (
                     <div className="flex justify-center">
                        <span className="text-[10px] text-fuchsia-400 flex items-center gap-1 bg-fuchsia-900/20 px-2 py-0.5 rounded border border-fuchsia-500/30"><Sparkles size={10}/> مولد بالذكاء الاصطناعي</span>
                     </div>
                 )}
             </div>

             {/* Lifelines */}
             <div className="flex gap-4 mb-8">
                 <div className="flex flex-col items-center gap-1">
                    <button onClick={useFiftyFifty} disabled={!lifelines.fiftyFifty} className="w-14 h-14 rounded-full bg-gradient-to-b from-blue-900 to-slate-900 border-2 border-blue-400 flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(59,130,246,0.4)] disabled:opacity-40 disabled:grayscale disabled:shadow-none relative group">
                        <span className="text-lg font-black text-blue-200 group-hover:text-white">50:50</span>
                        {!lifelines.fiftyFifty && <XCircle className="absolute inset-0 w-full h-full text-red-500/80 bg-black/50 rounded-full p-2" />}
                    </button>
                 </div>
                 <div className="flex flex-col items-center gap-1">
                    <button onClick={useAskAudience} disabled={!lifelines.askAudience} className="w-14 h-14 rounded-full bg-gradient-to-b from-blue-900 to-slate-900 border-2 border-blue-400 flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(59,130,246,0.4)] disabled:opacity-40 disabled:grayscale disabled:shadow-none relative group">
                        <Users className="w-6 h-6 text-blue-200 group-hover:text-white" />
                        {!lifelines.askAudience && <XCircle className="absolute inset-0 w-full h-full text-red-500/80 bg-black/50 rounded-full p-2" />}
                    </button>
                 </div>
                 <div className="flex flex-col items-center gap-1">
                    <button onClick={useCallFriend} disabled={!lifelines.callFriend} className="w-14 h-14 rounded-full bg-gradient-to-b from-blue-900 to-slate-900 border-2 border-blue-400 flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(59,130,246,0.4)] disabled:opacity-40 disabled:grayscale disabled:shadow-none relative group">
                        <Phone className="w-6 h-6 text-blue-200 group-hover:text-white" />
                        {!lifelines.callFriend && <XCircle className="absolute inset-0 w-full h-full text-red-500/80 bg-black/50 rounded-full p-2" />}
                    </button>
                 </div>
             </div>

             {/* Question Box */}
             <div className="w-full relative mb-8 group">
                 <div className="absolute inset-0 bg-blue-600 blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-500 rounded-full"></div>
                 <div className="relative bg-gradient-to-b from-[#0f172a] to-[#020617] border-y-2 border-blue-500/50 py-8 px-6 md:px-12 rounded-[3rem] text-center shadow-2xl flex items-center justify-center min-h-[120px]">
                     {/* Decorative diamonds */}
                     <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-blue-400 rotate-45 shadow-[0_0_10px_#60a5fa]"></div>
                     <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-blue-400 rotate-45 shadow-[0_0_10px_#60a5fa]"></div>
                     
                     <h2 className="text-lg md:text-2xl font-bold leading-relaxed text-white drop-shadow-md" dir="rtl">
                         {currentQuestion.text}
                     </h2>
                 </div>
             </div>

             {/* Audience Poll Overlay */}
             {audienceData && (
                 <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-black/90 p-4 rounded-xl border border-blue-500/50 z-50 w-64 shadow-2xl animate-fadeIn">
                     <h4 className="text-center text-blue-300 font-bold mb-2 text-sm border-b border-white/10 pb-1">نتائج الجمهور</h4>
                     <div className="flex justify-around items-end h-24 gap-2">
                         {audienceData.map((val, i) => (
                             <div key={i} className="flex flex-col items-center w-full group">
                                 <div className="text-[10px] text-white mb-1 opacity-0 group-hover:opacity-100 transition-opacity">{val}%</div>
                                 <div className="bg-gradient-to-t from-blue-800 to-blue-400 w-full rounded-t-sm relative transition-all duration-1000" style={{height: `${val}%`}}></div>
                                 <div className="text-xs font-bold text-yellow-500 mt-1">{['أ','ب','ج','د'][i]}</div>
                             </div>
                         ))}
                     </div>
                 </div>
             )}

             {/* Answers Grid */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full px-2">
                 {currentQuestion.options.map((option, index) => (
                     <button
                        key={index}
                        onClick={() => handleOptionSelect(index)}
                        disabled={gameState !== 'waiting' || disabledOptions.includes(index)}
                        className={getOptionClasses(index)}
                     >
                         <span className="font-bold text-yellow-500 mr-4 text-xl font-mono">{['أ', 'ب', 'ج', 'د'][index]}:</span>
                         <span className="flex-1 text-right font-bold text-sm md:text-lg">{option}</span>
                         {/* Line decoration */}
                         <div className="absolute left-4 top-1/2 -translate-y-1/2 w-[1px] h-1/2 bg-white/10"></div>
                     </button>
                 ))}
             </div>
          </div>

          {/* Side Ladder (Desktop) */}
          <div className="hidden md:flex w-72 bg-gradient-to-l from-black via-[#0a0a1a] to-transparent border-r border-white/5 flex-col justify-center p-6 relative">
              <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-transparent via-blue-500/50 to-transparent"></div>
              <h3 className="text-center text-blue-300 font-black text-xl mb-6 tracking-widest border-b-2 border-blue-900 pb-2">سلم النقاط</h3>
              <MoneyLadder currentLevel={currentQuestionIndex + 1} ladderData={activeLadder} />
          </div>

          {/* Mobile Ladder (Overlay) */}
          {showLadderMobile && (
              <div className="absolute inset-0 bg-black/90 z-40 flex flex-col items-center justify-center p-8 animate-fadeIn" onClick={() => setShowLadderMobile(false)}>
                  <h3 className="text-2xl font-black text-blue-400 mb-6">المراحل</h3>
                  <MoneyLadder currentLevel={currentQuestionIndex + 1} ladderData={activeLadder} />
                  <p className="text-gray-500 text-sm mt-4">اضغط في أي مكان للإغلاق</p>
              </div>
          )}

      </div>
    </div>
  );
};

export default GameScreen;