import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Send, Image as ImageIcon, Paperclip, Check, CheckCheck, Loader2, MessageSquare } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { useConversations, useMessages } from '../hooks/useQueries';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuthStore } from '../stores/authStore';
import type { Message } from '../types';

const ChatPage: React.FC = () => {
  const location = useLocation();
  const { user } = useAuthStore();
  
  const [activeConvId, setActiveConvId] = useState<number | null>(
    location.state?.conversationId || null
  );
  const [inputValue, setInputValue] = useState('');
  
  const { data: convData, isLoading: convLoading } = useConversations();
  const { data: msgData, isLoading: msgLoading, refetch } = useMessages(activeConvId || undefined);
  
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // WebSocket
  const { isConnected, sendMessage, markRead } = useWebSocket({
    onMessage: (msg) => {
      if (msg.conversation_id === activeConvId) {
        setLocalMessages(prev => [...prev, msg]);
        markRead(activeConvId);
      }
    }
  });

  // Load messages from query
  useEffect(() => {
    if (msgData?.items) {
      setLocalMessages(msgData.items.slice().reverse()); // backend gives newest first usually, depending on pagination
      if (activeConvId) {
        markRead(activeConvId);
      }
    }
  }, [msgData, activeConvId, markRead]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !activeConvId) return;
    
    sendMessage(activeConvId, inputValue, 'TEXT');
    setInputValue('');
  };

  const conversations = convData?.items || [];
  const activeConv = conversations.find(c => c.id === activeConvId);

  return (
    <Layout noFooter>
      <div style={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
        
        {/* Sidebar */}
        <div style={{
          width: 320, flexShrink: 0,
          background: 'var(--color-surface)',
          borderRight: '1px solid var(--color-border)',
          display: 'flex', flexDirection: 'column'
        }}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border)' }}>
            <h2 style={{ fontWeight: 700, fontSize: '1.25rem', margin: 0 }}>Mesajlar</h2>
            <div style={{ fontSize: '0.8rem', color: isConnected ? 'var(--color-success)' : 'var(--color-warning)', marginTop: 4 }}>
              {isConnected ? 'Bağlı' : 'Bağlanıyor...'}
            </div>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {convLoading ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--color-text-muted)' }}>Yükleniyor...</div>
            ) : conversations.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--color-text-muted)' }}>Mesajınız bulunmuyor.</div>
            ) : (
              conversations.map(conv => {
                const isCustomer = user?.role === 'USER';
                const otherParty = isCustomer ? conv.provider : conv.customer;
                const otherName = isCustomer ? conv.provider?.business_name : `${conv.customer?.first_name} ${conv.customer?.last_name?.[0]}.`;
                
                return (
                  <div 
                    key={conv.id}
                    onClick={() => setActiveConvId(conv.id)}
                    style={{
                      padding: '16px 20px',
                      borderBottom: '1px solid var(--color-border)',
                      cursor: 'pointer',
                      background: activeConvId === conv.id ? 'var(--color-surface-2)' : 'transparent',
                      display: 'flex', gap: 12, alignItems: 'center'
                    }}
                  >
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, color: 'white'
                    }}>
                      {otherName?.[0] || '?'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {otherName}
                        </div>
                        {conv.last_message && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            {new Date(conv.last_message.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </div>
                      <div style={{ 
                        fontSize: '0.85rem', 
                        color: conv.unread_count ? 'var(--color-text)' : 'var(--color-text-muted)',
                        fontWeight: conv.unread_count ? 700 : 400,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                      }}>
                        {conv.last_message?.content || 'Henüz mesaj yok'}
                      </div>
                    </div>
                    {!!conv.unread_count && conv.unread_count > 0 && (
                      <div style={{
                        background: 'var(--color-primary)', color: 'white',
                        borderRadius: '50%', width: 20, height: 20,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.75rem', fontWeight: 700
                      }}>
                        {conv.unread_count}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--color-bg)' }}>
          {activeConvId && activeConv ? (
            <>
              {/* Header */}
              <div style={{
                padding: '16px 24px',
                background: 'var(--color-surface)',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex', alignItems: 'center', gap: 12
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, color: 'white'
                }}>
                   {(user?.role === 'USER' ? activeConv.provider?.business_name : activeConv.customer?.first_name)?.[0] || '?'}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                    {user?.role === 'USER' ? activeConv.provider?.business_name : `${activeConv.customer?.first_name} ${activeConv.customer?.last_name}`}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    {user?.role === 'USER' ? 'Uzman' : 'Müşteri'}
                  </div>
                </div>
              </div>

              {/* Messages list */}
              <div style={{ flex: 1, padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {msgLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
                  </div>
                ) : localMessages.length === 0 ? (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--color-text-muted)' }}>
                    İlk mesajı göndererek iletişime geçin.
                  </div>
                ) : (
                  localMessages.map(msg => {
                    const isMe = msg.sender_id === user?.id;
                    return (
                      <div key={msg.id} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMe ? 'flex-end' : 'flex-start'
                      }}>
                        <div className={isMe ? 'chat-bubble-sent' : 'chat-bubble-received'}>
                          {msg.content}
                        </div>
                        <div style={{ 
                          fontSize: '0.7rem', 
                          color: 'var(--color-text-muted)', 
                          marginTop: 4,
                          display: 'flex', alignItems: 'center', gap: 4
                        }}>
                          {new Date(msg.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                          {isMe && (
                            msg.is_read ? <CheckCheck size={12} color="#34d399" /> : <Check size={12} />
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div style={{ padding: '16px 24px', background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)' }}>
                <form onSubmit={handleSend} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <button type="button" className="btn btn-ghost" style={{ padding: 8 }}>
                    <Paperclip size={20} />
                  </button>
                  <button type="button" className="btn btn-ghost" style={{ padding: 8 }}>
                    <ImageIcon size={20} />
                  </button>
                  <input
                    className="input"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Mesaj yazın..."
                    style={{ borderRadius: 999, height: 48 }}
                  />
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ borderRadius: '50%', width: 48, height: 48, padding: 0 }}
                    disabled={!inputValue.trim() || !isConnected}
                  >
                    <Send size={18} style={{ marginLeft: 2 }} />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-muted)' }}>
              <MessageSquare size={48} style={{ opacity: 0.5, marginBottom: 16 }} />
              <h3>Sohbete Başlayın</h3>
              <p>Mesajlaşmak için sol taraftan bir kişi seçin.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ChatPage;
