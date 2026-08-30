import React, { useState, useEffect, useMemo, useRef } from 'react';
import { brandMark } from '../assets/images';
import { paymentChannels } from '../data/products';
import { promoInfo, siteMechanics, supportInfo } from '../data/siteInfo';
import { getWalletBalance, getWalletEntries, getWithdrawalRequests } from '../lib/walletService';
import {
  createChatMessage,
  getChatIdentity,
  getChatThread,
  getChatThreadStats,
  markChatThreadRead,
  saveChatThread,
} from '../lib/chatThreads';
import { hydrateCloudStateKeys } from '../lib/cloudState';

const MAX_MESSAGE_LENGTH = 600;
const CLIENT_COOLDOWN_MS = 1800;
const CHAT_HISTORY_LIMIT = 300;
const CHAT_SYNC_KEYS = ['wartop_chat_threads'];
const SAFE_AI_ERROR_MESSAGE = 'Koneksi Rena sempat terputus. Coba kirim ulang pesanmu sebentar lagi, ya.';
const QUICK_PROMPTS = ['Rekomendasi game', 'Cek paket ChatGPT', 'Cara pembayaran'];
const makeMessageId = (prefix = 'msg') => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export default function ChatWidget({ products, user, transactions }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [activeAdmin, setActiveAdmin] = useState(null);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [currentThread, setCurrentThread] = useState(null);
  const [chatReady, setChatReady] = useState(false);
  const messagesEndRef = useRef(null);
  const chatIdentity = useMemo(() => getChatIdentity(user), [user]);

  useEffect(() => {
    let cancelled = false;
    const bootChatThread = async () => {
      setChatReady(false);
      if (!chatIdentity.isGuest) {
        await hydrateCloudStateKeys(CHAT_SYNC_KEYS);
      }
      if (cancelled) return;
      const thread = getChatThread(chatIdentity);
      const savedThread = saveChatThread({
        ...thread,
        userName: chatIdentity.userName,
        userEmail: chatIdentity.userEmail,
        isGuest: chatIdentity.isGuest,
      });
      if (cancelled) return;
      setCurrentThread(savedThread);
      setMessages(savedThread.messages);
      setAdminMode(Boolean(savedThread.adminMode));
      setActiveAdmin(savedThread.activeAdmin || null);
      setChatReady(true);
    };
    bootChatThread();
    return () => {
      cancelled = true;
    };
  }, [chatIdentity]);

  useEffect(() => {
    if (!chatReady) return undefined;
    let cancelled = false;
    const syncChat = async () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      await hydrateCloudStateKeys(CHAT_SYNC_KEYS);
      if (!cancelled) {
        const thread = getChatThread(chatIdentity);
        setCurrentThread(thread);
        setMessages(thread.messages);
        setAdminMode(Boolean(thread.adminMode));
        setActiveAdmin(thread.activeAdmin || null);
      }
    };
    if (isOpen || user?.email) syncChat();
    const syncEveryMs = isOpen ? 6000 : (user?.email ? 20000 : 0);
    const timer = syncEveryMs ? setInterval(syncChat, syncEveryMs) : null;
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [chatReady, isOpen, chatIdentity, user?.email]);

  useEffect(() => {
    const handleStorageChange = () => {
      if (!chatReady) return;
      const thread = getChatThread(chatIdentity);
      setCurrentThread(thread);
      setMessages(thread.messages);
      setAdminMode(Boolean(thread.adminMode));
      setActiveAdmin(thread.activeAdmin || null);
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('wartop:cloud-state-updated', handleStorageChange);
    window.addEventListener('wartop:chat-threads-updated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('wartop:cloud-state-updated', handleStorageChange);
      window.removeEventListener('wartop:chat-threads-updated', handleStorageChange);
    };
  }, [chatReady, chatIdentity]);

  useEffect(() => {
    if (!isOpen || !chatReady) return;
    const marked = markChatThreadRead(chatIdentity.id, 'user');
    if (marked) setCurrentThread(marked);
  }, [isOpen, chatReady, chatIdentity.id, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const saveState = (newMsgs, newAdminMode = adminMode, newAdmin = activeAdmin) => {
    const limitedMessages = newMsgs.slice(-CHAT_HISTORY_LIMIT);
    setMessages(limitedMessages);
    setAdminMode(newAdminMode);
    setActiveAdmin(newAdmin);
    const existingThread = getChatThread(chatIdentity);
    const savedThread = saveChatThread({
      ...existingThread,
      userName: chatIdentity.userName,
      userEmail: chatIdentity.userEmail,
      isGuest: chatIdentity.isGuest,
      messages: limitedMessages,
      adminMode: newAdminMode,
      activeAdmin: newAdmin || null,
    });
    setCurrentThread(savedThread);
  };

  const threadStats = getChatThreadStats(currentThread || { messages });
  const latestAdminMessage = threadStats.lastAdminMessage;
  const hasUnreadAdminMessage = Boolean(!isOpen && threadStats.unreadForUser && latestAdminMessage);

  const buildChatContext = () => {
    const walletBalance = user?.email ? getWalletBalance(user.email) : 0;
    const walletEntries = user?.email ? getWalletEntries(user.email).slice(0, 12) : [];
    const withdrawals = user?.email
      ? getWithdrawalRequests().filter((request) => request.userEmail === user.email).slice(0, 12)
      : [];

    const activeProducts = products.filter((product) => product.active !== false && !product.comingSoon);
    const aiProducts = activeProducts.filter((product) => (
      product.category === '9' || /chatgpt|claude|gemini|grok/i.test(`${product.name} ${product.description || ''}`)
    ));

    return ({
    user: user ? { name: user.name, email: user.email } : null,
    products: activeProducts.map((product) => ({
      id: product.id,
      name: product.name,
      category: product.category,
      cardLabel: product.cardLabel,
      description: product.description,
      popular: product.popular,
      discount: product.discount,
      inputLabel: product.inputLabel,
      denominations: product.denominations?.map((denom) => ({
        id: denom.id,
        name: denom.name,
        price: denom.price,
        originalPrice: denom.originalPrice,
        points: denom.points,
        stock: denom.stock,
        accessType: denom.accessType,
        duration: denom.duration,
        warranty: denom.warranty,
        description: denom.description,
      })),
    })),
    aiCatalog: aiProducts.map((aiProduct) => ({
      productId: aiProduct.id,
      productName: aiProduct.name,
      description: aiProduct.description,
      inputLabel: aiProduct.inputLabel,
      packages: (aiProduct.denominations || []).map((denom) => ({
        id: denom.id,
        name: denom.name,
        price: denom.price,
        stock: denom.stock,
        accessType: denom.accessType || 'Akun private',
        duration: denom.duration,
        warranty: denom.warranty,
        description: denom.description,
      })),
    })),
    paymentChannels: paymentChannels.map((channel) => ({
      id: channel.id,
      category: channel.category,
      name: channel.name,
      feePercent: channel.feePercent,
      feeFlat: channel.feeFlat,
    })),
    transactions,
    wallet: {
      balance: walletBalance,
      topupMin: 50000,
      topupMax: 5000000,
      topupMethod: 'QRIS only',
      withdrawalMin: 100000,
      withdrawalFeePercent: 0.7,
      rules: [
        'Saldo Wartop bisa dipakai untuk checkout jika saldo cukup.',
        'Jika saldo tidak cukup, user harus top up saldo atau pilih metode pembayaran lain.',
        'Top up saldo Wartop hanya melalui QRIS, minimal Rp50.000 dan maksimal Rp5.000.000.',
        'Transaksi gagal yang sudah mendebit dana akan refund otomatis ke Saldo Wartop.',
        'Tarik saldo hanya ke rekening bank, minimal Rp100.000, fee 0,7%.',
      ],
      entries: walletEntries,
      withdrawals,
    },
    promos: promoInfo,
    mechanics: siteMechanics,
    support: supportInfo,
    });
  };

  const handoffToAdmin = (baseMessages, text = 'Chat dialihkan ke Admin CS Wartop. Kakak sedang terhubung dengan antrean admin.') => {
    const sysMsg = createChatMessage({
      id: makeMessageId('sys'),
      sender: 'system',
      text,
    });
    saveState([...baseMessages, sysMsg], true, null);
  };

  const handleReturnToRena = () => {
    const sysMsg = createChatMessage({
      id: makeMessageId('sys'),
      sender: 'system',
      text: 'Mode bantuan dikembalikan ke Rena.',
    });
    saveState([...messages, sysMsg], false, null);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const messageText = inputText.trim().slice(0, MAX_MESSAGE_LENGTH);
    if (!chatReady || !messageText || isTyping || Date.now() < cooldownUntil) return;

    setCooldownUntil(Date.now() + CLIENT_COOLDOWN_MS);

    const userMsg = createChatMessage({
      id: makeMessageId('msg'),
      sender: 'user',
      text: messageText,
    });

    const updatedMsgs = [...messages, userMsg];
    saveState(updatedMsgs);
    setInputText('');

    const textLower = messageText.toLowerCase();
    const needsAdmin = textLower.includes('admin') ||
      textLower.includes('manusia') ||
      textLower.includes('cs asli') ||
      textLower.includes('whatsapp') ||
      textLower.includes('refund') ||
      textLower.includes('komplain');

    if (adminMode || needsAdmin) {
      if (needsAdmin && !adminMode) {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          handoffToAdmin(updatedMsgs, 'Menghubungkan ke Tim CS Wartop. Silakan tunggu.');
        }, 900);
      }
      return;
    }

    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          history: updatedMsgs.slice(-8),
          context: buildChatContext(),
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'ai_unavailable');
      }

      const csMsg = createChatMessage({
        id: makeMessageId('msg'),
        sender: 'cs',
        agent: 'Rena',
        text: data.reply || 'Ada yang bisa Rena bantu lagi seputar Wartop, Kak?',
      });
      const nextMsgs = [...updatedMsgs, csMsg];

      if (data.forwardToAdmin) {
        handoffToAdmin(nextMsgs);
      } else {
        saveState(nextMsgs);
      }
    } catch {
      const fallbackMsg = createChatMessage({
        id: makeMessageId('msg'),
        sender: 'cs',
        agent: 'Rena',
        text: SAFE_AI_ERROR_MESSAGE,
      });
      saveState([...updatedMsgs, fallbackMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="wartop-chat-widget">
      <button
        className={`chat-float-btn rena-chat-launch${isOpen ? ' is-open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Hubungi Customer Service"
        aria-expanded={isOpen}
      >
        <span className="chat-badge-pulse"></span>
        {isOpen ? (
          <i className="bi bi-x-lg text-white rena-chat-launch__close"></i>
        ) : (
          <>
            <span className="rena-chat-launch__mark"><img src={brandMark} alt="" className="chat-brand-mark" /></span>
            <span className="rena-chat-launch__copy">
              <small>Butuh bantuan?</small>
              <strong>Chat Rena</strong>
            </span>
          </>
        )}
      </button>

      {isOpen && (
        <section className="chat-window rena-chat-window" aria-label="Chat bantuan Wartop">
          <header className="rena-chat-header">
            <div className="rena-chat-header__agent">
              <div className="rena-chat-avatar">
                <img src={brandMark} alt="" />
                <span aria-hidden="true"></span>
              </div>
              <div className="rena-chat-header__copy">
                <span className="rena-chat-header__eyebrow">Wartop support desk</span>
                <strong>
                  {adminMode
                    ? (activeAdmin ? `Admin ${activeAdmin}` : 'Tim CS Wartop')
                    : 'Rena'}
                </strong>
              </div>
            </div>
            <div className="rena-chat-header__actions">
              <span className={`rena-chat-mode${adminMode ? ' is-admin' : ''}`}>
                <i className={`bi ${adminMode ? 'bi-headset' : 'bi-stars'}`} aria-hidden="true"></i>
                {adminMode ? (activeAdmin ? 'Live' : 'Antrean') : 'AI aktif'}
              </span>
              <button type="button" onClick={() => setIsOpen(false)} aria-label="Tutup chat">
                <i className="bi bi-x-lg" aria-hidden="true"></i>
              </button>
            </div>
          </header>

          <div className="rena-chat-toolbar">
            <span>
              <i className={`bi ${adminMode ? 'bi-person-workspace' : 'bi-compass'}`} aria-hidden="true"></i>
              {adminMode ? 'Percakapan dialihkan ke tim dukungan' : 'Produk, pembayaran, dan pesanan'}
            </span>
            {adminMode && (
              <button type="button" onClick={handleReturnToRena}>Kembali ke Rena</button>
            )}
          </div>

          <div className="chat-messages-container rena-chat-feed">
            {!adminMode && messages.length <= 1 && (
              <div className="rena-chat-quick-prompts" aria-label="Pertanyaan cepat">
                <span>Coba tanyakan</span>
                <div>
                  {QUICK_PROMPTS.map((prompt) => (
                    <button key={prompt} type="button" onClick={() => setInputText(prompt)}>{prompt}</button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => {
              if (m.sender === 'system') {
                return (
                  <div key={m.id} className="chat-msg-system">
                    <span>{m.text}</span>
                  </div>
                );
              }

              const isMe = m.sender === 'user';
              return (
                <div key={m.id} className={`chat-bubble-row ${isMe ? 'chat-row-user' : 'chat-row-agent'}`}>
                  {!isMe && (
                    <span className="chat-bubble-sender rena-chat-sender">
                      <span aria-hidden="true">{(m.agent || 'Admin').charAt(0)}</span>
                      {m.agent || 'Admin Wartop'}
                    </span>
                  )}
                  <div className={`chat-bubble rena-chat-bubble ${isMe ? 'bubble-user' : 'bubble-agent'}`}>
                    {m.text}
                    <div className="chat-bubble-time">{m.timestamp}</div>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="chat-bubble-row chat-row-agent">
                <span className="chat-bubble-sender">Rena</span>
                <div className="chat-bubble bubble-agent">
                  <div className="chat-typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input-form rena-chat-composer" onSubmit={handleSendMessage}>
            <div className="rena-chat-composer__meta">
              <span>{adminMode ? 'Kirim ke Tim CS' : 'Tanya Rena'}</span>
              <span>{inputText.length}/{MAX_MESSAGE_LENGTH}</span>
            </div>
            <div className="rena-chat-composer__row">
              <textarea
                rows="1"
                maxLength={MAX_MESSAGE_LENGTH}
                placeholder="Tulis pesanmu di sini..."
                value={inputText}
                onChange={(event) => setInputText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                className="chat-input-field"
                disabled={!chatReady}
              />
              <button
                type="submit"
                className="chat-send-btn"
                aria-label="Kirim pesan"
                disabled={!chatReady || !inputText.trim() || isTyping || Date.now() < cooldownUntil}
              >
                <i className="bi bi-arrow-up text-white"></i>
              </button>
            </div>
          </form>
        </section>
      )}

      {hasUnreadAdminMessage && (
        <button
          type="button"
          className="chat-admin-notice"
          onClick={() => setIsOpen(true)}
        >
          <span className="chat-admin-notice__badge">
            {latestAdminMessage.invoiceId ? `Notif Pesanan #${latestAdminMessage.invoiceId}` : 'Balasan Admin'}
          </span>
          <strong>{latestAdminMessage.agent || 'Admin Wartop'}</strong>
          <span>{latestAdminMessage.text}</span>
        </button>
      )}
    </div>
  );
}
