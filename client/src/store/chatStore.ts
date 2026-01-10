// FILE: client/src/store/chatStore.ts
import { create } from 'zustand';
import { socketService } from '../lib/socket';

interface Message {
  id: string;
  content: string;
  senderId: string;
  sender: {
    firstName: string;
    lastName: string;
    role: string;
  };
  createdAt: string;
}

interface ChatState {
  messages: Message[];
  isConnected: boolean;
  activeConversationId: string | null;
  
  // Actions
  joinRoom: (conversationId: string) => void;
  leaveRoom: () => void;
  addMessage: (msg: Message) => void;
  setMessages: (msgs: Message[]) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isConnected: false,
  activeConversationId: null,

  joinRoom: (conversationId) => {
    const socket = socketService.connect();
    
    // Join the specific room ID
    socket.emit('join_room', conversationId);
    set({ activeConversationId: conversationId, isConnected: true });

    // Listen for incoming messages
    socket.off('receive_message'); // Remove old listeners to avoid duplicates
    socket.on('receive_message', (newMessage: Message) => {
      // Only add if it belongs to current room
      if (newMessage.conversationId === get().activeConversationId) {
         set((state) => ({ messages: [...state.messages, newMessage] }));
      }
    });
  },

  leaveRoom: () => {
    const socket = socketService.getSocket();
    socket.off('receive_message');
    set({ activeConversationId: null, messages: [] });
  },

  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  setMessages: (msgs) => set({ messages: msgs })
}));