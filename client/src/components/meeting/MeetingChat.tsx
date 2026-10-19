import React, { useState, useEffect, useRef } from 'react';
import { Send, X, MessageSquare, Sparkles } from 'lucide-react';
import { Socket } from 'socket.io-client';
import { useAuthStore } from '../../store/authStore.js';
import { useMeetingStore } from '../../store/meetingStore.js';
import { api } from '../../services/api.js';

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
}

export function MeetingChat({ meetingCode, socket }: MeetingChatProps) {
  const { user } = useAuthStore();
  const { setActiveSidebarTab } = useMeetingStore();

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [typingUser, setTypingUser] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
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
    };

    const handleUserTyping = (data: { userName: string }) => {
      setTypingUser(data.userName);
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
  }, [socket]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    if (!inputText.trim() || !user || !socket) return;

    socket.emit('send-chat-message', {
      meetingCode,
      content: inputText.trim(),
      senderId: user._id,
      senderName: user.name,
      senderAvatar: user.avatar
    });

    socket.emit('stop-typing', {
      meetingCode,
      userName: user.name
    });

    setInputText('');
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 text-slate-200 w-80 sm:w-96 shrink-0 z-20">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-4 w-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-slate-100">In-Call Messages</h3>
        </div>
        <button
          onClick={() => setActiveSidebarTab(null)}
          className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {messages.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500 space-y-2">
            <MessageSquare className="h-8 w-8 mx-auto opacity-40 text-slate-400" />
            <p>No messages sent yet.</p>
            <p className="text-[11px] text-slate-600">Messages are encrypted and visible to call attendees.</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.senderId === user?._id || msg.senderName === user?.name;
            return (
              <div
                key={index}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                {!isMe && (
                  <span className="text-[10px] font-semibold text-slate-400 mb-1 ml-1">
                    {msg.senderName}
                  </span>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-sm ${
                    isMe
                      ? 'bg-indigo-600 text-white rounded-br-xs'
                      : 'bg-slate-800 text-slate-100 rounded-bl-xs border border-slate-700/60'
                  }`}
                >
                  {msg.content}
                </div>
                <span className="text-[9px] text-slate-500 mt-1 px-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {typingUser && (
          <div className="text-[11px] text-indigo-400 italic flex items-center space-x-1.5 animate-pulse">
            <span>{typingUser} is typing...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Form */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-950/80 shrink-0">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            placeholder="Send a message to everyone..."
            className="flex-1 h-9 rounded-xl bg-slate-800/80 border border-slate-700 px-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="h-9 w-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-sm"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
