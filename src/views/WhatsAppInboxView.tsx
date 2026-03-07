import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { MessageSquare, Send, Phone, User, Search, RefreshCw, ChevronLeft } from 'lucide-react'
import { useCrm } from '../context/CrmContext'
import { API_BASE, safeFetch, STATUS_LABELS, getScoreColor, getScoreLabel } from '../types/crm'
import { supabase } from '../lib/supabase'

interface Message {
  role: 'lead' | 'bot' | 'vendor'
  content: string
  timestamp: string
}

interface Conversation {
  id: string
  lead_id: string
  phone: string
  messages: Message[]
  updated_at: string
}

export default function WhatsAppInboxView() {
  const { leads, team, showToast } = useCrm()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConvoId, setSelectedConvoId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [messageText, setMessageText] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingConvos, setLoadingConvos] = useState(true)
  const [mobileShowThread, setMobileShowThread] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // ---- Load conversations ----
  const loadConversations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) throw error
      setConversations(data || [])
    } catch (err) {
      console.error('Error loading conversations:', err)
    } finally {
      setLoadingConvos(false)
    }
  }, [])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  // ---- Auto-refresh every 15 seconds ----
  useEffect(() => {
    const interval = setInterval(() => {
      loadConversations()
    }, 15000)
    return () => clearInterval(interval)
  }, [loadConversations])

  // ---- Scroll to bottom when messages change ----
  const selectedConvo = useMemo(
    () => conversations.find(c => c.id === selectedConvoId) || null,
    [conversations, selectedConvoId]
  )

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedConvo?.messages])

  // ---- Lead lookup ----
  const getLeadForConvo = useCallback(
    (convo: Conversation) => leads.find(l => l.id === convo.lead_id || l.phone === convo.phone),
    [leads]
  )

  // ---- Unread check: last message is from lead with no vendor reply after ----
  const isUnread = useCallback((convo: Conversation) => {
    const msgs = convo.messages
    if (!msgs || msgs.length === 0) return false
    const lastMsg = msgs[msgs.length - 1]
    return lastMsg.role === 'lead'
  }, [])

  // ---- Filtered conversations ----
  const filteredConvos = useMemo(() => {
    if (!searchQuery.trim()) return conversations
    const q = searchQuery.toLowerCase()
    return conversations.filter(convo => {
      const lead = getLeadForConvo(convo)
      const name = lead?.name?.toLowerCase() || ''
      const phone = convo.phone?.toLowerCase() || ''
      return name.includes(q) || phone.includes(q)
    })
  }, [conversations, searchQuery, getLeadForConvo])

  // ---- Send message ----
  const handleSend = async () => {
    if (!messageText.trim() || !selectedConvo) return
    setSending(true)
    try {
      await safeFetch(`${API_BASE}/api/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: selectedConvo.phone, message: messageText.trim() }),
      })
      showToast('Mensaje enviado', 'success')
      setMessageText('')
      // Reload conversations to see the new message
      await loadConversations()
      inputRef.current?.focus()
    } catch (err) {
      console.error('Error sending message:', err)
      showToast('Error al enviar mensaje', 'error')
    } finally {
      setSending(false)
    }
  }

  // ---- Quick replies ----
  const quickReplies = [
    'Gracias por tu mensaje',
    'Un asesor te contactara pronto',
    'Agenda una cita aqui',
  ]

  const handleQuickReply = (text: string) => {
    setMessageText(text)
    inputRef.current?.focus()
  }

  // ---- Select conversation ----
  const selectConvo = (convo: Conversation) => {
    setSelectedConvoId(convo.id)
    setMobileShowThread(true)
  }

  // ---- Format timestamp ----
  const formatTime = (ts: string) => {
    try {
      const d = new Date(ts)
      const now = new Date()
      const isToday = d.toDateString() === now.toDateString()
      if (isToday) return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      if (d.toDateString() === yesterday.toDateString()) return 'Ayer'
      return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
    } catch {
      return ''
    }
  }

  const formatFullTime = (ts: string) => {
    try {
      const d = new Date(ts)
      return d.toLocaleString('es-MX', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return ''
    }
  }

  // ---- Get role label ----
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'lead': return 'Cliente'
      case 'bot': return 'SARA Bot'
      case 'vendor': return 'Asesor'
      default: return role
    }
  }

  const selectedLead = selectedConvo ? getLeadForConvo(selectedConvo) : null

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-green-400" />
          <h1 className="text-lg font-bold text-white">WhatsApp Inbox</h1>
          <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
            {conversations.length} conversaciones
          </span>
        </div>
        <button
          onClick={() => { setLoadingConvos(true); loadConversations() }}
          className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white transition-colors"
          title="Actualizar"
        >
          <RefreshCw className={`w-4 h-4 ${loadingConvos ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* ---- LEFT PANEL: Conversation list ---- */}
        <div
          className={`${
            mobileShowThread ? 'hidden md:flex' : 'flex'
          } flex-col w-full md:w-80 lg:w-96 border-r border-slate-700/50 bg-slate-900`}
        >
          {/* Search */}
          <div className="p-3 border-b border-slate-700/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o telefono..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto">
            {loadingConvos && conversations.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
                Cargando conversaciones...
              </div>
            ) : filteredConvos.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-slate-400 text-sm gap-2">
                <MessageSquare className="w-8 h-8 text-slate-600" />
                {searchQuery ? 'Sin resultados' : 'Sin conversaciones'}
              </div>
            ) : (
              filteredConvos.map((convo) => {
                const lead = getLeadForConvo(convo)
                const lastMsg = convo.messages?.[convo.messages.length - 1]
                const unread = isUnread(convo)
                const isSelected = selectedConvoId === convo.id

                return (
                  <button
                    key={convo.id}
                    onClick={() => selectConvo(convo)}
                    className={`w-full flex items-start gap-3 p-3 border-b border-slate-800 text-left transition-colors ${
                      isSelected
                        ? 'bg-blue-600/20 border-l-2 border-l-blue-500'
                        : 'hover:bg-slate-800/70 border-l-2 border-l-transparent'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                        unread ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-300'
                      }`}>
                        {lead?.name?.charAt(0)?.toUpperCase() || <User className="w-4 h-4" />}
                      </div>
                      {unread && (
                        <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-900" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-sm truncate ${unread ? 'font-bold text-white' : 'font-medium text-slate-200'}`}>
                          {lead?.name || convo.phone}
                        </span>
                        <span className="text-[10px] text-slate-500 flex-shrink-0">
                          {lastMsg ? formatTime(lastMsg.timestamp) : formatTime(convo.updated_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        {lastMsg && (
                          <span className={`text-xs truncate ${unread ? 'text-slate-300' : 'text-slate-400'}`}>
                            {lastMsg.role !== 'lead' && (
                              <span className="text-slate-500">
                                {lastMsg.role === 'bot' ? 'Bot: ' : 'Tu: '}
                              </span>
                            )}
                            {lastMsg.content}
                          </span>
                        )}
                      </div>
                      {lead && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${getScoreColor(lead.score)} text-white`}>
                            {lead.score}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {STATUS_LABELS[lead.status] || lead.status}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* ---- RIGHT PANEL: Conversation thread ---- */}
        <div
          className={`${
            mobileShowThread ? 'flex' : 'hidden md:flex'
          } flex-col flex-1 bg-slate-900/50`}
        >
          {selectedConvo ? (
            <>
              {/* Conversation header */}
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-800/70 border-b border-slate-700/50">
                <button
                  onClick={() => { setMobileShowThread(false); setSelectedConvoId(null) }}
                  className="md:hidden p-1 rounded hover:bg-slate-700 text-slate-400"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                  selectedLead ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'
                }`}>
                  {selectedLead?.name?.charAt(0)?.toUpperCase() || <User className="w-4 h-4" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white truncate">
                      {selectedLead?.name || selectedConvo.phone}
                    </span>
                    {selectedLead && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${getScoreColor(selectedLead.score)} text-white`}>
                        {getScoreLabel(selectedLead.score)} ({selectedLead.score})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Phone className="w-3 h-3" />
                    <span>{selectedConvo.phone}</span>
                    {selectedLead && (
                      <>
                        <span className="text-slate-600">|</span>
                        <span>{STATUS_LABELS[selectedLead.status] || selectedLead.status}</span>
                      </>
                    )}
                    {selectedLead?.property_interest && (
                      <>
                        <span className="text-slate-600">|</span>
                        <span className="truncate">{selectedLead.property_interest}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {(!selectedConvo.messages || selectedConvo.messages.length === 0) ? (
                  <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                    Sin mensajes en esta conversacion
                  </div>
                ) : (
                  selectedConvo.messages.map((msg, idx) => {
                    const isLead = msg.role === 'lead'
                    const isBot = msg.role === 'bot'
                    const isVendor = msg.role === 'vendor'

                    return (
                      <div
                        key={idx}
                        className={`flex ${isLead ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-[75%] lg:max-w-[60%] rounded-2xl px-4 py-2.5 ${
                            isLead
                              ? 'bg-blue-600/90 text-white rounded-bl-md'
                              : isVendor
                              ? 'bg-green-700/80 text-white rounded-br-md'
                              : 'bg-slate-700/80 text-slate-200 rounded-br-md'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-semibold ${
                              isLead ? 'text-blue-200' : isVendor ? 'text-green-200' : 'text-slate-400'
                            }`}>
                              {getRoleLabel(msg.role)}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                          <div className={`text-[10px] mt-1 text-right ${
                            isLead ? 'text-blue-300' : isVendor ? 'text-green-300' : 'text-slate-500'
                          }`}>
                            {formatFullTime(msg.timestamp)}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick replies */}
              <div className="px-4 py-2 border-t border-slate-700/30 flex items-center gap-2 overflow-x-auto">
                {quickReplies.map((text) => (
                  <button
                    key={text}
                    onClick={() => handleQuickReply(text)}
                    className="flex-shrink-0 text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full border border-slate-700 transition-colors"
                  >
                    {text}
                  </button>
                ))}
              </div>

              {/* Input */}
              <div className="px-4 py-3 bg-slate-800/50 border-t border-slate-700/50">
                <div className="flex items-end gap-2">
                  <textarea
                    ref={inputRef}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSend()
                      }
                    }}
                    placeholder="Escribe un mensaje..."
                    rows={1}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 resize-none transition-colors"
                    style={{ maxHeight: '120px' }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={sending || !messageText.trim()}
                    className={`p-2.5 rounded-xl transition-colors ${
                      messageText.trim()
                        ? 'bg-green-600 hover:bg-green-500 text-white'
                        : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Send className={`w-5 h-5 ${sending ? 'animate-pulse' : ''}`} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-3">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-slate-600" />
              </div>
              <p className="text-sm">Selecciona una conversacion para ver los mensajes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
