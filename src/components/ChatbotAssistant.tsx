import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send } from 'lucide-react';
import { useState } from 'react';
import { trackEvent } from '../lib/analytics';

interface Message {
  id: number;
  text: string;
  isBot: boolean;
}

export default function ChatbotAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: 'Bonjour! Je suis Marie, votre assistante virtuelle. Comment puis-je vous aider aujourd\'hui?', isBot: true }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const quickReplies = [
    { id: 'availability', text: 'Vérifier les disponibilités', response: 'L\'agenda est actuellement complet, mais vous pouvez joindre notre liste d\'attente. En attendant, je vous recommande fortement de commencer le Programme Reconnexion pour progresser dès maintenant!' },
    { id: 'who', text: 'C\'est pour qui?', response: 'Nous offrons des soins pour:\n• Bébés et enfants (0-12 ans)\n• Futures mamans\n• Adultes avec conditions neurologiques\n\nQuelle catégorie vous correspond?' },
    { id: 'reconnexion', text: 'Programme Reconnexion', response: 'Le Programme Reconnexion est notre programme intégratif en 10 clés pour les troubles neurologiques complexes (TDA/H, TSA, dyspraxie, tics). Vous pouvez le démarrer immédiatement à domicile. Plus d\'infos en bas de page!' },
  ];

  const handleQuickReply = (reply: typeof quickReplies[0]) => {
    trackEvent('chatbot_quick_reply', reply.id);

    const userMessage: Message = {
      id: messages.length + 1,
      text: reply.text,
      isBot: false,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    setTimeout(() => {
      const botMessage: Message = {
        id: messages.length + 2,
        text: reply.response,
        isBot: true,
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      trackEvent('chatbot_opened');
    } else {
      trackEvent('chatbot_closed');
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="fixed bottom-24 right-4 z-50 w-96 max-w-[calc(100vw-2rem)] shadow-soft-lg rounded-2xl overflow-hidden"
          >
            <div className="bg-gradient-to-br from-primary-600 to-primary-700 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Marie</h3>
                  <p className="text-xs text-primary-100">Assistante virtuelle</p>
                </div>
              </div>
              <button
                onClick={toggleChat}
                className="w-8 h-8 hover:bg-white/10 rounded-full flex items-center justify-center transition-colors"
                aria-label="Fermer le chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-background h-96 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                      message.isBot
                        ? 'bg-white border border-muted-200 text-foreground'
                        : 'bg-primary text-white'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-line">{message.text}</p>
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-white border border-muted-200 px-4 py-3 rounded-2xl">
                    <div className="flex space-x-2">
                      <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                        className="w-2 h-2 bg-primary rounded-full"
                      />
                      <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                        className="w-2 h-2 bg-primary rounded-full"
                      />
                      <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                        className="w-2 h-2 bg-primary rounded-full"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            <div className="bg-white border-t border-muted-200 p-4">
              <div className="flex flex-wrap gap-2 mb-3">
                {quickReplies.map((reply) => (
                  <motion.button
                    key={reply.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleQuickReply(reply)}
                    className="px-3 py-2 bg-muted-100 hover:bg-muted-200 rounded-full text-xs font-medium text-foreground transition-colors"
                  >
                    {reply.text}
                  </motion.button>
                ))}
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Écrivez votre message..."
                  className="flex-1 px-4 py-2 rounded-full border border-muted-200 focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.currentTarget;
                      if (input.value.trim()) {
                        const userMsg: Message = {
                          id: messages.length + 1,
                          text: input.value,
                          isBot: false,
                        };
                        setMessages(prev => [...prev, userMsg]);
                        input.value = '';
                        setTimeout(() => {
                          const botMsg: Message = {
                            id: messages.length + 2,
                            text: 'Merci pour votre message! Pour une réponse personnalisée, veuillez remplir le formulaire de contact ou appeler notre clinique.',
                            isBot: true,
                          };
                          setMessages(prev => [...prev, botMsg]);
                        }, 1000);
                      }
                    }
                  }}
                />
                <button className="w-10 h-10 bg-primary hover:bg-primary-600 text-white rounded-full flex items-center justify-center transition-colors">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleChat}
        className="fixed bottom-4 right-4 z-40 w-16 h-16 bg-gradient-to-br from-primary to-primary-600 text-white rounded-full shadow-soft-lg flex items-center justify-center"
        aria-label="Ouvrir le chat"
      >
        <MessageCircle className="w-7 h-7" />
        {!isOpen && (
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [1, 0.8, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
            className="absolute inset-0 bg-primary rounded-full"
          />
        )}
      </motion.button>
    </>
  );
}
