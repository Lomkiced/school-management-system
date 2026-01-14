// FILE: client/src/features/chat/ChatRoom.tsx
// 2026 Standard: Class-based chat room with real-time messaging

import { Loader2, Send, Users, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';

interface Message {
  id: string;
  senderId: string;
  sender: {
    id: string;
    role: string;
    firstName: string;
    lastName: string;
  };
  content: string;
  createdAt: string;
}

interface ClassConversation {
  id: string;
  classInfo: {
    id: string;
    name: string;
    teacher?: { firstName: string; lastName: string } | null;
    subject?: { name: string; code: string } | null;
  };
  participants: any[];
  messages: Message[];
}

interface ChatRoomProps {
  classId: string;
}

export const ChatRoom = ({ classId }: ChatRoomProps) => {
  const { user } = useAuthStore() || {};

  const [conversation, setConversation] = useState<ClassConversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Load class conversation
  useEffect(() => {
    let isMounted = true;

    const initChat = async () => {
      if (!classId) return;

      try {
        setIsLoading(true);
        setError(null);

        const res = await api.get(`/chat/class/${classId}`);

        if (isMounted && res.data?.success) {
          const data = res.data.data;
          setConversation(data);
          setMessages(data.messages || []);
        }
      } catch (err: any) {
        console.error('Chat Init Failed:', err);
        if (isMounted) {
          setError(err.response?.data?.message || 'Failed to load chat');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initChat();

    return () => { isMounted = false; };
  }, [classId]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (messages.length > 0) {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;

    try {
      setIsSending(true);
      const res = await api.post(`/chat/class/${classId}/send`, {
        content: input.trim()
      });

      if (res.data?.success) {
        // Add new message to local state
        setMessages(prev => [...prev, res.data.data]);
        setInput('');
      }
    } catch (err: any) {
      console.error('Send failed:', err);
    } finally {
      setIsSending(false);
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <Card className="h-full flex items-center justify-center shadow-lg border-slate-200">
        <div className="flex flex-col items-center gap-2 text-indigo-600">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm text-slate-500">Loading conversation...</p>
        </div>
      </Card>
    );
  }

  // Error State
  if (error) {
    return (
      <Card className="h-full flex items-center justify-center shadow-lg border-red-200 bg-red-50">
        <div className="text-center p-4">
          <X className="h-8 w-8 text-red-400 mx-auto mb-2" />
          <p className="text-red-600 text-sm">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col shadow-lg border-slate-200">
      <CardHeader className="bg-indigo-50 border-b py-3 px-4 shrink-0">
        <CardTitle className="text-base text-indigo-700 flex items-center justify-between">
          <span className="flex items-center gap-2">
            💬 Class Discussion
          </span>
          <span className="text-xs bg-white px-2 py-1 rounded-full text-slate-500 flex items-center gap-1">
            <Users className="h-3 w-3" />
            {conversation?.participants?.length || 0}
          </span>
        </CardTitle>
      </CardHeader>

      {/* Messages Area */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.length === 0 && (
          <div className="text-center text-slate-400 mt-10">
            <p>No messages yet. Start the conversation! 👋</p>
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.senderId === user?.id;

          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${isMe
                  ? 'bg-indigo-600 text-white rounded-br-none'
                  : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
                }`}>
                {!isMe && (
                  <p className="text-[10px] font-bold text-indigo-500 mb-1">
                    {msg.sender?.role?.toUpperCase()} • {msg.sender?.firstName}
                  </p>
                )}
                <p>{msg.content}</p>
                <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                  {msg.createdAt
                    ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '...'}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </CardContent>

      {/* Input Area */}
      <div className="p-3 border-t bg-white flex gap-2 shrink-0">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Type a message..."
          className="flex-1"
          disabled={isSending}
        />
        <Button
          onClick={handleSend}
          size="icon"
          className="bg-indigo-600 hover:bg-indigo-700"
          disabled={isSending || !input.trim()}
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </Card>
  );
};

export default ChatRoom;