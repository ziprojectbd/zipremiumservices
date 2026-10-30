import { useEffect, useState, useRef } from 'react';
import {
  MessageSquare, Search, Send, User, Clock, Package,
  ArrowLeft, X, Lock, MessageCircle
} from 'lucide-react';
import api from '../../lib/axios';

interface Message {
  id: string;
  senderEmail: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

interface Chat {
  _id: string;
  listingId: string;
  buyerEmail: string;
  sellerEmail: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  isBrokerChat: boolean;
  listingTitle?: string;
  buyerName?: string;
}

export default function BrokerChats() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // ChatBox internal state
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messageText, setMessageText] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchChats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/chat', { params: { userEmail: 'admin@juwel.shop', isBrokerChat: 'true' } });
      if (res.data.success) {
        setChats(res.data.chats ?? []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchChats(); }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages]);

  const filteredChats = chats.filter(chat =>
    chat.buyerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.listingId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- ChatBox handlers ---
  const openChat = async (chat: Chat) => {
    setSelectedChat(chat);
    setActiveChat(null);
    setMessageText('');
    setChatError('');
    await loadChat(chat);
  };

  const loadChat = async (selected: Chat) => {
    try {
      setChatLoading(true);
      setChatError('');
      const res = await api.get('/chat', {
        params: { userEmail: 'admin@juwel.shop', listingId: selected.listingId, isBrokerChat: 'true' }
      });
      if (res.data.success && res.data.chats.length > 0) {
        setActiveChat(res.data.chats[0]);
      } else {
        await createChat(selected);
      }
    } catch {
      setChatError('Failed to load chat');
    } finally {
      setChatLoading(false);
    }
  };

  const createChat = async (selected: Chat) => {
    try {
      const res = await api.post('/chat', {
        action: 'create_chat',
        listingId: selected.listingId,
        buyerEmail: selected.buyerEmail,
        sellerEmail: 'admin@juwel.shop',
        isBrokerChat: true
      });
      if (res.data.success) {
        setActiveChat(res.data.chat);
      }
    } catch {
      // ignore
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !activeChat) return;
    try {
      const res = await api.post('/chat', {
        action: 'send_message',
        chatId: activeChat._id,
        buyerEmail: 'admin@juwel.shop',
        message: messageText
      });
      if (res.data.success) {
        setMessageText('');
        if (selectedChat) await loadChat(selectedChat);
      } else {
        setChatError(res.data.error || 'Failed to send message');
      }
    } catch {
      setChatError('Failed to send message');
    }
  };

  const getRemainingTime = (createdAt: string): string => {
    const creationDate = new Date(createdAt);
    const now = new Date();
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    const remainingMs = sevenDaysInMs - (now.getTime() - creationDate.getTime());
    if (remainingMs <= 0) return 'Expired';
    const days = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
    const hours = Math.floor((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
    return `${minutes}m`;
  };

  const closeChat = () => {
    setSelectedChat(null);
    setActiveChat(null);
    setMessageText('');
    setChatError('');
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-3">
              <div className="p-2 bg-purple-600/20 rounded-xl border border-purple-500/20">
                <MessageSquare className="w-6 h-6 text-purple-400" />
              </div>
              Broker Chat Management
            </h1>
            <p className="text-slate-400 text-sm mt-1">Monitor and reply to Buyer-Broker conversations</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by buyer email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-900 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 w-full sm:w-64"
            />
          </div>
        </div>

        {/* Chats Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-white/5 rounded-2xl border border-white/10 animate-pulse" />
            ))}
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/5 border-dashed">
            <MessageSquare className="w-16 h-16 text-slate-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Broker Chats Found</h3>
            <p className="text-slate-500 max-w-xs mx-auto">Active broker conversations will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredChats.map((chat) => (
              <div
                key={chat._id}
                onClick={() => openChat(chat)}
                className="group bg-slate-900/50 hover:bg-slate-800/50 border border-white/5 hover:border-purple-500/30 rounded-2xl p-5 transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-3">
                  <div className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded text-[10px] font-bold text-purple-400 uppercase">
                    Broker Chat
                  </div>
                </div>
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-white font-bold truncate text-sm">{chat.buyerEmail}</h3>
                    <div className="flex items-center gap-1.5 text-slate-500 text-xs mt-0.5">
                      <Package className="w-3.5 h-3.5" />
                      <span className="truncate">Listing ID: {chat.listingId}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {chat.messages.length > 0
                        ? chat.messages[chat.messages.length - 1].message
                        : 'No messages yet'}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <div className="flex items-center gap-1.5 text-slate-500 text-[10px]">
                      <Clock className="w-3 h-3" />
                      {new Date(chat.updatedAt).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1 text-purple-400 text-xs font-bold uppercase group-hover:gap-2 transition-all">
                      Reply Chat <Send className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat Box Modal */}
      {selectedChat && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-2xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col border border-slate-700 shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-sm">
                  {selectedChat.buyerName
                    ? selectedChat.buyerName.charAt(0).toUpperCase()
                    : selectedChat.buyerEmail.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-white">{selectedChat.buyerName || 'Buyer'}</h3>
                  <p className="text-xs text-slate-400 truncate max-w-[200px]">
                    Chat with {selectedChat.buyerEmail}
                  </p>
                </div>
              </div>
              <button onClick={closeChat} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Expiration Info */}
            {activeChat && (
              <div className="p-3 bg-purple-500/10 border-b border-purple-500/20">
                <div className="flex items-center gap-2 text-xs">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <span className="text-purple-300">
                    Chat expires in: <span className="font-semibold">{getRemainingTime(activeChat.createdAt)}</span>
                  </span>
                  <Lock className="w-4 h-4 text-purple-400 ml-auto" />
                  <span className="text-purple-300">End-to-end encrypted</span>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px]">
              {chatLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-slate-400">Loading chat...</div>
                </div>
              ) : chatError ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-red-400">{chatError}</div>
                </div>
              ) : activeChat && activeChat.messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageCircle className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-400">No messages yet. Start the conversation!</p>
                  </div>
                </div>
              ) : activeChat ? (
                activeChat.messages.map((msg) => {
                  const isOwnMessage = msg.senderEmail === 'admin@juwel.shop';
                  return (
                    <div key={msg.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        isOwnMessage ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-200'
                      }`}>
                        <p className="text-sm break-words">{msg.message}</p>
                        <p className="text-[10px] opacity-70 mt-1">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : null}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-slate-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  disabled={!activeChat || chatLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={!messageText.trim() || !activeChat || chatLoading}
                  className="px-4 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
