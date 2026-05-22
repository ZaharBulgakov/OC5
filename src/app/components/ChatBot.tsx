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
  question: string;
  answer: string;
}

const LOCAL_QA_DATABASE: QA[] = [
  {
    question: "Как узнать расписание занятий?",
    answer: "Расписание занятий вы можете найти в разделе 'Школьникам' -> 'Расписание' или в личном кабинете после авторизации."
  },
  {
    question: "Какие документы нужны для поступления?",
    answer: "Для поступления необходимы: аттестат, паспорт, СНИЛС, 4 фотографии 3x4 и медицинская справка формы 086-у."
  },
  {
    question: "Где находится столовая?",
    answer: "Столовая находится на первом этаже главного корпуса, сразу за центральным входом направо."
  },
  {
    question: "Как связаться с администрацией?",
    answer: "Вы можете позвонить по номеру +7 (351) 200-00-05 или написать на почту info@oc5-chel.ru."
  },
  {
    question: "Есть ли на территории Wi-Fi?",
    answer: "Да, на всей территории центра работает бесплатная сеть Wi-Fi 'OC5_Free'. Пароль не требуется."
  },
  {
    question: "Когда начинаются каникулы?",
    answer: "График каникул опубликован в разделе 'Документы' -> 'Календарный учебный график'. Ближайшие каникулы начнутся в конце октября."
  }
];

// Функция расчета расстояния Левенштейна для нечеткого поиска
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

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Привет! Я ваш помощник по учебе. Задайте мне вопрос, и я постараюсь на него ответить.',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

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

    // Имитация задержки ответа
    setTimeout(async () => {
      let botResponse = '';

      // Проверка на наличие вопроса (знак вопроса в конце)
      if (!currentInput.trim().endsWith('?')) {
        botResponse = 'Я очень вежливый бот, но, пожалуйста, задайте мне вопрос (не забудьте поставить знак вопроса в конце предложения).';
      } else {
        // Поиск лучшего совпадения
        let bestMatch = { similarity: 0, qa: LOCAL_QA_DATABASE[0] };
        
        for (const qa of LOCAL_QA_DATABASE) {
          const sim = getSimilarity(currentInput, qa.question);
          if (sim > bestMatch.similarity) {
            bestMatch = { similarity: sim, qa };
          }
        }

        if (bestMatch.similarity >= 0.4) {
          botResponse = bestMatch.qa.answer;
        } else {
          botResponse = 'К сожалению, я не знаю ответа на этот вопрос. Я передал его администрации, и мы скоро добавим ответ в базу.';
          
          // Сохранение неизвестного вопроса в Supabase
          try {
            await supabase.from('unknown_questions').insert([
              { question: currentInput, created_at: new Date() }
            ]);
          } catch (error) {
            console.error('Error saving to Supabase:', error);
          }
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
    }, 800);
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
            <div className="p-4 bg-primary text-primary-foreground flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold leading-none">Помощник ОЦ5</p>
                  <p className="text-[10px] opacity-70 mt-1">Онлайн-поддержка</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/10 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary/30"
            >
              {messages.map((m) => (
                <div 
                  key={m.id}
                  className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-2 max-w-[85%] ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center ${m.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      {m.sender === 'user' ? <UserIcon className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                    </div>
                    <div className={`p-3 rounded-2xl text-sm ${
                      m.sender === 'user' 
                        ? 'bg-primary text-primary-foreground rounded-tr-none' 
                        : 'bg-card border border-border rounded-tl-none'
                    }`}>
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
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Задайте ваш вопрос..."
                  className="flex-1 bg-secondary border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50"
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
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          isOpen ? 'bg-card border border-border rotate-90' : 'bg-primary text-primary-foreground hover:scale-110'
        }`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </div>
  );
}
