import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, Image, Paperclip } from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';

interface Message {
  id: number;
  sender_id: number;
  content: string;
  message_type: string;
  is_read: boolean;
  created_at: string;
}

interface Conversation {
  id: number;
  other_user: { id: number; first_name: string; last_name: string; avatar?: string } | null;
  last_message: { content: string; created_at: string; sender_id: number } | null;
  unread_count: number;
}

export default function ChatPage() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [ws, setWs] = useState<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (conversationId) {
      loadMessages(Number(conversationId));
      connectWebSocket();
    }
    return () => { ws?.close(); };
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    try {
      const res = await api.get('/messaging/conversations');
      setConversations(res.data);
    } catch {}
  };

  const loadMessages = async (convId: number) => {
    try {
      const res = await api.get(`/messaging/conversations/${convId}/messages`);
      setMessages(res.data);
    } catch {}
  };

  const connectWebSocket = () => {
    const tokens = JSON.parse(localStorage.getItem('tokens') || 'null');
    if (!tokens?.access_token) return;

    const socket = new WebSocket(`ws://localhost:8000/ws/${tokens.access_token}`);

    socket.onopen = () => {
      console.log('WebSocket connected');
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.action === 'new_message' && data.message) {
        setMessages(prev => [...prev, data.message]);
        loadConversations();
      }
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
    };

    setWs(socket);
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !conversationId || !ws) return;

    ws.send(JSON.stringify({
      action: 'send_message',
      conversation_id: Number(conversationId),
      content: newMessage,
      message_type: 'TEXT',
    }));

    setNewMessage('');
  };

  const activeConversation = conversations.find(c => c.id === Number(conversationId));

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-2xl border border-border-light overflow-hidden" style={{ height: 'calc(100vh - 160px)' }}>
          <div className="flex h-full">
            {/* Conversation List */}
            <div className={`${conversationId ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 border-r border-border-light`}>
              <div className="p-4 border-b border-border-light">
                <h2 className="font-semibold text-primary text-lg">Mesajlar</h2>
              </div>
              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="text-center py-12 text-text-muted text-sm">Henuz mesajiniz yok</div>
                ) : (
                  conversations.map(conv => (
                    <div
                      key={conv.id}
                      onClick={() => navigate(`/chat/${conv.id}`)}
                      className={`p-4 cursor-pointer border-b border-border-light hover:bg-bg transition-colors ${
                        conversationId === String(conv.id) ? 'bg-accent/5 border-l-2 border-l-accent' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-accent font-semibold text-sm">
                            {conv.other_user?.first_name?.[0] || '?'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium truncate">
                              {conv.other_user?.first_name} {conv.other_user?.last_name}
                            </span>
                            {conv.unread_count > 0 && (
                              <span className="w-5 h-5 bg-accent text-white text-xs rounded-full flex items-center justify-center">
                                {conv.unread_count}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-text-muted truncate mt-0.5">
                            {conv.last_message?.content || 'Mesaj yok'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Chat Area */}
            {conversationId ? (
              <div className="flex-1 flex flex-col">
                {/* Chat Header */}
                <div className="p-4 border-b border-border-light flex items-center gap-3">
                  <button onClick={() => navigate('/chat')} className="md:hidden p-1">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                    <span className="text-accent font-semibold text-sm">
                      {activeConversation?.other_user?.first_name?.[0] || '?'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">
                      {activeConversation?.other_user?.first_name} {activeConversation?.other_user?.last_name}
                    </h3>
                    <p className="text-xs text-text-muted">Cevrimici</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs md:max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                        msg.sender_id === user?.id
                          ? 'bg-accent text-white rounded-br-md'
                          : 'bg-bg text-primary rounded-bl-md'
                      }`}>
                        <p>{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${msg.sender_id === user?.id ? 'text-white/60' : 'text-text-muted'}`}>
                          {new Date(msg.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-border-light">
                  <div className="flex items-center gap-3">
                    <button className="p-2 text-text-muted hover:text-accent transition-colors">
                      <Paperclip className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-text-muted hover:text-accent transition-colors">
                      <Image className="w-5 h-5" />
                    </button>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Mesajinizi yazin..."
                      className="flex-1 px-4 py-2.5 bg-bg rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent/20"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="p-2.5 bg-accent text-white rounded-xl hover:bg-accent-dark transition-colors disabled:opacity-50"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 hidden md:flex items-center justify-center text-text-muted">
                <div className="text-center">
                  <div className="text-5xl mb-4">💬</div>
                  <p>Bir konusma secin</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
