import React, { useState, useEffect, useRef } from 'react';
import { 
  onSnapshot, 
  collection, 
  query, 
  where, 
  orderBy,
  limit
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { User, Student, ChatMessage, Friendship } from '../types';
import { 
  sendChatMessage, 
  markMessageAsRead, 
  addFriend, 
  fetchStudents 
} from '../services/api';
import { 
  MessageSquare, 
  UserPlus, 
  Search, 
  X, 
  Send, 
  User as UserIcon,
  Check,
  CheckCheck,
  Clock,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StudentChatProps {
  user: User;
  student?: Student;
}

export const StudentChat: React.FC<StudentChatProps> = ({ user, student }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeChat, setActiveChat] = useState<Friendship | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    // Listen for friendships
    const friendsQuery = query(
      collection(db, 'friendships'),
      where('user_id', '==', user.username),
      orderBy('timestamp', 'desc')
    );

    const unsubFriends = onSnapshot(friendsQuery, (snapshot) => {
      const updatedFriends = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Friendship[];
      setFriends(updatedFriends);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'friendships');
    });

    return () => unsubFriends();
  }, [user.username]);

  useEffect(() => {
    if (!activeChat || !auth.currentUser) return;

    // Listen for messages in both directions
    const messagesQuery = query(
      collection(db, 'chat_messages'),
      where('sender_id', 'in', [user.username, activeChat.friend_id]),
      where('receiver_id', 'in', [user.username, activeChat.friend_id]),
      orderBy('timestamp', 'asc'),
      limit(50)
    );

    const unsubMessages = onSnapshot(messagesQuery, (snapshot) => {
      const updatedMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatMessage[];
      
      // Filter manually because "in" query might include messages between other users if not careful
      // Actually "in" with [user, friend] for both sender and receiver works for 1-on-1 chat
      const filtered = updatedMessages.filter(m => 
        (m.sender_id === user.username && m.receiver_id === activeChat.friend_id) ||
        (m.sender_id === activeChat.friend_id && m.receiver_id === user.username)
      );

      setMessages(filtered);

      // Mark unread messages as read
      filtered.forEach(m => {
        if (m.receiver_id === user.username && !m.read) {
          markMessageAsRead(m.id);
        }
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'chat_messages');
    });

    return () => unsubMessages();
  }, [activeChat, user.username]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const allStudents = await fetchStudents();
      const filtered = allStudents.filter((s: Student) => 
        (s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
         s.student_id.toLowerCase().includes(searchQuery.toLowerCase())) &&
        s.student_id !== user.username &&
        !friends.some(f => f.friend_id === s.student_id)
      );
      setSearchResults(filtered);
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddFriend = async (targetStudent: Student) => {
    try {
      await addFriend(user.username, targetStudent.student_id, targetStudent.name);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error("Failed to add friend", error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    try {
      await sendChatMessage({
        sender_id: user.username,
        sender_name: user.full_name,
        receiver_id: activeChat.friend_id,
        content: newMessage.trim()
      });
      setNewMessage('');
    } catch (error) {
      console.error("Failed to send message", error);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-indigo-600 text-white rounded-[2rem] shadow-2xl flex items-center justify-center hover:scale-110 transition-all z-50 group"
      >
        <MessageSquare className="w-8 h-8 group-hover:rotate-12 transition-transform" />
        {friends.some(f => false) && ( // Placeholder for unread count
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full border-2 border-white" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-28 right-8 w-[400px] h-[600px] bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] z-50 overflow-hidden border border-black/5 flex flex-col"
          >
            {/* Header */}
            <div className="p-6 bg-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black tracking-tight">Student Chat</h3>
                  <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Connect with Classmates</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Sidebar: Friends List */}
              <div className={`w-full flex flex-col ${activeChat ? 'hidden' : 'flex'}`}>
                <div className="p-4 border-b border-black/5">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search classmates..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-black/5 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {searchResults.length > 0 ? (
                    <div className="space-y-2 mb-6">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Search Results</p>
                      {searchResults.map(result => (
                        <div 
                          key={result.student_id}
                          className="flex items-center justify-between p-3 bg-indigo-50 rounded-2xl border border-indigo-100"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-600 font-black">
                              {result.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-900">{result.name}</p>
                              <p className="text-[10px] font-bold text-slate-500 uppercase">{result.class_grade}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleAddFriend(result)}
                            className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                          >
                            <UserPlus className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : searchQuery && !isSearching && (
                    <div className="text-center py-8">
                      <p className="text-sm font-bold text-slate-400">No classmates found</p>
                    </div>
                  )}

                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Your Friends</p>
                  {friends.length > 0 ? friends.map(friend => (
                    <button
                      key={friend.id}
                      onClick={() => setActiveChat(friend)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-2xl transition-colors text-left group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-black group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                        {friend.friend_name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-black text-slate-900">{friend.friend_name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Online</p>
                      </div>
                    </button>
                  )) : !searchQuery && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-4 border border-black/5">
                        <UserPlus className="w-8 h-8 text-slate-200" />
                      </div>
                      <p className="text-sm font-bold text-slate-400">Add friends to start chatting</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Chat Window */}
              {activeChat && (
                <div className="w-full flex flex-col bg-white">
                  <div className="p-4 border-b border-black/5 flex items-center gap-3">
                    <button 
                      onClick={() => setActiveChat(null)}
                      className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xs">
                      {activeChat.friend_name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black text-slate-900 leading-tight">{activeChat.friend_name}</p>
                      <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Active Now</p>
                    </div>
                  </div>

                  <div 
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50"
                  >
                    {messages.map((msg, i) => {
                      const isMe = msg.sender_id === user.username;
                      return (
                        <div 
                          key={msg.id || i}
                          className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[80%] space-y-1`}>
                            <div className={`px-4 py-3 rounded-2xl text-sm font-bold shadow-sm ${
                              isMe 
                                ? 'bg-indigo-600 text-white rounded-tr-none' 
                                : 'bg-white text-slate-900 rounded-tl-none border border-black/5'
                            }`}>
                              {msg.content}
                            </div>
                            <div className={`flex items-center gap-1 text-[8px] font-black uppercase tracking-widest ${isMe ? 'justify-end text-indigo-400' : 'text-slate-400'}`}>
                              {msg.timestamp ? new Date(msg.timestamp?.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                              {isMe && (
                                msg.read ? <CheckCheck className="w-2.5 h-2.5" /> : <Check className="w-2.5 h-2.5" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <form 
                    onSubmit={handleSendMessage}
                    className="p-4 border-t border-black/5 flex gap-2"
                  >
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1 px-4 py-3 bg-slate-50 border border-black/5 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    />
                    <button 
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:hover:bg-indigo-600"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </form>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
