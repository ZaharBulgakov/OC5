import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, User as UserIcon, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';

interface Message {
  id: string;
  text: string;
  sender: 'bot' | 'user';
  timestamp: Date;
}

interface QA {
  id: string;
  question: string;
  answer: string;
  order_num: number;
}

interface RouteColor { bg: string; text: string; }

interface ChatBotProps {
  routeColor?: RouteColor;
}

// Расстояние Левенштейна для нечёткого поиска
function getSimilarity(s1: string, s2: string): number {
  const str1 = s1.toLowerCase().trim();
  const str2 = s2.toLowerCase().trim();
  const m = str1.length;
  const n = str2.length;
  const d: number[][] = [];
  for (let i = 0; i <= m; i++) d[i] = [i];
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) d[i][j] = d[i - 1][j - 1];
      else d[i][j] = Math.min(d[i - 1][j], d[i][j - 1], d[i - 1][j - 1]) + 1;
    }
  }
  const distance = d[m][n];
  const maxLength = Math.max(m, n);
  return maxLength === 0 ? 1 : (maxLength - distance) / maxLength;
}

// Ключевое слово: считаем совпадение по словам запроса
function getKeywordScore(query: string, question: string): number {
  const words = query.toLowerCase().trim().split(/\s+/).filter(w => w.length > 2);
  if (words.length === 0) return 0;
  const q = question.toLowerCase();
  const hits = words.filter(w => q.includes(w)).length;
  return hits / words.length;
}

export default function ChatBot({ routeColor = { bg: "#1A2B4A", text: "#ffffff" } }: ChatBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [qaDatabase, setQaDatabase] = useState<QA[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Привет! Я ваш помощник по учёбе. Задайте мне вопрос, и я постараюсь на него ответить',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Загрузка FAQ из Supabase
  useEffect(() => {
    const fetchFaqs = async () => {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .order('order_num', { ascending: true });
      if (!error && data && data.length > 0) {
        setQaDatabase(data as QA[]);
      }
    };
    fetchFaqs();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const findBestMatch = (query: string): { qa: QA; score: number } | null => {
    if (qaDatabase.length === 0) return null;
    let best = { score: 0, qa: qaDatabase[0] };
    for (const qa of qaDatabase) {
      const levenScore = getSimilarity(query, qa.question);
      const keywordScore = getKeywordScore(query, qa.question);
      // Взвешенная оценка: 50% нечёткое совпадение + 50% ключевые слова
      const combined = levenScore * 0.5 + keywordScore * 0.5;
      if (combined > best.score) {
        best = { score: combined, qa };
      }
    }
    return best.score >= 0.3 ? best : null;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsTyping(true);

    // Поиск с таймаутом 4 секунды
    const searchPromise = new Promise<string>((resolve) => {
      // Небольшая задержка для имитации "думает"
      setTimeout(() => {
        const match = findBestMatch(currentInput);
        if (match) {
          resolve(`Вы имели в виду: «${match.qa.question}»?\n\nЕсли да, то:\n\n${match.qa.answer}`);
        } else {
          resolve('');
        }
      }, 600);
    });

    const timeoutPromise = new Promise<string>((resolve) => {
      setTimeout(() => resolve(''), 4000);
    });

    const result = await Promise.race([searchPromise, timeoutPromise]);

    let botResponse: string;
    if (result) {
      botResponse = result;
    } else {
      botResponse = 'К сожалению, я не знаю ответа на этот вопрос';
      try {
        await supabase.from('unknown_questions').insert([
          { question: currentInput, created_at: new Date() }
        ]);
      } catch (error) {
        console.error('Error saving to Supabase:', error);
      }
    }

    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: botResponse,
      sender: 'bot',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, botMessage]);
    setIsTyping(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="absolute bottom-16 right-0 w-80 sm:w-96 h-[500px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 flex items-center justify-between" style={{ background: routeColor.bg, color: routeColor.text }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: `${routeColor.text}30` }}>
                  <Bot className="w-5 h-5" style={{ color: routeColor.text }} />
                </div>
                <div>
                  <p className="text-sm font-bold leading-none" style={{ color: routeColor.text }}>Помощник ОЦ5</p>
                  <p className="text-[10px] mt-1" style={{ color: `${routeColor.text}99` }}>Онлайн-поддержка</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1 rounded transition-colors hover:opacity-70">
                <X className="w-5 h-5" style={{ color: routeColor.text }} />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary/30">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-2 max-w-[85%] ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div
                      className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center"
                      style={m.sender === 'user'
                        ? { background: routeColor.bg, color: routeColor.text }
                        : { background: 'var(--muted)', color: 'var(--muted-foreground)' }}
                    >
                      {m.sender === 'user' ? <UserIcon className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                    </div>
                    <div
                      className={`p-3 rounded-2xl text-sm whitespace-pre-line ${
                        m.sender === 'user'
                          ? 'rounded-tr-none'
                          : 'bg-card border border-border rounded-tl-none'
                      }`}
                      style={m.sender === 'user' ? { background: routeColor.bg, color: routeColor.text } : {}}
                    >
                      {m.text}
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex gap-2 max-w-[85%]">
                    <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                    <div className="bg-card border border-border p-3 rounded-2xl rounded-tl-none">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border bg-card">
              <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Задайте ваш вопрос..."
                  className="flex-1 bg-secondary border-none rounded-full px-4 py-2 text-sm outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50"
                  style={{ background: routeColor.bg, color: routeColor.text }}
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
        style={isOpen
          ? { background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)' }
          : { background: routeColor.bg, color: routeColor.text }
        }
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </div>
  );
}
