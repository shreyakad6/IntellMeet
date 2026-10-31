import React, { useState, useEffect, useRef } from 'react';
import { Send, X, MessageSquare, Check, ArrowDown, User as UserIcon } from 'lucide-react';
import { Socket } from 'socket.io-client';
import { useAuthStore } from '../../store/authStore.js';
import { useMeetingStore } from '../../store/meetingStore.js';
import { api } from '../../services/api.js';
import { cn } from '../../lib/utils.js';

interface MessageItem {
  _id?: string;
  senderId?: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: string | Date;
}

interface MeetingChatProps {
  meetingCode: string;
  socket: Socket | null;
  onNewMessageReceived?: () => void;
}

const QUICK_EMOJIS = ['👍', '👏', '❤️', '🎉', '💡'];

export function MeetingChat({ meetingCode, socket, onNewMessageReceived }: MeetingChatProps) {
  const { user } = useAuthStore();
  const { setActiveSidebarTab } = useMeetingStore();

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [isSentFeedback, setIsSentFeedback] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<any>(null);

  // Load existing chat history from database
  useEffect(() => {
    if (meetingCode) {
      api.chat.getMessages(meetingCode)
        .then((res) => {
          if (res.messages) {
            setMessages(
              res.messages.map((m: any) => ({
                _id: m._id,
                senderId: m.sender?._id || m.sender,
                senderName: m.senderName || m.sender?.name || 'User',
                senderAvatar: m.senderAvatar || m.sender?.avatar,
                content: m.content,
                timestamp: m.timestamp
              }))
            );
          }
        })
        .catch(() => {});
    }
  }, [meetingCode]);

  // Listen to incoming real-time socket messages & typing indicators
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg: any) => {
      setMessages((prev) => [...prev, msg]);
      if (onNewMessageReceived) {
        onNewMessageReceived();
      }
    };

    const handleUserTyping = (data: { userName: string }) => {
      if (data.userName !== user?.name) {
        setTypingUser(data.userName);
      }
    };

    const handleStopTyping = () => {
      setTypingUser(null);
    };

    socket.on('new-chat-message', handleNewMessage);
    socket.on('user-typing', handleUserTyping);
    socket.on('user-stop-typing', handleStopTyping);

    return () => {
      socket.off('new-chat-message', handleNewMessage);
      socket.off('user-typing', handleUserTyping);
      socket.off('user-stop-typing', handleStopTyping);
    };
  }, [socket, user, onNewMessageReceived]);

  // Check scroll position to show/hide "Scroll to bottom" button
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 60;
    setShowScrollBottom(!isAtBottom);
  };

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Auto-scroll on new message if near bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!socket || !user) return;

    socket.emit('typing', {
      meetingCode,
      userName: user.name
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop-typing', {
        meetingCode,
        userName: user.name
      });
    }, 1500);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || !user || !socket) return;

    socket.emit('send-chat-message', {
      meetingCode,
      content: trimmed,
      senderId: user._id,
      senderName: user.name,
      senderAvatar: user.avatar
    });

    socket.emit('stop-typing', {
      meetingCode,
      userName: user.name
    });

    setInputText('');
    setIsSentFeedback(true);
    setTimeout(() => setIsSentFeedback(false), 800);
  };

  const handleQuickEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
  };

  const formatMessageTime = (dateVal: string | Date) => {
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <aside
      aria-label="Meeting in-call chat"
      className="flex flex-col h-full bg-slate-900 border-l border-slate-800 text-slate-200 w-80 sm:w-96 shrink-0 z-20 relative select-none"
    >
      {/* Chat Header */}
      <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-slate-800 shrink-0 bg-slate-950/40">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-4 w-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-slate-100">In-Call Messages</h3>
          <span className="text-[10px] text-slate-400 font-mono bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700/60">
            {messages.length}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setActiveSidebarTab(null)}
          aria-label="Close meeting chat panel"
          title="Close chat (Escape)"
          className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-400 focus:outline-none"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Message List */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-3 relative select-text"
      >
        {messages.length === 0 ? (
          <div className="py-14 px-4 text-center text-xs text-slate-500 space-y-2.5">
            <div className="h-12 w-12 mx-auto rounded-2xl bg-indigo-950/40 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-sm">
              <MessageSquare className="h-6 w-6 opacity-70" />
            </div>
            <p className="font-semibold text-slate-300 text-sm">No messages yet</p>
            <p className="text-[11px] text-slate-400 leading-relaxed max-w-[240px] mx-auto">
              Share quick notes, questions, or links. All participants in this meeting room can see messages in real time.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.senderId === user?._id || msg.senderName === user?.name;
            const prevMsg = messages[index - 1];
            const isSameSender =
              prevMsg &&
              prevMsg.senderName === msg.senderName &&
              Math.abs(new Date(msg.timestamp).getTime() - new Date(prevMsg.timestamp).getTime()) < 120000;

            return (
              <div
                key={msg._id || index}
                className={cn('flex flex-col', isMe ? 'items-end' : 'items-start')}
              >
                {!isMe && !isSameSender && (
                  <div className="flex items-center space-x-1.5 mb-1 ml-0.5">
                    {msg.senderAvatar ? (
                      <img
                        src={msg.senderAvatar}
                        alt={msg.senderName}
                        className="h-4 w-4 rounded-full object-cover border border-slate-700"
                      />
                    ) : (
                      <div className="h-4 w-4 rounded-full bg-indigo-600/30 text-indigo-300 flex items-center justify-center text-[9px] font-bold">
                        {msg.senderName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-[11px] font-semibold text-slate-300">
                      {msg.senderName}
                    </span>
                  </div>
                )}

                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-sm break-words',
                    isMe
                      ? 'bg-indigo-600 text-white rounded-br-xs'
                      : 'bg-slate-800 text-slate-100 rounded-bl-xs border border-slate-700/60'
                  )}
                >
                  {msg.content}
                </div>

                <span
                  title={new Date(msg.timestamp).toLocaleString()}
                  className="text-[9px] text-slate-500 mt-1 px-1 font-mono"
                >
                  {formatMessageTime(msg.timestamp)}
                </span>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {typingUser && (
          <div
            role="status"
            aria-live="polite"
            className="text-[11px] text-indigo-400 italic flex items-center space-x-1.5 animate-pulse motion-reduce:animate-none"
          >
            <span>{typingUser} is typing...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Scroll-to-Bottom Pill */}
      {showScrollBottom && (
        <button
          type="button"
          onClick={() => scrollToBottom('smooth')}
          aria-label="Scroll to newest messages"
          className="absolute bottom-24 right-4 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold px-3 py-1.5 rounded-full shadow-xl flex items-center space-x-1.5 border border-indigo-400/40 cursor-pointer animate-in fade-in"
        >
          <span>New messages</span>
          <ArrowDown className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Quick Reaction Emoji Bar */}
      <div className="px-3 pt-2 pb-1 border-t border-slate-800/80 bg-slate-950/60 flex items-center space-x-1">
        <span className="text-[10px] text-slate-500 font-medium mr-1 hidden sm:inline">React:</span>
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => handleQuickEmoji(emoji)}
            aria-label={`Insert ${emoji}`}
            className="p-1 rounded-lg hover:bg-slate-800 text-sm transition-transform hover:scale-110 cursor-pointer focus:outline-none"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Message Input Form */}
      <form onSubmit={handleSendMessage} className="p-3 bg-slate-950/80 shrink-0">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            maxLength={1000}
            value={inputText}
            onChange={handleInputChange}
            placeholder="Send a message to everyone..."
            aria-label="Message composer input"
            className="flex-1 h-9 rounded-xl bg-slate-800/90 border border-slate-700 px-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            aria-label="Send message"
            className={cn(
              'h-9 w-9 rounded-xl text-white flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-sm',
              'focus-visible:ring-2 focus-visible:ring-indigo-400 focus:outline-none',
              isSentFeedback
                ? 'bg-emerald-600'
                : 'bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed'
            )}
          >
            {isSentFeedback ? <Check className="h-4 w-4" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
        {inputText.length > 500 && (
          <div className="text-[10px] text-right text-slate-500 mt-1 font-mono">
            {inputText.length}/1000
          </div>
        )}
      </form>
    </aside>
  );
}
