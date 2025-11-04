import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Mail, Phone, User, Search, Filter, Clock,
  Send, Paperclip, Smile, MoreVertical, Archive, Trash2,
  Tag, CheckCheck, Circle, Star, AlertCircle, Plus, X,
  Loader2, CheckCircle2, XCircle, RefreshCw, Zap, FileText,
  Sparkles, Users, Calendar, History, TrendingUp, Activity,
  Download, Settings, Bell, ChevronDown, Inbox
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToastContext } from '../contexts/ToastContext';
import { env } from '../lib/env';

interface Contact {
  id: string;
  full_name: string;
  email: string;
  phone: string;
}

interface Conversation {
  id: string;
  contact_id: string;
  subject: string;
  status: string;
  channel: string;
  last_message_at: string;
  last_message_preview?: string;
  unread_count: number;
  contact: Contact;
}

interface Appointment {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes?: string;
}

interface ContactHistory {
  appointments: Appointment[];
  messages_count: number;
  last_appointment?: string;
  next_appointment?: string;
  tags: string[];
}

interface Message {
  id: string;
  conversation_id: string;
  channel: string;
  direction: string;
  from_address: string;
  to_address: string;
  subject: string | null;
  body: string;
  status: string;
  sent_at: string;
  read_at: string | null;
  created_at: string;
  twilio_message_sid?: string;
  metadata?: any;
}

interface MessageTemplate {
  id: string;
  name: string;
  category: string;
  channel: string;
  subject: string | null;
  body: string;
  variables: string[];
  is_system: boolean;
  usage_count: number;
}

interface QuickReply {
  id: string;
  shortcut: string;
  text: string;
  channel: string;
  usage_count: number;
}

export function UnifiedCommunications() {
  const toast = useToastContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [newMessageChannel, setNewMessageChannel] = useState<'sms' | 'email'>('sms');
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [showBulkSend, setShowBulkSend] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [bulkMessage, setBulkMessage] = useState('');
  const [bulkChannel, setBulkChannel] = useState<'sms' | 'email'>('sms');
  const [contactHistory, setContactHistory] = useState<ContactHistory | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv'>('pdf');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadConversations();
    loadContacts();
    loadTemplates();
    loadQuickReplies();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      loadContactHistory(selectedConversation.contact_id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          contact:contacts(id, full_name, email, phone)
        `)
        .eq('owner_id', user.id)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast.error('Erreur lors du chargement des conversations');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('conversation_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadContacts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('contacts')
        .select('id, full_name, email, phone')
        .eq('owner_id', user.id)
        .order('full_name');

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .eq('owner_id', user.id)
        .order('usage_count', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const loadQuickReplies = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('quick_replies')
        .select('*')
        .eq('owner_id', user.id)
        .order('shortcut');

      if (error) throw error;
      setQuickReplies(data || []);
    } catch (error) {
      console.error('Error loading quick replies:', error);
    }
  };

  const loadContactHistory = async (contactId: string) => {
    try {
      setLoadingHistory(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: appointments, error: apptError } = await supabase
        .from('appointments')
        .select('id, appointment_date, start_time, end_time, status, notes')
        .eq('contact_id', contactId)
        .eq('owner_id', user.id)
        .order('appointment_date', { ascending: false })
        .limit(10);

      if (apptError) throw apptError;

      const { count: messagesCount } = await supabase
        .from('conversation_messages')
        .select('id', { count: 'exact', head: true })
        .eq('contact_id', contactId);

      const now = new Date().toISOString();
      const pastAppointments = appointments?.filter(a => a.appointment_date < now) || [];
      const futureAppointments = appointments?.filter(a => a.appointment_date >= now) || [];

      setContactHistory({
        appointments: appointments || [],
        messages_count: messagesCount || 0,
        last_appointment: pastAppointments[0]?.appointment_date,
        next_appointment: futureAppointments[0]?.appointment_date,
        tags: []
      });
    } catch (error) {
      console.error('Error loading contact history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const sendMessage = async () => {
    if (!selectedConversation || !messageInput.trim() || sending) return;

    try {
      setSending(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (selectedConversation.channel === 'sms') {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('No session');

        const response = await fetch(`${env.supabaseUrl}/functions/v1/send-sms-twilio`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: selectedConversation.contact.phone,
            body: messageInput,
            contactId: selectedConversation.contact_id
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || 'Failed to send SMS');
        }
      }

      toast.success('Message envoyé avec succès');
      setMessageInput('');
      await loadMessages(selectedConversation.id);
    } catch (error: any) {
      console.error('Send message error:', error);
      toast.error(error.message || 'Erreur lors de l\'envoi du message');
    } finally {
      setSending(false);
    }
  };

  const createNewConversation = async () => {
    if (!selectedContact) {
      toast.error('Veuillez sélectionner un contact');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const existingConv = conversations.find(
        c => c.contact_id === selectedContact.id && c.channel === newMessageChannel
      );

      if (existingConv) {
        setSelectedConversation(existingConv);
        setShowNewConversation(false);
        toast.info('Conversation déjà existante');
        return;
      }

      const { data, error } = await supabase
        .from('conversations')
        .insert({
          contact_id: selectedContact.id,
          owner_id: user.id,
          channel: newMessageChannel,
          status: 'active',
          subject: `Conversation ${newMessageChannel} avec ${selectedContact.full_name}`,
          last_message_at: new Date().toISOString()
        })
        .select(`
          *,
          contact:contacts(id, full_name, email, phone)
        `)
        .single();

      if (error) throw error;

      setConversations([data, ...conversations]);
      setSelectedConversation(data);
      setShowNewConversation(false);
      toast.success('Nouvelle conversation créée');
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error('Erreur lors de la création de la conversation');
    }
  };

  const applyTemplate = (template: MessageTemplate) => {
    let body = template.body;

    if (selectedConversation?.contact) {
      body = body.replace(/{{patient_name}}/g, selectedConversation.contact.full_name);
    }

    setMessageInput(body);
    setShowTemplates(false);
    toast.success(`Template "${template.name}" appliqué`);

    supabase
      .from('message_templates')
      .update({ usage_count: template.usage_count + 1 })
      .eq('id', template.id)
      .then(() => loadTemplates());
  };

  const applyQuickReply = (quickReply: QuickReply) => {
    setMessageInput(messageInput + (messageInput ? ' ' : '') + quickReply.text);
    setShowQuickReplies(false);

    supabase
      .from('quick_replies')
      .update({ usage_count: quickReply.usage_count + 1 })
      .eq('id', quickReply.id)
      .then(() => loadQuickReplies());
  };

  const sendBulkMessage = async () => {
    if (!bulkMessage.trim() || selectedContacts.length === 0) {
      toast.error('Sélectionnez des contacts et écrivez un message');
      return;
    }

    try {
      setSending(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      let successCount = 0;
      let errorCount = 0;

      for (const contact of selectedContacts) {
        try {
          if (bulkChannel === 'sms') {
            if (!contact.phone || contact.phone.trim() === '') {
              errorCount++;
              continue;
            }

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) continue;

            const response = await fetch(`${env.supabaseUrl}/functions/v1/send-sms-twilio`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                to: contact.phone,
                body: bulkMessage,
                contactId: contact.id
              })
            });

            if (response.ok) {
              successCount++;
            } else {
              errorCount++;
              console.error(`Failed to send to ${contact.full_name}`);
            }
          } else {
            if (!contact.email || contact.email.trim() === '') {
              errorCount++;
              continue;
            }
            successCount++;
          }

          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (err) {
          errorCount++;
        }
      }

      toast.success(`${successCount} messages envoyés, ${errorCount} échecs`);
      setShowBulkSend(false);
      setBulkMessage('');
      setSelectedContacts([]);
    } catch (error: any) {
      console.error('Bulk send error:', error);
      toast.error('Erreur lors de l\'envoi groupé');
    } finally {
      setSending(false);
    }
  };

  const toggleContactSelection = (contact: Contact) => {
    setSelectedContacts(prev => {
      const exists = prev.find(c => c.id === contact.id);
      if (exists) {
        return prev.filter(c => c.id !== contact.id);
      } else {
        return [...prev, contact];
      }
    });
  };

  const exportConversation = async () => {
    if (!selectedConversation) return;

    try {
      setExporting(true);

      if (exportFormat === 'csv') {
        const csvContent = [
          ['Date', 'Heure', 'Direction', 'Canal', 'De', 'À', 'Message'],
          ...messages.map(msg => [
            new Date(msg.created_at).toLocaleDateString('fr-FR'),
            new Date(msg.created_at).toLocaleTimeString('fr-FR'),
            msg.direction === 'outbound' ? 'Envoyé' : 'Reçu',
            msg.channel === 'sms' ? 'SMS' : 'Email',
            msg.from_address,
            msg.to_address,
            msg.body.replace(/\n/g, ' ')
          ])
        ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `conversation_${selectedConversation.contact.full_name}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
      } else {
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Conversation - ${selectedConversation.contact.full_name}</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
              h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
              .info { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; }
              .message { margin: 15px 0; padding: 15px; border-radius: 8px; }
              .outbound { background: #dbeafe; border-left: 4px solid #2563eb; }
              .inbound { background: #f3f4f6; border-left: 4px solid #6b7280; }
              .meta { font-size: 12px; color: #6b7280; margin-top: 8px; }
              .body { margin-top: 8px; white-space: pre-wrap; }
            </style>
          </head>
          <body>
            <h1>Conversation avec ${selectedConversation.contact.full_name}</h1>
            <div class="info">
              <p><strong>Canal:</strong> ${selectedConversation.channel === 'sms' ? 'SMS' : 'Email'}</p>
              <p><strong>Contact:</strong> ${selectedConversation.contact.email || selectedConversation.contact.phone}</p>
              <p><strong>Exporté le:</strong> ${new Date().toLocaleString('fr-FR')}</p>
              <p><strong>Nombre de messages:</strong> ${messages.length}</p>
            </div>
            ${messages.map(msg => `
              <div class="message ${msg.direction}">
                <div class="meta">
                  <strong>${msg.direction === 'outbound' ? 'Vous' : selectedConversation.contact.full_name}</strong> •
                  ${new Date(msg.created_at).toLocaleString('fr-FR')}
                </div>
                <div class="body">${msg.body}</div>
              </div>
            `).join('')}
          </body>
          </html>
        `;

        const blob = new Blob([htmlContent], { type: 'text/html' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `conversation_${selectedConversation.contact.full_name}_${new Date().toISOString().split('T')[0]}.html`;
        link.click();
      }

      toast.success(`Conversation exportée en ${exportFormat.toUpperCase()}`);
      setShowExport(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erreur lors de l\'export');
    } finally {
      setExporting(false);
    }
  };

  const getChannelIcon = (channel: string) => {
    return channel === 'sms' ? <Phone className="w-3 h-3" /> : <Mail className="w-3 h-3" />;
  };

  const filteredConversations = conversations.filter(conv => {
    if (channelFilter !== 'all' && conv.channel !== channelFilter) return false;

    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || (
      conv.contact?.full_name?.toLowerCase().includes(searchLower) ||
      conv.contact?.email?.toLowerCase().includes(searchLower) ||
      conv.contact?.phone?.includes(searchQuery) ||
      conv.subject?.toLowerCase().includes(searchLower)
    );

    const matchesStatus = statusFilter === 'all' || conv.status === statusFilter;

    let matchesDate = true;
    if (dateFilter !== 'all') {
      const convDate = new Date(conv.last_message_at);
      const now = new Date();

      if (dateFilter === 'today') {
        matchesDate = convDate.toDateString() === now.toDateString();
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = convDate >= weekAgo;
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        matchesDate = convDate >= monthAgo;
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const filteredContacts = contacts.filter(contact => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      contact.full_name?.toLowerCase().includes(searchLower) ||
      contact.email?.toLowerCase().includes(searchLower) ||
      contact.phone?.includes(searchQuery)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header - Professional & Clean */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
                  Communications PRO v2.0
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  Interface professionnelle - Layout 3 colonnes
                </p>
              </div>
              <span className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-bold rounded-full shadow-lg animate-pulse">
                NOUVELLE VERSION
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowBulkSend(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
              >
                <Users className="w-4 h-4" />
                Envoi groupé
              </button>
              <button
                onClick={() => setShowNewConversation(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Nouveau
              </button>
            </div>
          </div>
        </div>

        {/* Main Content - 3 Column Layout */}
        <div className="grid grid-cols-12 gap-4">
          {/* Left Sidebar - Conversations List */}
          <div className="col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[calc(100vh-180px)]">
            {/* Search & Filters */}
            <div className="p-4 border-b border-slate-100 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setChannelFilter('all')}
                  className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    channelFilter === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Tous
                </button>
                <button
                  onClick={() => setChannelFilter('sms')}
                  className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    channelFilter === 'sms'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  SMS
                </button>
                <button
                  onClick={() => setChannelFilter('email')}
                  className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    channelFilter === 'email'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Email
                </button>
              </div>

              <div className="flex gap-2">
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="flex-1 px-2 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Toutes dates</option>
                  <option value="today">Aujourd'hui</option>
                  <option value="week">7 jours</option>
                  <option value="month">30 jours</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex-1 px-2 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tous statuts</option>
                  <option value="active">Actifs</option>
                  <option value="archived">Archivés</option>
                </select>
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                    <Inbox className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-900">Aucune conversation</p>
                  <p className="text-xs text-slate-500 mt-1">Créez-en une pour commencer</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredConversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`w-full p-4 text-left transition-colors ${
                        selectedConversation?.id === conv.id
                          ? 'bg-blue-50 border-l-2 border-l-blue-600'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-700 font-medium text-sm flex-shrink-0">
                          {conv.contact?.full_name?.[0]?.toUpperCase() || 'P'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-slate-900 truncate">
                              {conv.contact?.full_name || 'Patient'}
                            </span>
                            <div className="flex items-center gap-1.5 ml-2">
                              <div className={`p-0.5 rounded ${
                                conv.channel === 'sms' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                                {getChannelIcon(conv.channel)}
                              </div>
                              {conv.unread_count > 0 && (
                                <span className="px-1.5 py-0.5 text-xs font-medium bg-red-500 text-white rounded-full">
                                  {conv.unread_count}
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-slate-500 truncate mb-1">
                            {conv.last_message_preview || 'Aucun message'}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Clock className="w-3 h-3" />
                            {new Date(conv.last_message_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Center - Messages */}
          <div className="col-span-6 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[calc(100vh-180px)]">
            {selectedConversation ? (
              <>
                {/* Conversation Header */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-700 font-medium">
                      {selectedConversation.contact?.full_name?.[0]?.toUpperCase() || 'P'}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-slate-900">
                        {selectedConversation.contact?.full_name || 'Patient'}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {selectedConversation.channel === 'sms'
                          ? selectedConversation.contact?.phone
                          : selectedConversation.contact?.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowExport(true)}
                      className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Exporter"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => loadMessages(selectedConversation.id)}
                      className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] ${
                          message.direction === 'outbound'
                            ? 'bg-blue-600 text-white rounded-2xl rounded-br-md'
                            : 'bg-slate-100 text-slate-900 rounded-2xl rounded-bl-md'
                        } px-4 py-2.5 shadow-sm`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.body}</p>
                        <div className={`flex items-center gap-1.5 mt-1.5 text-xs ${
                          message.direction === 'outbound' ? 'text-blue-100' : 'text-slate-500'
                        }`}>
                          <Clock className="w-3 h-3" />
                          {new Date(message.created_at).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                          {message.direction === 'outbound' && (
                            <CheckCheck className="w-3 h-3 ml-1" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-slate-100">
                  {/* Quick Actions */}
                  <div className="flex items-center gap-2 mb-3">
                    <button
                      onClick={() => setShowTemplates(!showTemplates)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Templates
                    </button>
                    <button
                      onClick={() => setShowQuickReplies(!showQuickReplies)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Réponses rapides
                    </button>
                  </div>

                  {/* Templates Dropdown */}
                  {showTemplates && templates.length > 0 && (
                    <div className="mb-3 p-3 bg-slate-50 rounded-lg border border-slate-200 max-h-48 overflow-y-auto">
                      <div className="grid grid-cols-2 gap-2">
                        {templates
                          .filter(t => t.channel === selectedConversation.channel || t.channel === 'both')
                          .map(template => (
                          <button
                            key={template.id}
                            onClick={() => applyTemplate(template)}
                            className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-left transition-colors"
                          >
                            <div className="text-xs font-medium text-slate-900 mb-1">
                              {template.name}
                            </div>
                            <div className="text-xs text-slate-500 line-clamp-1">
                              {template.body.substring(0, 50)}...
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Replies */}
                  {showQuickReplies && quickReplies.length > 0 && (
                    <div className="mb-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex flex-wrap gap-1.5">
                        {quickReplies
                          .filter(qr => qr.channel === selectedConversation.channel || qr.channel === 'both')
                          .map(reply => (
                          <button
                            key={reply.id}
                            onClick={() => applyQuickReply(reply)}
                            className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-md text-xs transition-colors"
                          >
                            <span className="font-mono text-slate-600 mr-1">{reply.shortcut}</span>
                            <span className="text-slate-900">{reply.text.substring(0, 20)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Input Area */}
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <textarea
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                        placeholder={`Écrivez votre ${selectedConversation.channel === 'sms' ? 'SMS' : 'email'}...`}
                        rows={2}
                        disabled={sending}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50 disabled:bg-slate-50"
                      />
                      {selectedConversation.channel === 'sms' && (
                        <p className="text-xs text-slate-400 mt-1">
                          {messageInput.length} caractères • {Math.ceil(messageInput.length / 160)} SMS
                        </p>
                      )}
                    </div>
                    <button
                      onClick={sendMessage}
                      disabled={!messageInput.trim() || sending}
                      className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      {sending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                    <MessageSquare className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-base font-medium text-slate-900 mb-1">Sélectionnez une conversation</p>
                  <p className="text-sm text-slate-500">Ou créez-en une nouvelle</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar - Contact History */}
          {selectedConversation && (
            <div className="col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-[calc(100vh-180px)]">
              <div className="p-4 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-600" />
                  Historique
                </h3>
              </div>

              <div className="overflow-y-auto h-[calc(100%-60px)]">
                {loadingHistory ? (
                  <div className="flex items-center justify-center h-40">
                    <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                  </div>
                ) : contactHistory ? (
                  <div className="p-4 space-y-3">
                    {/* Stats Card */}
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-3.5 h-3.5 text-slate-600" />
                        <span className="text-xs font-semibold text-slate-900">Statistiques</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600">Messages</span>
                          <span className="font-semibold text-slate-900">{contactHistory.messages_count}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600">Rendez-vous</span>
                          <span className="font-semibold text-slate-900">{contactHistory.appointments.length}</span>
                        </div>
                      </div>
                    </div>

                    {/* Next Appointment */}
                    {contactHistory.next_appointment && (
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Calendar className="w-3.5 h-3.5 text-green-700" />
                          <span className="text-xs font-semibold text-green-900">Prochain RDV</span>
                        </div>
                        <p className="text-xs text-green-800">
                          {new Date(contactHistory.next_appointment).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    )}

                    {/* Last Appointment */}
                    {contactHistory.last_appointment && (
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-600" />
                          <span className="text-xs font-semibold text-slate-900">Dernier RDV</span>
                        </div>
                        <p className="text-xs text-slate-700">
                          {new Date(contactHistory.last_appointment).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    )}

                    {/* Appointments History */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-3.5 h-3.5 text-slate-600" />
                        <span className="text-xs font-semibold text-slate-900">Historique RDV</span>
                      </div>
                      <div className="space-y-2">
                        {contactHistory.appointments.slice(0, 5).map((appt) => (
                          <div
                            key={appt.id}
                            className="p-2.5 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                                appt.status === 'completed' ? 'bg-green-100 text-green-700' :
                                appt.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                                appt.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {appt.status === 'completed' ? 'Complété' :
                                 appt.status === 'confirmed' ? 'Confirmé' :
                                 appt.status === 'cancelled' ? 'Annulé' : appt.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600">
                              {new Date(appt.appointment_date).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short'
                              })} à {appt.start_time}
                            </p>
                            {appt.notes && (
                              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{appt.notes}</p>
                            )}
                          </div>
                        ))}
                        {contactHistory.appointments.length === 0 && (
                          <p className="text-xs text-slate-400 text-center py-4">Aucun rendez-vous</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                    <Activity className="w-10 h-10 mb-2" />
                    <p className="text-xs">Aucun historique</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal - Nouvelle Conversation */}
      <AnimatePresence>
        {showNewConversation && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
              onClick={() => setShowNewConversation(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Nouvelle conversation
                  </h3>
                  <button
                    onClick={() => setShowNewConversation(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Sélectionner un contact
                  </label>
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Rechercher un contact..."
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
                    {filteredContacts.length === 0 ? (
                      <div className="p-4 text-center text-sm text-slate-500">
                        Aucun contact trouvé
                      </div>
                    ) : (
                      filteredContacts.map(contact => (
                        <button
                          key={contact.id}
                          onClick={() => setSelectedContact(contact)}
                          className={`w-full p-3 text-left hover:bg-slate-50 transition-colors ${
                            selectedContact?.id === contact.id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="font-medium text-sm text-slate-900">{contact.full_name}</div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {contact.phone || contact.email}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Type de conversation
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setNewMessageChannel('sms')}
                      className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                        newMessageChannel === 'sms'
                          ? 'border-blue-600 bg-blue-50 text-blue-900'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <Phone className="w-5 h-5 mx-auto mb-1" />
                      <div className="text-xs font-medium">SMS</div>
                    </button>
                    <button
                      onClick={() => setNewMessageChannel('email')}
                      className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                        newMessageChannel === 'email'
                          ? 'border-blue-600 bg-blue-50 text-blue-900'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <Mail className="w-5 h-5 mx-auto mb-1" />
                      <div className="text-xs font-medium">Email</div>
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
                <button
                  onClick={() => setShowNewConversation(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={createNewConversation}
                  disabled={!selectedContact}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Créer
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal - Envoi Groupé */}
      <AnimatePresence>
        {showBulkSend && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
              onClick={() => setShowBulkSend(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-xl shadow-2xl z-50 overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      Envoi groupé
                    </h3>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {selectedContacts.length} contact(s) sélectionné(s)
                    </p>
                  </div>
                  <button
                    onClick={() => setShowBulkSend(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Type de message
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setBulkChannel('sms')}
                      className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                        bulkChannel === 'sms'
                          ? 'border-blue-600 bg-blue-50 text-blue-900'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <Phone className="w-5 h-5 mx-auto mb-1" />
                      <div className="text-xs font-medium">SMS</div>
                    </button>
                    <button
                      onClick={() => setBulkChannel('email')}
                      className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                        bulkChannel === 'email'
                          ? 'border-blue-600 bg-blue-50 text-blue-900'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <Mail className="w-5 h-5 mx-auto mb-1" />
                      <div className="text-xs font-medium">Email</div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Sélectionner les contacts
                  </label>
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Rechercher..."
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="border border-slate-200 rounded-lg max-h-64 overflow-y-auto">
                    {filteredContacts
                      .filter(c => bulkChannel === 'sms' ? c.phone : c.email)
                      .map(contact => (
                        <label
                          key={contact.id}
                          className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0"
                        >
                          <input
                            type="checkbox"
                            checked={selectedContacts.some(c => c.id === contact.id)}
                            onChange={() => toggleContactSelection(contact)}
                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-2 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-slate-900">
                              {contact.full_name}
                            </div>
                            <div className="text-xs text-slate-500">
                              {bulkChannel === 'sms' ? contact.phone : contact.email}
                            </div>
                          </div>
                        </label>
                      ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Message
                  </label>
                  <textarea
                    value={bulkMessage}
                    onChange={(e) => setBulkMessage(e.target.value)}
                    placeholder={`Écrivez votre ${bulkChannel === 'sms' ? 'SMS' : 'email'}...`}
                    rows={6}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  {bulkChannel === 'sms' && (
                    <p className="text-xs text-slate-500 mt-1">
                      {bulkMessage.length} caractères • {Math.ceil(bulkMessage.length / 160)} SMS par contact
                    </p>
                  )}
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
                <button
                  onClick={() => setShowBulkSend(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={sendBulkMessage}
                  disabled={selectedContacts.length === 0 || !bulkMessage.trim() || sending}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Envoyer à {selectedContacts.length} contact(s)
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal - Export */}
      <AnimatePresence>
        {showExport && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
              onClick={() => setShowExport(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Exporter la conversation
                  </h3>
                  <button
                    onClick={() => setShowExport(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Format d'export
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-4 border-2 border-slate-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors">
                      <input
                        type="radio"
                        name="exportFormat"
                        value="pdf"
                        checked={exportFormat === 'pdf'}
                        onChange={(e) => setExportFormat(e.target.value as 'pdf')}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-900">HTML</div>
                        <div className="text-xs text-slate-500">Format web lisible</div>
                      </div>
                      <FileText className="w-5 h-5 text-slate-400" />
                    </label>

                    <label className="flex items-center gap-3 p-4 border-2 border-slate-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors">
                      <input
                        type="radio"
                        name="exportFormat"
                        value="csv"
                        checked={exportFormat === 'csv'}
                        onChange={(e) => setExportFormat(e.target.value as 'csv')}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-900">CSV</div>
                        <div className="text-xs text-slate-500">Pour Excel / Google Sheets</div>
                      </div>
                      <FileText className="w-5 h-5 text-slate-400" />
                    </label>
                  </div>
                </div>

                {selectedConversation && (
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="text-xs text-slate-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Contact:</span>
                        <span className="font-medium text-slate-900">
                          {selectedConversation.contact.full_name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Messages:</span>
                        <span className="font-medium text-slate-900">{messages.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Canal:</span>
                        <span className="font-medium text-slate-900">
                          {selectedConversation.channel === 'sms' ? 'SMS' : 'Email'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
                <button
                  onClick={() => setShowExport(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={exportConversation}
                  disabled={exporting}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                  {exporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Export...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Exporter
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
