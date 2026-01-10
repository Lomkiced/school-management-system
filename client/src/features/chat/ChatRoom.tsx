// FILE: client/src/features/chat/ChatRoom.tsx
import { Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';

interface ChatRoomProps {
  classId: number; // We pass the class ID to know which room to open
}

export const ChatRoom = ({ classId }: ChatRoomProps) => {
  const { user } = useAuthStore();
  const { messages, joinRoom, setMessages } = useChatStore();
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Initialize: Fetch the Conversation ID for this Class
  useEffect(() => {
    const initChat = async () => {
      try {
        const res = await api.get(`/chat/class/${classId}`);
        if (res.data.success) {
          const convo = res.data.data;
          setConversationId(convo.id);
          setMessages(convo.messages); // Load history from DB
          joinRoom(convo.id); // Connect to live socket
        }
      } catch (error) {
        console.error("Chat Init Failed", error);
      }
    };
    initChat();
  }, [classId]);

  // 2. Auto-scroll to bottom on new message
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !conversationId) return;

    try {
      // Optimistic Update (Optional, but we'll rely on socket echo for now)
      await api.post('/chat/send', {
        conversationId,
        content: input
      });
      setInput('');
    } catch (error) {
      console.error("Send failed", error);
    }
  };

  return (
    <Card className="h-[600px] flex flex-col shadow-lg border-indigo-100">
      <CardHeader className="bg-indigo-50 border-b py-3">
        <CardTitle className="text-base text-indigo-700 flex items-center gap-2">
          💬 Class Discussion
        </CardTitle>
      </CardHeader>
      
      {/* Messages Area */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.map((msg) => {
          const isMe = msg.senderId === user?.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
                isMe 
                  ? 'bg-indigo-600 text-white rounded-br-none' 
                  : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
              }`}>
                {!isMe && (
                  <p className="text-[10px] font-bold text-indigo-500 mb-1">
                    {msg.sender.role} • {msg.sender.firstName}
                  </p>
                )}
                {msg.content}
                <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </CardContent>

      {/* Input Area */}
      <div className="p-3 border-t bg-white flex gap-2">
        <Input 
          value={input} 
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..." 
          className="flex-1"
        />
        <Button onClick={handleSend} size="icon" className="bg-indigo-600 hover:bg-indigo-700">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};