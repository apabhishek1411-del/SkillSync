// 💬 CHAT WINDOW COMPONENT
// Reusable message display + input component used inside ChatPage

import { useState, useEffect, useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { chatAPI } from '../lib/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

export default function ChatWindow({ conversationId, onMessageSent }) {
    const { user } = useAuthStore();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);
    const pollRef = useRef(null);

    // Load messages
    useEffect(() => {
        if (!conversationId) return;
        loadMessages();

        // Poll for new messages every 5 seconds
        pollRef.current = setInterval(() => {
            loadMessages(true);
        }, 5000);

        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [conversationId]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadMessages = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await chatAPI.getMessages(conversationId);
            setMessages(res.data);
            // Mark as read
            await chatAPI.markAsRead(conversationId);
        } catch (err) {
            if (!silent) toast.error('Failed to load messages');
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        setSending(true);
        try {
            const res = await chatAPI.sendMessage(conversationId, { content: newMessage.trim() });
            setMessages(prev => [...prev, res.data]);
            setNewMessage('');
            if (onMessageSent) onMessageSent();
        } catch (err) {
            toast.error('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    if (!conversationId) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-50/50 dark:bg-surface-900/50">
                <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/50 dark:to-primary-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Send size={32} className="text-primary-600 dark:text-primary-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">Select a conversation</h3>
                    <p className="text-gray-500 dark:text-gray-400">Choose someone to chat with from the list</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-50/50 dark:bg-surface-900/50">
                <Loader2 className="animate-spin text-primary-600 dark:text-primary-400" size={32} />
            </div>
        );
    }

    const formatTime = (dateStr) => {
        // Backend sends UTC without 'Z' suffix, so we append it for correct local conversion
        const utcStr = dateStr.endsWith('Z') ? dateStr : dateStr + 'Z';
        const date = new Date(utcStr);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return 'Yesterday ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays < 7) {
            return date.toLocaleDateString([], { weekday: 'short' }) + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-transparent">
            {/* Messages Area */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                        <p className="text-lg font-medium text-slate-600 dark:text-slate-300">No messages yet</p>
                        <p className="text-sm mt-1">Send the first message to start the conversation!</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.sender_id === user.id;
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[70%] group`}>
                                    {/* Sender name for other user */}
                                    {!isMe && (
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 ml-1 font-medium">
                                            {msg.sender?.full_name}
                                        </p>
                                    )}
                                    <div className={`rounded-2xl px-4 py-2.5 ${isMe
                                        ? 'bg-gradient-to-br from-primary-600 to-violet-600 text-white shadow-btn rounded-tr-sm'
                                        : 'bg-white dark:bg-surface-800 text-slate-900 dark:text-slate-100 shadow-sm border border-slate-200/90 dark:border-slate-700 rounded-tl-sm'
                                        }`}>
                                        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                                    </div>
                                    <p className={`text-xs mt-1 ${isMe ? 'text-right text-slate-400 dark:text-slate-500' : 'text-slate-400 dark:text-slate-500 ml-1'}`}>
                                        {formatTime(msg.created_at)}
                                        {isMe && (
                                            <span className={`ml-1.5 ${msg.is_read ? 'text-primary-500 dark:text-primary-400 font-semibold' : 'text-slate-400 dark:text-slate-500'}`}>
                                                {msg.is_read ? '✓✓' : '✓'}
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-slate-50 dark:bg-surface-850 border-t border-slate-200/80 dark:border-slate-800 p-4">
                <form onSubmit={handleSend} className="flex items-center gap-3">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2.5 bg-white dark:bg-surface-900 rounded-full border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-slate-900 dark:text-white transition-all text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm"
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className="w-10 h-10 bg-gradient-to-br from-primary-600 to-violet-600 text-white rounded-full flex items-center justify-center shadow-btn hover:shadow-lg hover:scale-105 transition-all disabled:opacity-40 disabled:hover:scale-100 disabled:hover:shadow-none"
                    >
                        {sending ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <Send size={18} />
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
