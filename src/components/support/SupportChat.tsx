
import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Minus, Square, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface SupportChatProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
}

export const SupportChat = ({ user, isOpen, onClose }: SupportChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Bonjour ! Je suis votre assistant StockFlow Pro. Comment puis-je vous aider aujourd\'hui ?',
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [size, setSize] = useState({ width: 400, height: 500 });
  const chatRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const analyzeUserContext = () => {
    const roleLabels = {
      admin: 'Administrateur',
      manager: 'Gérant', 
      seller: 'Vendeur'
    };

    const availableFeatures = {
      admin: ['Tous les modules', 'Gestion utilisateurs', 'Configuration système', 'Rapports complets', 'Gestion financière'],
      manager: ['Gestion magasins', 'Inventaire', 'Fournisseurs', 'Analytics', 'Rapports'],
      seller: ['Ventes (POS)', 'Produits', 'Retours & Échanges']
    };

    return {
      role: roleLabels[user.role] || user.role,
      features: availableFeatures[user.role] || []
    };
  };

  const generateIntelligentResponse = (userMessage: string) => {
    const context = analyzeUserContext();
    const lowerMessage = userMessage.toLowerCase();

    // Réponses contextualisées selon le rôle
    if (lowerMessage.includes('vente') || lowerMessage.includes('pos')) {
      if (context.features.includes('Ventes (POS)')) {
        return `En tant que ${context.role}, vous avez accès au module POS. Pour effectuer une vente : 1) Accédez à "Ventes (POS)" dans le menu, 2) Sélectionnez les produits, 3) Validez la transaction. Besoin d'aide spécifique ?`;
      } else {
        return `Désolé, en tant que ${context.role}, vous n'avez pas accès au module de vente. Contactez votre administrateur pour obtenir ces permissions.`;
      }
    }

    if (lowerMessage.includes('rapport') || lowerMessage.includes('analytics')) {
      if (context.features.includes('Rapports') || context.features.includes('Analytics')) {
        return `Vous avez accès aux rapports et analytics. Allez dans le menu "Rapports" pour voir les statistiques de vente, ou "Analytics" pour des analyses détaillées.`;
      } else {
        return `Les rapports ne sont pas disponibles pour votre rôle de ${context.role}. Contactez votre manager pour plus d'informations.`;
      }
    }

    if (lowerMessage.includes('utilisateur') || lowerMessage.includes('user')) {
      if (user.role === 'admin') {
        return `En tant qu'administrateur, vous pouvez gérer les utilisateurs via le menu "Utilisateurs". Vous pouvez créer, modifier et supprimer des comptes utilisateurs.`;
      } else {
        return `La gestion des utilisateurs est réservée aux administrateurs. Vous êtes connecté en tant que ${context.role}.`;
      }
    }

    if (lowerMessage.includes('finance') || lowerMessage.includes('financier')) {
      if (context.features.includes('Gestion financière')) {
        return `Vous avez accès à la gestion financière. Consultez le menu "Gestion Financière" pour voir les revenus, dépenses et analyses financières.`;
      } else {
        return `L'accès aux données financières n'est pas autorisé pour votre rôle de ${context.role}.`;
      }
    }

    // Réponse générale avec contexte
    return `Bonjour ${user.name} ! En tant que ${context.role}, vous avez accès aux fonctionnalités suivantes : ${context.features.join(', ')}. Comment puis-je vous aider avec l'une de ces fonctionnalités ?`;
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    // Simuler une réponse de l'assistant
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: generateIntelligentResponse(inputMessage),
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);

    setInputMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={chatRef}
      className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-2xl"
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: isMinimized ? 50 : size.height,
        minWidth: 300,
        minHeight: isMinimized ? 50 : 400
      }}
    >
      {/* Header */}
      <div 
        className="bg-blue-600 text-white p-3 rounded-t-lg flex items-center justify-between cursor-move"
        onMouseDown={(e) => {
          const startX = e.clientX - position.x;
          const startY = e.clientY - position.y;
          
          const handleMouseMove = (e: MouseEvent) => {
            setPosition({
              x: e.clientX - startX,
              y: e.clientY - startY
            });
          };
          
          const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
          };
          
          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        }}
      >
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          <span className="font-semibold">Support StockFlow Pro</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-blue-700 h-6 w-6 p-0"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-blue-700 h-6 w-6 p-0"
            onClick={onClose}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Contact Info */}
          <div className="bg-yellow-50 border-b p-2 text-sm text-center">
            <p className="text-gray-700">
              <strong>Assistance technique :</strong> Tél: +229 01 97 21 21 85 | 
              Email: jasmeshospice@gmail.com
            </p>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4 h-80">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.isUser
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {message.timestamp.toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="border-t p-3">
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Tapez votre message..."
                className="flex-1"
              />
              <Button onClick={handleSendMessage} size="sm">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
