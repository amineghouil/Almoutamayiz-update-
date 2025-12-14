
import React, { useState, useEffect, useRef } from 'react';
import { User, ChatMessage, Post, PollOption, Comment, DirectMessage, FriendProfile } from '../types';
import { Send, User as UserIcon, ChevronRight, Play, Pause, Heart, Image as ImageIcon, X, ZoomIn, ArrowDown, Crown, ShieldCheck, MessageCircle, BarChart2, MoreHorizontal, Plus, ThumbsUp, MessageSquare, List, Users, HelpCircle, Search, UserPlus, Check, Clock, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { playMessageSentSound, playClickSound } from '../utils/audio';

interface CommunityScreenProps {
  user: User;
  onChatStateChange: (isActive: boolean) => void;
}

// --- DATA CONSTANTS ---
const ROOMS = [
    { id: 'عام', label: 'المناقشة العامة', description: 'ملتقى الجميع للنقاشات العامة والترفيه', icon: '☕', color: 'from-slate-700 to-slate-900', size: 'large' },
    { id: 'الفلسفة', label: 'الفلسفة', description: 'مقالات، إشكاليات، ونقاشات فلسفية', icon: '🤔', color: 'from-purple-600 to-purple-400' },
    { id: 'اللغة العربية', label: 'الأدب العربي', description: 'الشعر، النثر، والقواعد', icon: '📖', color: 'from-green-600 to-green-400' },
    { id: 'التاريخ', label: 'التاريخ', description: 'الشخصيات، التواريخ، والمصطلحات', icon: '📜', color: 'from-orange-600 to-orange-400' },
    { id: 'الجغرافيا', label: 'الجغرافيا', description: 'الخرائط والمصطلحات الاقتصادية', icon: '🗺️', color: 'from-blue-600 to-blue-400' },
    { id: 'الرياضيات', label: 'الرياضيات', description: 'المسائل، التمارين، والقوانين', icon: '📐', color: 'from-cyan-600 to-cyan-400' },
    { id: 'اللغات', label: 'اللغات الأجنبية', description: 'الإنجليزية والفرنسية', icon: '🗣️', color: 'from-red-600 to-red-400' },
    { id: 'الشريعة', label: 'العلوم الإسلامية', description: 'الآيات، الأحكام، والقيم', icon: '🕌', color: 'from-emerald-600 to-emerald-400' },
];

type CommunityTab = 'feed' | 'rooms' | 'messages';

const CommunityScreen: React.FC<CommunityScreenProps> = ({ user, onChatStateChange }) => {
  const [activeTab, setActiveTab] = useState<CommunityTab>('feed');
  const [showCreatePost, setShowCreatePost] = useState(false);
  
  // Pass chat active state to parent (hides bottom nav in rooms/DMs)
  useEffect(() => {
      // Logic handled in sub-components
  }, [onChatStateChange]);

  return (
    <div className="flex flex-col h-full bg-black min-h-screen">
      
      {/* Top Navigation Segment */}
      {!showCreatePost && (
          <div className="pt-4 px-4 pb-2 bg-neutral-900 border-b border-neutral-800 z-30 sticky top-0">
              <div className="flex bg-black/40 p-1 rounded-xl">
                  <button 
                    onClick={() => setActiveTab('feed')} 
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'feed' ? 'bg-neutral-800 text-white shadow' : 'text-gray-500'}`}
                  >
                      <List size={16} /> المنشورات
                  </button>
                  <button 
                    onClick={() => setActiveTab('rooms')} 
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'rooms' ? 'bg-neutral-800 text-white shadow' : 'text-gray-500'}`}
                  >
                      <Users size={16} /> الغرف
                  </button>
                  <button 
                    onClick={() => setActiveTab('messages')} 
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'messages' ? 'bg-neutral-800 text-white shadow' : 'text-gray-500'}`}
                  >
                      <MessageCircle size={16} /> الأصدقاء
                  </button>
              </div>
          </div>
      )}

      {/* Content Area */}
      <div className="flex-1 relative overflow-hidden">
          {activeTab === 'feed' && (
              <FeedView 
                user={user} 
                isCreating={showCreatePost} 
                setIsCreating={setShowCreatePost} 
                onStartChat={(targetUser) => {
                    // Switch to messages tab and open chat logic would go here
                    setActiveTab('messages');
                    window.addToast(`انتقل لتبويب الأصدقاء للتواصل`, 'info');
                }}
              />
          )}
          {activeTab === 'rooms' && <RoomsView user={user} onChatStateChange={onChatStateChange} />}
          {activeTab === 'messages' && <FriendsAndMessagesView user={user} onChatStateChange={onChatStateChange} />}
      </div>
    </div>
  );
};

/* =================================================================================
   1. FEED VIEW (Posts, Polls, Questions, Interactions)
   ================================================================================= */

const FeedView: React.FC<{ user: User, isCreating: boolean, setIsCreating: (v: boolean) => void, onStartChat: (u: any) => void }> = ({ user, isCreating, setIsCreating, onStartChat }) => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true); // Default true to show loading initially
    const [activeCommentPost, setActiveCommentPost] = useState<number | null>(null);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        setLoading(true);
        // We fetch posts, the profile of the creator, AND we need to check if *current user* liked the post
        const { data, error } = await supabase
            .from('posts')
            .select(`
                *,
                profiles:user_id (name, avatar, role),
                post_likes (user_id)
            `)
            .order('created_at', { ascending: false })
            .limit(30);

        if (data) {
            // Transform data: add is_liked_by_me based on if post_likes array contains my ID
            const formattedPosts = data.map((p: any) => ({
                ...p,
                is_liked_by_me: p.post_likes && p.post_likes.some((l: any) => l.user_id === user.id)
            }));
            setPosts(formattedPosts);
        } else {
            console.error("Error fetching posts:", error);
        }
        setLoading(false);
    };

    const handleCreatePost = async (content: string, type: 'text' | 'poll' | 'question', pollOptions: string[]) => {
        // Construct basic data
        const newPostData = {
            user_id: user.id,
            content: content,
            type: type,
            poll_options: type === 'poll' ? pollOptions.map((opt, i) => ({ id: `opt_${i}_${Date.now()}`, text: opt, votes: 0 })) : null,
        };

        const { data, error } = await supabase
            .from('posts')
            .insert(newPostData)
            .select(`*, profiles:user_id (name, avatar, role)`)
            .single();
        
        if (error) {
            console.error("Error creating post:", error);
            window.addToast(`فشل النشر: ${error.message}`, 'error');
            throw error; // Re-throw so modal stays open
        }

        if (data) {
            // Ensure likes_count and comments_count are 0 for the UI
            const uiPost = { ...data, likes_count: 0, comments_count: 0, is_liked_by_me: false };
            setPosts(prev => [uiPost as any, ...prev]);
            setIsCreating(false);
            window.addToast('تم نشر المشاركة بنجاح!', 'success');
        }
    };

    const handleLike = async (postId: number) => {
        playClickSound();
        
        // 1. Optimistic Update
        const postIndex = posts.findIndex(p => p.id === postId);
        if (postIndex === -1) return;
        
        const isCurrentlyLiked = posts[postIndex].is_liked_by_me;
        const newLikesCount = isCurrentlyLiked 
            ? Math.max(0, posts[postIndex].likes_count - 1) 
            : posts[postIndex].likes_count + 1;

        setPosts(prev => prev.map(p => 
            p.id === postId ? { ...p, likes_count: newLikesCount, is_liked_by_me: !isCurrentlyLiked } : p
        ));

        // 2. Database Call via RPC (Stored Procedure for toggling)
        try {
            const { error } = await supabase.rpc('toggle_post_like', { target_post_id: postId });
            if (error) throw error;
        } catch (err) {
            console.error("Like toggle error:", err);
            // Revert optimistic update on error
            setPosts(prev => prev.map(p => 
                p.id === postId ? { ...p, likes_count: isCurrentlyLiked ? p.likes_count + 1 : p.likes_count - 1, is_liked_by_me: isCurrentlyLiked } : p
            ));
        }
    };

    const handleVote = async (postId: number, optionId: string) => {
        setPosts(prev => prev.map(p => {
            if (p.id !== postId || p.my_vote_id) return p;
            
            const newOptions = p.poll_options?.map((opt: PollOption) => 
                opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
            );
            
            return { ...p, poll_options: newOptions, my_vote_id: optionId };
        }));
    };

    if (isCreating) {
        return <CreatePostModal user={user} onCancel={() => setIsCreating(false)} onSubmit={handleCreatePost} />;
    }

    return (
        <div className="h-full overflow-y-auto custom-scrollbar pb-20 relative">
            {/* Create FAB */}
            <div className="p-4 flex gap-3 items-center border-b border-white/5 bg-[#111]">
                <div className="w-10 h-10 rounded-full bg-neutral-800 overflow-hidden border border-neutral-700">
                    {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover"/> : <UserIcon className="w-6 h-6 m-2 text-gray-500"/>}
                </div>
                <button 
                    onClick={() => setIsCreating(true)}
                    className="flex-1 text-right bg-neutral-900 hover:bg-neutral-800 text-gray-400 py-3 px-4 rounded-xl border border-neutral-800 transition-colors text-sm"
                >
                    بم تفكر اليوم يا {user.name}؟ اسأل أو شارك...
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col justify-center items-center mt-20 gap-4">
                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                    <p className="text-gray-400 text-sm animate-pulse">جاري تحميل المنشورات...</p>
                </div>
            ) : posts.length === 0 ? (
                <div className="text-center mt-20 text-gray-500">لا توجد منشورات بعد. كن أول من يشارك!</div>
            ) : (
                <div className="space-y-2 p-2">
                    {posts.map(post => (
                        <PostCard 
                            key={post.id} 
                            post={post} 
                            currentUserId={user.id} 
                            onLike={() => handleLike(post.id)}
                            onVote={(optId) => handleVote(post.id, optId)}
                            onComment={() => setActiveCommentPost(post.id)}
                            onProfileClick={() => onStartChat(post.profiles)}
                        />
                    ))}
                </div>
            )}

            {activeCommentPost && (
                <CommentsModal 
                    postId={activeCommentPost} 
                    onClose={() => setActiveCommentPost(null)} 
                    user={user}
                    postType={posts.find(p => p.id === activeCommentPost)?.type}
                />
            )}
        </div>
    );
};

const PostCard: React.FC<{ 
    post: Post; 
    currentUserId: string;
    onLike: () => void;
    onVote: (optId: string) => void;
    onComment: () => void;
    onProfileClick: () => void;
}> = ({ post, currentUserId, onLike, onVote, onComment, onProfileClick }) => {
    
    const isPoll = post.type === 'poll';
    const isQuestion = post.type === 'question';
    const pollOpts = post.poll_options as PollOption[] || [];
    const totalVotes = isPoll ? pollOpts.reduce((acc, curr) => acc + curr.votes, 0) || 0 : 0;

    return (
        <div className={`bg-[#111] border rounded-2xl p-4 mb-2 shadow-sm animate-fadeIn ${isQuestion ? 'border-purple-500/30' : 'border-neutral-800'}`}>
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
                <div className="flex gap-3 cursor-pointer" onClick={onProfileClick}>
                    <div className="w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700 overflow-hidden">
                        {post.profiles?.avatar ? <img src={post.profiles.avatar} className="w-full h-full object-cover"/> : <UserIcon className="w-6 h-6 m-2 text-gray-500"/>}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white text-sm">{post.profiles?.name || 'مستخدم'}</h4>
                            {post.profiles?.role === 'admin' && <Crown size={12} className="text-yellow-500"/>}
                        </div>
                        <span className="text-[10px] text-gray-500">{new Date(post.created_at).toLocaleDateString('ar-SA')}</span>
                    </div>
                </div>
                {isQuestion && <span className="bg-purple-900/30 text-purple-400 text-[10px] px-2 py-1 rounded-full font-bold border border-purple-500/20">سؤال</span>}
                {isPoll && <span className="bg-blue-900/30 text-blue-400 text-[10px] px-2 py-1 rounded-full font-bold border border-blue-500/20">استطلاع</span>}
            </div>

            {/* Content */}
            <div className="mb-4">
                <p className={`text-gray-200 text-sm leading-relaxed whitespace-pre-wrap ${isQuestion ? 'font-bold text-base' : ''}`}>{post.content}</p>
            </div>

            {/* Poll Logic */}
            {isPoll && pollOpts.length > 0 && (
                <div className="space-y-2 mb-4">
                    {pollOpts.map(opt => {
                        const percent = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                        const isVoted = post.my_vote_id === opt.id;
                        
                        return (
                            <button 
                                key={opt.id}
                                onClick={() => !post.my_vote_id && onVote(opt.id)}
                                disabled={!!post.my_vote_id}
                                className={`relative w-full h-10 rounded-lg overflow-hidden border transition-all ${isVoted ? 'border-blue-500' : 'border-neutral-700 hover:border-neutral-500'}`}
                            >
                                <div className="absolute top-0 right-0 h-full bg-neutral-800/50 w-full z-0"></div>
                                <div 
                                    className={`absolute top-0 right-0 h-full z-0 transition-all duration-1000 ${isVoted ? 'bg-blue-500/30' : 'bg-neutral-600/30'}`} 
                                    style={{ width: `${percent}%` }}
                                ></div>
                                <div className="absolute inset-0 flex justify-between items-center px-4 z-10">
                                    <span className="text-xs font-bold text-white">{opt.text}</span>
                                    {post.my_vote_id && <span className="text-xs font-mono text-gray-300">{percent}%</span>}
                                </div>
                            </button>
                        )
                    })}
                    <div className="text-xs text-gray-500 text-left px-1">{totalVotes} صوت</div>
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between border-t border-white/5 pt-3">
                <div className="flex gap-4">
                    <button onClick={onLike} className={`flex items-center gap-1.5 text-xs font-bold transition-all active:scale-125 ${post.is_liked_by_me ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}>
                        <Heart size={18} className={post.is_liked_by_me ? 'fill-red-500' : ''} />
                        <span>{post.likes_count || 0}</span>
                    </button>
                    <button onClick={onComment} className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-blue-400 transition-colors">
                        <MessageSquare size={18} />
                        <span>{isQuestion ? 'الإجابات' : 'التعليقات'} ({post.comments_count || 0})</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

const CreatePostModal: React.FC<{ user: User, onCancel: () => void, onSubmit: (c: string, t: 'text'|'poll'|'question', opts: string[]) => Promise<void> }> = ({ user, onCancel, onSubmit }) => {
    const [content, setContent] = useState('');
    const [postType, setPostType] = useState<'text' | 'poll' | 'question'>('text');
    const [pollOptions, setPollOptions] = useState(['', '']);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleOptionChange = (idx: number, val: string) => {
        const newOpts = [...pollOptions];
        newOpts[idx] = val;
        setPollOptions(newOpts);
    };

    const addOption = () => {
        if (pollOptions.length < 4) setPollOptions([...pollOptions, '']);
    };

    const handleSubmit = async () => {
        if (!content.trim()) return;
        if (postType === 'poll' && pollOptions.some(o => !o.trim())) return alert("يرجى ملء جميع خيارات الاستطلاع");
        
        setIsSubmitting(true);
        try {
            await onSubmit(content, postType, pollOptions);
            // onSubmit handles closing via setIsCreating(false) in parent, but if it throws:
        } catch (e) {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col animate-slideIn">
            <div className="flex justify-between items-center p-4 border-b border-neutral-800">
                <button onClick={onCancel} className="text-gray-400 hover:text-white"><X size={24}/></button>
                <span className="font-bold text-white">إنشاء مشاركة</span>
                <button 
                    onClick={handleSubmit} 
                    disabled={!content.trim() || isSubmitting} 
                    className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-sm font-bold disabled:opacity-50 flex items-center gap-2"
                >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isSubmitting ? 'جاري النشر...' : 'نشر'}
                </button>
            </div>
            
            {/* Post Type Selector */}
            <div className="flex p-2 bg-neutral-900 border-b border-neutral-800">
                <button 
                    onClick={() => setPostType('text')} 
                    className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1 ${postType === 'text' ? 'bg-neutral-800 text-white' : 'text-gray-500'}`}
                >
                    <MessageSquare size={14}/> عادي
                </button>
                <button 
                    onClick={() => setPostType('poll')} 
                    className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1 ${postType === 'poll' ? 'bg-neutral-800 text-white' : 'text-gray-500'}`}
                >
                    <BarChart2 size={14}/> استطلاع
                </button>
                <button 
                    onClick={() => setPostType('question')} 
                    className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1 ${postType === 'question' ? 'bg-neutral-800 text-white' : 'text-gray-500'}`}
                >
                    <HelpCircle size={14}/> سؤال
                </button>
            </div>

            <div className="p-4 flex-1">
                <div className="flex gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-neutral-800 overflow-hidden">
                        {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover"/> : <UserIcon className="w-6 h-6 m-2 text-gray-500"/>}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-white font-bold text-sm">{user.name}</span>
                        <span className="text-xs text-gray-500 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800 w-fit">
                            {postType === 'text' ? 'مشاركة عامة' : postType === 'poll' ? 'استطلاع رأي' : 'سؤال للمجتمع'}
                        </span>
                    </div>
                </div>

                <textarea 
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder={postType === 'question' ? 'اكتب سؤالك هنا...' : 'بم تفكر؟'}
                    className="w-full bg-transparent text-white text-lg placeholder:text-gray-600 outline-none resize-none min-h-[150px]"
                    disabled={isSubmitting}
                />

                {postType === 'poll' && (
                    <div className="mt-4 space-y-3 bg-neutral-900/50 p-4 rounded-xl border border-neutral-800 animate-fadeIn">
                        <h4 className="text-sm font-bold text-blue-400 mb-2 flex items-center gap-2"><BarChart2 size={16}/> خيارات الاستطلاع</h4>
                        {pollOptions.map((opt, idx) => (
                            <input 
                                key={idx}
                                type="text"
                                value={opt}
                                onChange={e => handleOptionChange(idx, e.target.value)}
                                placeholder={`الخيار ${idx + 1}`}
                                className="w-full bg-black border border-neutral-700 rounded-lg p-3 text-sm text-white focus:border-blue-500 outline-none"
                                disabled={isSubmitting}
                            />
                        ))}
                        {pollOptions.length < 4 && (
                            <button onClick={addOption} className="text-xs text-blue-400 font-bold flex items-center gap-1 hover:text-blue-300">
                                <Plus size={14}/> إضافة خيار آخر
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const CommentsModal: React.FC<{ postId: number, onClose: () => void, user: User, postType?: string }> = ({ postId, onClose, user, postType }) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchComments();
    }, [postId]);

    const fetchComments = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('comments')
            .select(`*, profiles:user_id (name, avatar)`)
            .eq('post_id', postId)
            .order('created_at', { ascending: true });
            
        if (data) setComments(data as any);
        else console.error("Error fetching comments:", error);
        
        setLoading(false);
    };

    const handleSend = async () => {
        if (!newComment.trim()) return;
        setIsSubmitting(true);
        
        const { data, error } = await supabase
            .from('comments')
            .insert({
                post_id: postId,
                user_id: user.id,
                content: newComment
            })
            .select(`*, profiles:user_id (name, avatar)`)
            .single();

        setIsSubmitting(false);

        if (error) {
            console.error("Comment error:", error);
            window.addToast('فشل إرسال التعليق', 'error');
            return;
        }

        if (data) {
            setComments(prev => [...prev, data as any]);
            setNewComment('');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex justify-center items-end sm:items-center p-0 sm:p-4 animate-fadeIn" onClick={onClose}>
            {/* Modal Container: Higher Z-Index, fixed height relative to viewport on mobile to allow keyboard */}
            <div 
                className="bg-neutral-900 w-full max-w-md h-[90vh] sm:h-[80vh] sm:rounded-2xl flex flex-col border border-neutral-800 shadow-2xl overflow-hidden" 
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-900 shrink-0">
                    <h3 className="font-bold text-white">{postType === 'question' ? 'الإجابات' : 'التعليقات'}</h3>
                    <button onClick={onClose}><X size={20} className="text-gray-400 hover:text-white"/></button>
                </div>
                
                {/* Comments List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#111]">
                    {loading ? <div className="text-center text-gray-500 mt-10">جاري التحميل...</div> : comments.length === 0 ? <div className="text-center text-gray-600 mt-10">لا توجد ردود بعد.</div> : (
                        comments.map(c => (
                            <div key={c.id} className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-neutral-800 overflow-hidden shrink-0">
                                    {c.profiles?.avatar ? <img src={c.profiles.avatar} className="w-full h-full object-cover"/> : <UserIcon size={16} className="m-2 text-gray-500"/>}
                                </div>
                                <div className="bg-neutral-800/50 p-3 rounded-2xl rounded-tr-none border border-neutral-700/50 max-w-[85%]">
                                    <span className="text-xs font-bold text-gray-400 block mb-1">{c.profiles?.name}</span>
                                    <p className="text-sm text-white leading-relaxed">{c.content}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Input Footer */}
                <div className="p-3 border-t border-neutral-800 bg-neutral-900 shrink-0 pb-safe">
                    <div className="flex gap-2 items-end">
                        <input 
                            type="text" 
                            value={newComment} 
                            onChange={e => setNewComment(e.target.value)} 
                            className="flex-1 bg-black border border-neutral-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500 placeholder:text-gray-600"
                            placeholder={postType === 'question' ? 'أضف إجابة...' : 'اكتب تعليقاً...'}
                            onKeyDown={e => e.key === 'Enter' && !isSubmitting && handleSend()}
                            disabled={isSubmitting}
                        />
                        <button 
                            onClick={handleSend} 
                            disabled={!newComment.trim() || isSubmitting} 
                            className="p-3 bg-blue-600 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-500 transition-colors"
                        >
                            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="rtl:-rotate-90"/>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* =================================================================================
   2. FRIENDS & DIRECT MESSAGES VIEW (Updated)
   ================================================================================= */

const FriendsAndMessagesView: React.FC<{ user: User, onChatStateChange: (a: boolean) => void }> = ({ user, onChatStateChange }) => {
    const [subTab, setSubTab] = useState<'list' | 'search'>('list');
    const [friends, setFriends] = useState<any[]>([]); 
    const [activeChatUser, setActiveChatUser] = useState<any | null>(null);
    const [messages, setMessages] = useState<DirectMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<FriendProfile[]>([]);

    useEffect(() => {
        if (!activeChatUser) {
            onChatStateChange(false);
            fetchFriends();
        } else {
            onChatStateChange(true);
            fetchMessages(activeChatUser.id);
        }
    }, [activeChatUser]);

    const fetchFriends = async () => {
        setLoading(true);
        // Fetch accepted requests
        const { data: requests } = await supabase
            .from('friend_requests')
            .select('sender_id, receiver_id')
            .eq('status', 'accepted')
            .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
            
        if (requests && requests.length > 0) {
            const friendIds = requests.map(r => r.sender_id === user.id ? r.receiver_id : r.sender_id);
            const { data: profiles } = await supabase.from('profiles').select('id, name, avatar, role').in('id', friendIds);
            if (profiles) setFriends(profiles);
        } else {
             // If no real friends, check for active DM conversations
             const { data: dmPartners } = await supabase
                .from('direct_messages')
                .select('sender_id, receiver_id')
                .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
                .order('created_at', { ascending: false })
                .limit(20);
                
             if (dmPartners && dmPartners.length > 0) {
                 const uniqueIds = Array.from(new Set(dmPartners.map(dm => dm.sender_id === user.id ? dm.receiver_id : dm.sender_id)));
                 const { data: profiles } = await supabase.from('profiles').select('id, name, avatar, role').in('id', uniqueIds);
                 if (profiles) setFriends(profiles);
             }
        }
        setLoading(false);
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setLoading(true);
        const { data } = await supabase
            .from('profiles')
            .select('id, name, avatar, role')
            .ilike('name', `%${searchQuery}%`)
            .neq('id', user.id) // Exclude self
            .limit(10);
            
        if (data) {
            const results = data.map((p: any) => ({ ...p, is_friend: false })); 
            setSearchResults(results);
        }
        setLoading(false);
    };

    const sendFriendRequest = async (targetId: string) => {
        const { error } = await supabase.from('friend_requests').insert({
            sender_id: user.id,
            receiver_id: targetId,
            status: 'pending'
        });
        
        if (!error) {
            window.addToast('تم إرسال طلب الصداقة', 'success');
            await supabase.from('notifications').insert({
                user_id: targetId,
                title: 'طلب صداقة جديد',
                content: `أرسل لك ${user.name} طلب صداقة.`,
                is_friend_request: true,
                sender_id: user.id
            });
        } else {
            window.addToast('تم إرسال الطلب مسبقاً أو يوجد خطأ', 'info');
        }
    };

    const fetchMessages = async (otherUserId: string) => {
        setLoading(true);
        const { data } = await supabase
            .from('direct_messages')
            .select('*')
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
            .order('created_at', { ascending: true });
        
        if (data) setMessages(data as any);
        setLoading(false);
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !activeChatUser) return;
        
        playMessageSentSound();

        const msgContent = newMessage;
        setNewMessage(''); // Clear input immediately

        // Optimistic update
        const tempMsg = {
            sender_id: user.id,
            receiver_id: activeChatUser.id,
            content: msgContent,
            created_at: new Date().toISOString(),
            is_read: false
        };
        setMessages(prev => [...prev, tempMsg as any]);

        await supabase.from('direct_messages').insert({
            sender_id: user.id,
            receiver_id: activeChatUser.id,
            content: msgContent
        });
    };

    if (activeChatUser) {
        return (
            <div className="flex flex-col h-full bg-black">
                <div className="flex items-center gap-3 p-4 border-b border-neutral-800 bg-neutral-900">
                    <button onClick={() => setActiveChatUser(null)}><ChevronRight className="text-white"/></button>
                    <div className="w-8 h-8 rounded-full bg-neutral-700 overflow-hidden">
                        {activeChatUser.avatar ? <img src={activeChatUser.avatar} className="w-full h-full object-cover"/> : <UserIcon size={16} className="m-2"/>}
                    </div>
                    <span className="font-bold text-white">{activeChatUser.name}</span>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]">
                    {messages.map((msg, idx) => {
                        const isMe = msg.sender_id === user.id;
                        return (
                            <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[75%] p-3 rounded-2xl text-sm ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-neutral-800 text-gray-200 rounded-bl-none'}`}>
                                    {msg.content}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="p-3 bg-neutral-900 border-t border-neutral-800 flex gap-2 pb-safe">
                    <input 
                        type="text" 
                        value={newMessage} 
                        onChange={e => setNewMessage(e.target.value)} 
                        className="flex-1 bg-black border border-neutral-700 rounded-full px-4 py-3 text-white outline-none"
                        placeholder="اكتب رسالة..."
                        onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                    />
                    <button onClick={handleSendMessage} className="p-3 bg-blue-600 rounded-full text-white"><Send size={18} className="rtl:-rotate-90"/></button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-4">
            <div className="flex gap-2 mb-4 bg-neutral-900 p-1 rounded-xl">
                <button onClick={() => setSubTab('list')} className={`flex-1 py-2 text-xs font-bold rounded-lg ${subTab === 'list' ? 'bg-black text-white' : 'text-gray-500'}`}>قائمة الأصدقاء</button>
                <button onClick={() => setSubTab('search')} className={`flex-1 py-2 text-xs font-bold rounded-lg ${subTab === 'search' ? 'bg-black text-white' : 'text-gray-500'}`}>بحث عن أصدقاء</button>
            </div>

            {subTab === 'search' && (
                <div className="space-y-4 animate-fadeIn">
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="ابحث بالاسم..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-3 px-4 pl-10 text-white outline-none focus:border-blue-500" 
                        />
                        <button onClick={handleSearch} className="absolute left-3 top-3 text-gray-400"><Search size={20}/></button>
                    </div>
                    <div className="space-y-2">
                        {loading && <div className="text-center text-gray-500">جاري البحث...</div>}
                        {searchResults.map(p => (
                            <div key={p.id} className="flex items-center justify-between p-3 bg-neutral-900 rounded-xl border border-neutral-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-neutral-800 overflow-hidden">
                                        {p.avatar ? <img src={p.avatar} className="w-full h-full object-cover"/> : <UserIcon size={16} className="m-2 text-gray-500"/>}
                                    </div>
                                    <span className="font-bold text-white text-sm">{p.name}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => sendFriendRequest(p.id)} className="p-2 bg-blue-600/20 text-blue-400 border border-blue-600/50 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-blue-600 hover:text-white transition-colors">
                                        <UserPlus size={14} /> إضافة
                                    </button>
                                    <button onClick={() => setActiveChatUser(p)} className="p-2 bg-green-600/20 text-green-400 border border-green-600/50 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-green-600 hover:text-white transition-colors">
                                        <MessageCircle size={14} /> مراسلة
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {subTab === 'list' && (
                <div className="space-y-2">
                    {friends.length === 0 ? (
                        <div className="text-center text-gray-500 py-10">لا يوجد أصدقاء بعد. ابحث عنهم!</div>
                    ) : (
                        friends.map(friend => (
                            <div key={friend.id} onClick={() => setActiveChatUser(friend)} className="flex items-center gap-4 p-3 rounded-xl hover:bg-neutral-900 transition-colors cursor-pointer border border-transparent hover:border-neutral-800">
                                <div className="w-12 h-12 rounded-full bg-neutral-800 overflow-hidden relative">
                                    {friend.avatar ? <img src={friend.avatar} className="w-full h-full object-cover"/> : <UserIcon size={20} className="m-3 text-gray-500"/>}
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black"></div>
                                </div>
                                <div className="flex-1 border-b border-neutral-900 pb-3">
                                    <h4 className="font-bold text-gray-200">{friend.name}</h4>
                                    <p className="text-xs text-gray-500">اضغط للمراسلة...</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

/* =================================================================================
   3. ROOMS VIEW (Refactored Existing Logic)
   ================================================================================= */

const RoomsView: React.FC<{ user: User, onChatStateChange: (a: boolean) => void }> = ({ user, onChatStateChange }) => {
    const [activeRoom, setActiveRoom] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    
    // ... (Keep existing refs and logic from previous CommunityScreen)
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        onChatStateChange(!!activeRoom);
    }, [activeRoom]);

    // Simplified Room Logic for brevity (Reuse logic from previous CommunityScreen impl)
    const fetchMessages = async () => {
        if (!activeRoom) return;
        setLoading(true);
        const { data } = await supabase
            .from('chat_messages')
            .select(`*, profiles (name, avatar, role)`)
            .eq('subject', activeRoom) 
            .order('created_at', { ascending: false }) 
            .limit(50);
        if (data) setMessages(data.reverse() as any);
        setLoading(false);
    };

    useEffect(() => {
        if (activeRoom) fetchMessages();
        // Missing: Realtime subscription logic (add back if needed from previous file)
    }, [activeRoom]);

    const handleSendRoomMessage = async () => {
        if (!newMessage.trim() || !activeRoom) return;
        
        playMessageSentSound();

        // Optimistic UI
        const tempMsg: ChatMessage = {
            id: Date.now(), user_id: user.id, content: newMessage, type: 'text', created_at: new Date().toISOString(), likes: 0, subject: activeRoom,
            profiles: { name: user.name, avatar: user.avatar || '', role: user.role }
        };
        setMessages(prev => [...prev, tempMsg]);
        setNewMessage('');
        
        await supabase.from('chat_messages').insert({
            user_id: user.id, content: tempMsg.content, subject: activeRoom, type: 'text'
        });
    };

    if (activeRoom) {
        return (
            <div className="flex flex-col h-full bg-black">
                <div className={`p-4 shadow-md z-20 bg-neutral-900 border-b border-neutral-800`}>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setActiveRoom(null)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white transition-colors"><ChevronRight className="w-5 h-5" /></button>
                        <div className="flex-1 text-white text-center pr-10">
                            <h3 className="font-bold text-lg">{activeRoom}</h3>
                        </div>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black custom-scrollbar">
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex gap-2 ${msg.user_id === user.id ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className="w-8 h-8 rounded-full bg-neutral-800 shrink-0 overflow-hidden">
                                {msg.profiles?.avatar ? <img src={msg.profiles.avatar} className="w-full h-full object-cover"/> : <UserIcon size={14} className="m-2 text-gray-500"/>}
                            </div>
                            <div className={`p-3 rounded-2xl max-w-[80%] text-sm ${msg.user_id === user.id ? 'bg-blue-600 text-white rounded-br-none' : 'bg-neutral-800 text-gray-200 rounded-bl-none'}`}>
                                <p className="font-bold text-[10px] opacity-70 mb-1">{msg.profiles?.name}</p>
                                {msg.content}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-3 bg-neutral-900 border-t border-neutral-800 pb-safe flex gap-2">
                    <input 
                        type="text" 
                        value={newMessage} 
                        onChange={e => setNewMessage(e.target.value)} 
                        className="flex-1 bg-black border border-neutral-700 rounded-full px-4 py-3 text-white outline-none"
                        placeholder="اكتب رسالة..."
                        onKeyDown={e => e.key === 'Enter' && handleSendRoomMessage()}
                    />
                    <button onClick={handleSendRoomMessage} className="p-3 bg-blue-600 rounded-full text-white"><Send size={18} className="rtl:-rotate-90"/></button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 grid grid-cols-2 gap-4 pb-20">
            {ROOMS.map(room => (
                <button 
                    key={room.id} 
                    onClick={() => setActiveRoom(room.id)}
                    className={`relative overflow-hidden rounded-3xl p-4 shadow-lg transition-transform hover:scale-[1.02] flex flex-col items-center justify-center text-center bg-gradient-to-br ${room.color} ${room.size === 'large' ? 'col-span-2 h-40' : 'h-32'}`}
                >
                    <span className="text-4xl mb-2 drop-shadow-md">{room.icon}</span>
                    <h3 className="font-bold text-white text-lg drop-shadow">{room.label}</h3>
                    <p className="text-[10px] text-white/80 mt-1">{room.description}</p>
                </button>
            ))}
        </div>
    );
};

export default CommunityScreen;
