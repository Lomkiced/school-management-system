import { Bot, MessageCircle, Send, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    text: string;
    timestamp: Date;
}

export const SchoolAI = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            text: "Hello! I'm SchoolAI, your intelligent assistant. How can I help you manage the school today?",
            timestamp: new Date()
        }
    ]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const generateResponse = async (query: string) => {
        setIsTyping(true);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        let responseText = "I'm not sure about that yet. I'm still learning!";
        const lowerQuery = query.toLowerCase();

        if (lowerQuery.includes('student') && (lowerQuery.includes('count') || lowerQuery.includes('how many'))) {
            responseText = "We currently have **1,245 active students** enrolled across all grade levels. This is a 12% increase from last semester.";
        } else if (lowerQuery.includes('revenue') || lowerQuery.includes('finance')) {
            responseText = "Current monthly revenue is **₱2,450,000** with a collection rate of 87%. There are currently 45 overdue invoices requiring attention.";
        } else if (lowerQuery.includes('teacher') || lowerQuery.includes('staff')) {
            responseText = "There are **84 verified faculty members**. The Science department has the highest workload distribution this week.";
        } else if (lowerQuery.includes('help') || lowerQuery.includes('can you')) {
            responseText = "I can help you with:\n\n• generating reports\n• finding student records\n• analyzing financial trends\n• drafting emails to parents\n\nJust ask!";
        } else if (lowerQuery.includes('hello') || lowerQuery.includes('hi')) {
            responseText = "Hi there! Ready to be productive?";
        }

        const newMessage: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            text: responseText,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, newMessage]);
        setIsTyping(false);
    };

    const handleSend = () => {
        if (!input.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            text: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        generateResponse(input);
    };

    return (
        <>
            {/* Floating Toggle Button */}
            <button
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-6 right-6 p-4 rounded-full bg-indigo-600 text-white shadow-lg hover:shadow-indigo-500/30 hover:scale-110 transition-all duration-300 z-50 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
            >
                <MessageCircle size={28} />
            </button>

            {/* Chat Window */}
            <div className={`fixed bottom-6 right-6 w-96 h-[600px] flex flex-col bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl transition-all duration-500 origin-bottom-right z-50 ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-10 pointer-events-none'}`}>

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-indigo-100 bg-indigo-50/50 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 rounded-lg">
                            <Bot size={20} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">SchoolAI</h3>
                            <p className="text-xs text-indigo-600 font-medium flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Online
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 hover:bg-black/5 rounded-full text-slate-500 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                        ? 'bg-indigo-600 text-white rounded-tr-sm'
                                        : 'bg-white border border-indigo-100 text-slate-700 shadow-sm rounded-tl-sm'
                                    }`}
                            >
                                {msg.text.split('\n').map((line, i) => (
                                    <p key={i} className={i > 0 ? "mt-2" : ""}>{line}</p>
                                ))}
                                <span className={`text-[10px] mt-1 block opacity-70 ${msg.role === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}>
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    ))}

                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="bg-white border border-indigo-100 p-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1">
                                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-indigo-50 bg-white/50 rounded-b-2xl">
                    <form
                        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                        className="flex items-center gap-2"
                    >
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask anything..."
                            className="flex-1 bg-white border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 rounded-xl px-4 py-3 text-sm placeholder:text-slate-400 shadow-sm transition-all"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isTyping}
                            className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-200"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
};
