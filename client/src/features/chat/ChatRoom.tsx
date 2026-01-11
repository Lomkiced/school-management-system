// FILE: client/src/features/chat/ChatRoom.tsx
import { Loader2, Send } from 'lucide-react'; // Added Loader2 for loading icon
import { useEffect, useRef, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';

interface ChatRoomProps {
  classId: number;
}

export const ChatRoom = ({ classId }: ChatRoomProps) => {
  // SAFEGUARD 1: Default to empty object/array if stores are undefined
  const { user } = useAuthStore() || {};
  const chatStore = useChatStore();
  
  // SAFEGUARD 2: Extract store values safely
  const messages = chatStore?.messages || [];
  const joinRoom = chatStore?.joinRoom;
  const setMessages = chatStore?.setMessages;

  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Track loading state
  const [error, setError] = useState<string | null>(null); // Track errors
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Initialize: Fetch the Conversation ID for this Class
  useEffect(() => {
    let isMounted = true; // Prevent state updates if component unmounts

    const initChat = async () => {
      if (!classId) return;

      try {
        setIsLoading(true);
        setError(null);
        
        const res = await api.get(`/chat/class/${classId}`);
        
        if (isMounted && res.data?.success) {
          const convo = res.data.data;
          
          if (convo) {
            setConversationId(convo.id);
            // SAFEGUARD 3: Ensure messages is always an array
            if (setMessages) setMessages(convo.messages || []);
            if (joinRoom) joinRoom(convo.id);
          }
        }
      } catch (err) {
        console.error("Chat Init Failed", err);
        if (isMounted) setError("Failed to load chat.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initChat();

    return () => { isMounted = false; };
  }, [classId, joinRoom, setMessages]);

  // 2. Auto-scroll to bottom on new message
  useEffect(() => {
    // Only scroll if we have messages
    if (messages && messages.length > 0) {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !conversationId) return;

    try {
      await api.post('/chat/send', {
        conversationId,
        content: input
      });
      setInput('');
    } catch (err) {
      console.error("Send failed", err);
      // Optional: Show a toast error here
    }
  };

  // RENDER LOGIC --------------------------------------

  // 1. Loading State
  if (isLoading) {
    return (
      <Card className="h-[600px] flex items-center justify-center shadow-lg border-indigo-100">
        <div className="flex flex-col items-center gap-2 text-indigo-600">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p>Loading conversation...</p>
        </div>
      </Card>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <Card className="h-[600px] flex items-center justify-center shadow-lg border-red-100 bg-red-50">
        <p className="text-red-500">{error}</p>
      </Card>
    );
  }

  return (
    <Card className="h-[600px] flex flex-col shadow-lg border-indigo-100">
      <CardHeader className="bg-indigo-50 border-b py-3">
        <CardTitle className="text-base text-indigo-700 flex items-center gap-2">
          💬 Class Discussion
        </CardTitle>
      </CardHeader>
      
      {/* Messages Area */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {/* SAFEGUARD 4: Check if messages is actually an array before mapping */}
        {Array.isArray(messages) && messages.length === 0 && (
          <div className="text-center text-slate-400 mt-10">
            <p>No messages yet. Be the first to say hello! 👋</p>
          </div>
        )}

        {Array.isArray(messages) && messages.map((msg) => {
          // SAFEGUARD 5: Handle missing sender data gracefully
          const sender = msg?.sender || { role: 'Unknown', firstName: 'User' };
          const isMe = msg?.senderId === user?.id;
          
          return (
            <div key={msg.id || Math.random()} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
                isMe 
                  ? 'bg-indigo-600 text-white rounded-br-none' 
                  : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
              }`}>
                {!isMe && (
                  <p className="text-[10px] font-bold text-indigo-500 mb-1">
                    {/* SAFEGUARD 6: Optional Chaining (?.) prevents crash if property is missing */}
                    {sender.role?.toUpperCase()} • {sender.firstName}
                  </p>
                )}
                {msg.content}
                <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                   {/* SAFEGUARD 7: Safe Date Parsing */}
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