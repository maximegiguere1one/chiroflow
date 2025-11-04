import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Mail, Phone, User, Search, Filter, Clock,
  Send, Paperclip, Smile, MoreVertical, Archive, Trash2,
  Tag, CheckCheck, Circle, Star, AlertCircle, Plus, X,
  Loader2, CheckCircle2, XCircle, RefreshCw, Zap, FileText,
  Sparkles, Users, Calendar, History, TrendingUp, Activity,
  Download
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToastContext } from '../contexts/ToastContext';

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
}

interface QuickReply {
  id: string;
  shortcut: string;
  text: string;
  channel: string;
}

export function UnifiedCommunications10X() {
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

    const channel = supabase
      .channel('conversations-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversations'
      }, () => {
        loadConversations();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversation_messages'
      }, (payload) => {
        if (selectedConversation && payload.new.conversation_id === selectedConversation.id) {
          loadMessages(selectedConversation.id);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelFilter]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      loadContactHistory(selectedConversation.contact_id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  const loadConversations = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('conversations')
        .select(`
          *,
          contact:contacts!conversations_contact_id_fkey (
            id,
            full_name,
            email,
            phone
          )
        `)
        .eq('owner_id', user.id)
        .eq('status', 'active')
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (channelFilter !== 'all') {
        query = query.eq('channel', channelFilter);
      }

      const { data, error } = await query;

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

      await supabase
        .from('conversations')
        .update({ unread_count: 0 })
        .eq('id', conversationId);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Erreur lors du chargement des messages');
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation) return;

    try {
      setSending(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const channel = selectedConversation.channel;

      if (channel === 'sms') {
        if (!selectedConversation.contact.phone || selectedConversation.contact.phone.trim() === '') {
          toast.error('❌ Ce contact n\'a pas de numéro de téléphone. Créez une conversation Email à la place.');
          setSending(false);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('Session expirée. Reconnectez-vous.');
        }

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

        console.log('📤 Envoi SMS:', {
          to: selectedConversation.contact.phone,
          conversationId: selectedConversation.id,
          contactId: selectedConversation.contact_id,
          messageLength: messageInput.length
        });

        const response = await fetch(`${supabaseUrl}/functions/v1/send-sms-twilio`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: selectedConversation.contact.phone,
            body: messageInput,
            conversationId: selectedConversation.id,
            contactId: selectedConversation.contact_id
          })
        });

        const result = await response.json();

        console.log('📥 Réponse SMS:', {
          status: response.status,
          ok: response.ok,
          result
        });

        if (!response.ok) {
          const errorMessage = result.error || 'Erreur lors de l\'envoi du SMS';
          console.error('❌ SMS send error:', { status: response.status, error: errorMessage, result });
          throw new Error(errorMessage);
        }

        if (!result.success) {
          console.error('❌ SMS not successful:', result);
          throw new Error(result.error || 'Échec de l\'envoi du SMS');
        }

        console.log('✅ SMS envoyé:', {
          twilioSid: result.twilioSid,
          messageId: result.messageId,
          conversationId: result.conversationId
        });

        toast.success('✅ SMS envoyé avec succès!');
        setMessageInput('');
        await Promise.all([
          loadMessages(selectedConversation.id),
          loadConversations()
        ]);
      } else {
        const newMessage = {
          conversation_id: selectedConversation.id,
          contact_id: selectedConversation.contact_id,
          channel: 'email',
          direction: 'outbound',
          from_address: user.email,
          to_address: selectedConversation.contact.email,
          body: messageInput,
          status: 'sent',
          owner_id: user.id,
          sent_at: new Date().toISOString()
        };

        const { data, error } = await supabase
          .from('conversation_messages')
          .insert(newMessage)
          .select()
          .single();

        if (error) throw error;

        setMessages([...messages, data]);
        setMessageInput('');
        toast.success('✅ Email envoyé!');
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Erreur lors de l\'envoi');
    } finally {
      setSending(false);
    }
  };

  const startNewConversation = async () => {
    if (!selectedContact) {
      toast.error('Sélectionnez un contact');
      return;
    }

    if (newMessageChannel === 'sms' && (!selectedContact.phone || selectedContact.phone.trim() === '')) {
      toast.error('❌ Ce contact n\'a pas de numéro de téléphone. Ajoutez-en un ou choisissez Email.');
      return;
    }

    if (newMessageChannel === 'email' && (!selectedContact.email || selectedContact.email.trim() === '')) {
      toast.error('❌ Ce contact n\'a pas d\'adresse email. Ajoutez-en une ou choisissez SMS.');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Non authentifié');
        return;
      }

      const { data: existing } = await supabase
        .from('conversations')
        .select('*')
        .eq('contact_id', selectedContact.id)
        .eq('owner_id', user.id)
        .eq('channel', newMessageChannel)
        .eq('status', 'active')
        .maybeSingle();

      if (existing) {
        setSelectedConversation({
          ...existing,
          contact: selectedContact
        });
        setShowNewConversation(false);
        toast.info('Conversation existante ouverte');
        return;
      }

      const { data: newConv, error } = await supabase
        .from('conversations')
        .insert({
          contact_id: selectedContact.id,
          owner_id: user.id,
          subject: `${newMessageChannel.toUpperCase()} avec ${selectedContact.full_name}`,
          status: 'active',
          channel: newMessageChannel,
          last_message_at: new Date().toISOString(),
          unread_count: 0
        })
        .select()
        .single();

      if (error) throw error;

      setSelectedConversation({
        ...newConv,
        contact: selectedContact
      });
      setShowNewConversation(false);
      await loadConversations();
      toast.success('Nouvelle conversation créée!');
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error('Erreur lors de la création');
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'sms': return <Phone className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'sent':
        return <CheckCheck className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  const filteredConversations = conversations.filter(conv => {
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

            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const response = await fetch(`${supabaseUrl}/functions/v1/send-sms-twilio`, {
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

            if (response.ok) successCount++;
            else errorCount++;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50">
      <div className="max-w-[1800px] mx-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <Zap className="w-8 h-8 text-blue-500" />
              Communications 10X
            </h1>
            <p className="text-gray-600">
              Système unifié SMS + Email ultra-performant
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowBulkSend(true)}
              className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              <Users className="w-5 h-5" />
              Envoi groupé
            </button>
            <button
              onClick={() => setShowNewConversation(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              Nouvelle conversation
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-220px)]">
          <div className="col-span-4 bg-white rounded-2xl shadow-lg border border-gray-200 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200 space-y-3 bg-gradient-to-r from-blue-50 to-white">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="space-y-2">
                <div className="flex gap-2">
                  {[
                    { value: 'all', label: 'Tous', icon: MessageSquare },
                    { value: 'sms', label: 'SMS', icon: Phone },
                    { value: 'email', label: 'Email', icon: Mail }
                  ].map((filter) => (
                    <button
                      key={filter.value}
                      onClick={() => setChannelFilter(filter.value)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                        channelFilter === filter.value
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <filter.icon className="w-4 h-4" />
                      {filter.label}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Toutes les dates</option>
                    <option value="today">Aujourd'hui</option>
                    <option value="week">Cette semaine</option>
                    <option value="month">Ce mois</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="active">Actifs</option>
                    <option value="archived">Archivés</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="font-medium">Aucune conversation</p>
                  <p className="text-sm">Créez-en une pour commencer</p>
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <motion.button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full p-4 border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent transition-all text-left ${
                      selectedConversation?.id === conv.id
                        ? 'bg-gradient-to-r from-blue-100 to-blue-50 border-l-4 border-l-blue-500'
                        : ''
                    }`}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0">
                        {conv.contact?.full_name?.[0]?.toUpperCase() || 'P'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-gray-900 truncate">
                            {conv.contact?.full_name || 'Patient'}
                          </span>
                          <div className="flex items-center gap-2">
                            <div className={`p-1 rounded-md ${
                              conv.channel === 'sms' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                            }`}>
                              {getChannelIcon(conv.channel)}
                            </div>
                            {conv.unread_count > 0 && (
                              <span className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                                {conv.unread_count}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 truncate mb-1">
                          {conv.last_message_preview || 'Aucun message'}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
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
                  </motion.button>
                ))
              )}
            </div>
          </div>

          <div className="col-span-6 bg-white rounded-2xl shadow-lg border border-gray-200 flex flex-col overflow-hidden">
            {selectedConversation ? (
              <>
                <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 via-white to-blue-50">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
                      {selectedConversation.contact?.full_name?.[0]?.toUpperCase() || 'P'}
                    </div>
                    <div>
                      <h2 className="font-bold text-gray-900 text-lg">
                        {selectedConversation.contact?.full_name || 'Patient'}
                      </h2>
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        {selectedConversation.channel === 'sms' ? (
                          <>
                            <Phone className="w-4 h-4 text-green-600" />
                            {selectedConversation.contact?.phone}
                          </>
                        ) : (
                          <>
                            <Mail className="w-4 h-4 text-blue-600" />
                            {selectedConversation.contact?.email}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowExport(true)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Exporter la conversation"
                    >
                      <Download className="w-5 h-5 text-gray-600" />
                    </button>
                    <button
                      onClick={() => loadMessages(selectedConversation.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <RefreshCw className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50/30 to-white">
                  <AnimatePresence>
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[75%] ${msg.direction === 'outbound' ? 'order-2' : 'order-1'}`}>
                          <div
                            className={`rounded-2xl px-5 py-3 shadow-sm ${
                              msg.direction === 'outbound'
                                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-sm'
                                : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'
                            }`}
                          >
                            {msg.subject && (
                              <p className="font-semibold mb-2 pb-2 border-b border-white/20">{msg.subject}</p>
                            )}
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                          </div>
                          <div className="flex items-center gap-2 mt-2 px-2 text-xs text-gray-500">
                            <span>
                              {new Date(msg.created_at).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            {msg.direction === 'outbound' && getStatusIcon(msg.status)}
                            {msg.twilio_message_sid && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Twilio</span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex items-center gap-2 mb-3">
                    <button
                      onClick={() => setShowTemplates(!showTemplates)}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium transition-all"
                    >
                      <FileText className="w-4 h-4" />
                      Templates ({templates.length})
                    </button>
                    <button
                      onClick={() => setShowQuickReplies(!showQuickReplies)}
                      className="flex items-center gap-2 px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-sm font-medium transition-all"
                    >
                      <Sparkles className="w-4 h-4" />
                      Réponses rapides
                    </button>
                  </div>

                  {showTemplates && templates.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200 max-h-48 overflow-y-auto"
                    >
                      <div className="grid grid-cols-2 gap-2">
                        {templates
                          .filter(t => t.channel === selectedConversation.channel || t.channel === 'both')
                          .map(template => (
                          <button
                            key={template.id}
                            onClick={() => applyTemplate(template)}
                            className="p-3 bg-white hover:bg-blue-50 border border-blue-200 rounded-lg text-left transition-all group"
                          >
                            <div className="font-semibold text-sm text-gray-900 mb-1 group-hover:text-blue-600">
                              {template.name}
                            </div>
                            <div className="text-xs text-gray-500 line-clamp-2">
                              {template.body.substring(0, 60)}...
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {showQuickReplies && quickReplies.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-3 p-3 bg-green-50 rounded-lg border border-green-200"
                    >
                      <div className="flex flex-wrap gap-2">
                        {quickReplies
                          .filter(qr => qr.channel === selectedConversation.channel || qr.channel === 'both')
                          .map(reply => (
                          <button
                            key={reply.id}
                            onClick={() => applyQuickReply(reply)}
                            className="px-3 py-1.5 bg-white hover:bg-green-50 border border-green-200 rounded-lg text-sm transition-all"
                          >
                            <span className="font-mono text-green-600 mr-1">{reply.shortcut}</span>
                            <span className="text-gray-700">{reply.text.substring(0, 30)}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  <div className="flex items-end gap-3">
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
                        placeholder={`Écrivez votre ${selectedConversation.channel === 'sms' ? 'SMS' : 'email'}... (Enter pour envoyer)`}
                        rows={3}
                        disabled={sending}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all disabled:opacity-50 disabled:bg-gray-100"
                      />
                      {selectedConversation.channel === 'sms' && (
                        <p className="text-xs text-gray-500 mt-1 px-1">
                          {messageInput.length} caractères ({Math.ceil(messageInput.length / 160)} SMS)
                        </p>
                      )}
                    </div>
                    <button
                      onClick={sendMessage}
                      disabled={!messageInput.trim() || sending}
                      className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                    >
                      {sending ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <Send className="w-6 h-6" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500 bg-gradient-to-br from-gray-50 to-white">
                <div className="text-center">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <MessageSquare className="w-20 h-20 mx-auto mb-4 text-gray-300" />
                  </motion.div>
                  <p className="text-xl font-medium">Sélectionnez une conversation</p>
                  <p className="text-sm text-gray-400 mt-1">Ou créez-en une nouvelle</p>
                </div>
              </div>
            )}
          </div>

          {selectedConversation && (
            <div className="col-span-2 bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <History className="w-5 h-5 text-blue-500" />
                  Historique
                </h3>
              </div>

              <div className="overflow-y-auto h-[calc(100vh-320px)]">
                {loadingHistory ? (
                  <div className="flex items-center justify-center h-40">
                    <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                  </div>
                ) : contactHistory ? (
                  <div className="p-4 space-y-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold text-sm text-gray-900">Stats rapides</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Messages</span>
                          <span className="font-bold text-blue-600">{contactHistory.messages_count}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">RDV totaux</span>
                          <span className="font-bold text-blue-600">{contactHistory.appointments.length}</span>
                        </div>
                      </div>
                    </div>

                    {contactHistory.next_appointment && (
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4 text-green-600" />
                          <span className="font-semibold text-sm text-gray-900">Prochain RDV</span>
                        </div>
                        <p className="text-xs text-green-700">
                          {new Date(contactHistory.next_appointment).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    )}

                    {contactHistory.last_appointment && (
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-gray-600" />
                          <span className="font-semibold text-sm text-gray-900">Dernier RDV</span>
                        </div>
                        <p className="text-xs text-gray-700">
                          {new Date(contactHistory.last_appointment).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Activity className="w-4 h-4 text-gray-600" />
                        <span className="font-semibold text-sm text-gray-900">Historique RDV</span>
                      </div>
                      <div className="space-y-2">
                        {contactHistory.appointments.slice(0, 5).map((appt) => (
                          <div
                            key={appt.id}
                            className="bg-white border border-gray-200 rounded-lg p-3 hover:border-blue-300 transition-all"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                                appt.status === 'completed' ? 'bg-green-100 text-green-700' :
                                appt.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                                appt.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {appt.status === 'completed' ? 'Complété' :
                                 appt.status === 'confirmed' ? 'Confirmé' :
                                 appt.status === 'cancelled' ? 'Annulé' : appt.status}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600">
                              {new Date(appt.appointment_date).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short'
                              })} à {appt.start_time}
                            </p>
                            {appt.notes && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{appt.notes}</p>
                            )}
                          </div>
                        ))}
                        {contactHistory.appointments.length === 0 && (
                          <p className="text-xs text-gray-400 text-center py-4">Aucun rendez-vous</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-400">
                    <Activity className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Aucun historique</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showNewConversation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowNewConversation(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
                <h2 className="text-2xl font-bold text-gray-900">Nouvelle Conversation</h2>
                <button
                  onClick={() => setShowNewConversation(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(80vh-180px)]">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Type de conversation
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setNewMessageChannel('sms')}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                        newMessageChannel === 'sms'
                          ? 'border-green-500 bg-green-50 shadow-md'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <Phone className={`w-6 h-6 ${newMessageChannel === 'sms' ? 'text-green-600' : 'text-gray-400'}`} />
                      <span className="font-semibold">SMS</span>
                    </button>
                    <button
                      onClick={() => setNewMessageChannel('email')}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                        newMessageChannel === 'email'
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <Mail className={`w-6 h-6 ${newMessageChannel === 'email' ? 'text-blue-600' : 'text-gray-400'}`} />
                      <span className="font-semibold">Email</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Sélectionnez un contact
                  </label>
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Rechercher un contact..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto border border-gray-200 rounded-xl p-2">
                    {filteredContacts.map((contact) => (
                      <button
                        key={contact.id}
                        onClick={() => setSelectedContact(contact)}
                        className={`w-full p-3 rounded-lg text-left transition-all flex items-center gap-3 ${
                          selectedContact?.id === contact.id
                            ? 'bg-blue-100 border-2 border-blue-500'
                            : 'hover:bg-gray-50 border-2 border-transparent'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                          {contact.full_name[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{contact.full_name}</p>
                          <p className="text-sm text-gray-500 truncate">
                            {newMessageChannel === 'sms' ? contact.phone : contact.email}
                          </p>
                        </div>
                        {selectedContact?.id === contact.id && (
                          <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => setShowNewConversation(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 font-semibold transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={startNewConversation}
                  disabled={!selectedContact}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  Créer la conversation
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBulkSend && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowBulkSend(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-white">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Users className="w-7 h-7 text-purple-600" />
                    Envoi Groupé
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Envoyez un message à plusieurs contacts simultanément
                  </p>
                </div>
                <button
                  onClick={() => setShowBulkSend(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(85vh-200px)]">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Type de message
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setBulkChannel('sms')}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                        bulkChannel === 'sms'
                          ? 'border-green-500 bg-green-50 shadow-md'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <Phone className={`w-6 h-6 ${bulkChannel === 'sms' ? 'text-green-600' : 'text-gray-400'}`} />
                      <span className="font-semibold">SMS</span>
                    </button>
                    <button
                      onClick={() => setBulkChannel('email')}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                        bulkChannel === 'email'
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <Mail className={`w-6 h-6 ${bulkChannel === 'email' ? 'text-blue-600' : 'text-gray-400'}`} />
                      <span className="font-semibold">Email</span>
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-gray-700">
                      Sélectionnez les contacts ({selectedContacts.length} sélectionnés)
                    </label>
                    {selectedContacts.length > 0 && (
                      <button
                        onClick={() => setSelectedContacts([])}
                        className="text-xs text-red-600 hover:text-red-700 font-medium"
                      >
                        Tout désélectionner
                      </button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-[250px] overflow-y-auto border border-gray-200 rounded-xl p-3 bg-gray-50">
                    {contacts.map((contact) => {
                      const isSelected = selectedContacts.find(c => c.id === contact.id);
                      const hasRequiredField = bulkChannel === 'sms'
                        ? contact.phone && contact.phone.trim() !== ''
                        : contact.email && contact.email.trim() !== '';

                      return (
                        <button
                          key={contact.id}
                          onClick={() => hasRequiredField && toggleContactSelection(contact)}
                          disabled={!hasRequiredField}
                          className={`w-full p-3 rounded-lg text-left transition-all flex items-center gap-3 ${
                            isSelected
                              ? 'bg-purple-100 border-2 border-purple-500'
                              : hasRequiredField
                              ? 'bg-white hover:bg-gray-50 border-2 border-transparent'
                              : 'bg-gray-100 opacity-50 cursor-not-allowed border-2 border-transparent'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                            isSelected ? 'bg-gradient-to-br from-purple-400 to-purple-600' : 'bg-gradient-to-br from-gray-400 to-gray-500'
                          }`}>
                            {contact.full_name[0]?.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{contact.full_name}</p>
                            <p className="text-sm text-gray-500 truncate">
                              {bulkChannel === 'sms' ? contact.phone || 'Pas de téléphone' : contact.email || 'Pas d\'email'}
                            </p>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="w-5 h-5 text-purple-500 flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Message
                  </label>
                  <textarea
                    value={bulkMessage}
                    onChange={(e) => setBulkMessage(e.target.value)}
                    placeholder={`Écrivez votre ${bulkChannel === 'sms' ? 'SMS' : 'email'}...`}
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                  />
                  {bulkChannel === 'sms' && (
                    <p className="text-xs text-gray-500 mt-2">
                      {bulkMessage.length} caractères • {Math.ceil(bulkMessage.length / 160)} SMS par contact • {selectedContacts.length} contacts = {Math.ceil(bulkMessage.length / 160) * selectedContacts.length} SMS total
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
                <div className="text-sm text-gray-600">
                  <span className="font-semibold">{selectedContacts.length}</span> destinataires
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowBulkSend(false)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 font-semibold transition-all"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={sendBulkMessage}
                    disabled={selectedContacts.length === 0 || !bulkMessage.trim() || sending}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center gap-2"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Envoyer à {selectedContacts.length} contacts
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showExport && selectedConversation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowExport(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Download className="w-6 h-6 text-blue-600" />
                    Exporter la conversation
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {messages.length} messages avec {selectedConversation.contact.full_name}
                  </p>
                </div>
                <button
                  onClick={() => setShowExport(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Format d'export
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setExportFormat('pdf')}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                        exportFormat === 'pdf'
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <FileText className={`w-6 h-6 ${exportFormat === 'pdf' ? 'text-blue-600' : 'text-gray-400'}`} />
                      <span className="font-semibold text-sm">HTML/PDF</span>
                      <span className="text-xs text-gray-500">Meilleure lisibilité</span>
                    </button>
                    <button
                      onClick={() => setExportFormat('csv')}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                        exportFormat === 'csv'
                          ? 'border-green-500 bg-green-50 shadow-md'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <FileText className={`w-6 h-6 ${exportFormat === 'csv' ? 'text-green-600' : 'text-gray-400'}`} />
                      <span className="font-semibold text-sm">CSV</span>
                      <span className="text-xs text-gray-500">Excel compatible</span>
                    </button>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    <strong>Contenu:</strong> Tous les messages de cette conversation seront inclus dans l'export.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => setShowExport(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 font-semibold transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={exportConversation}
                  disabled={exporting}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  {exporting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Export en cours...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      Exporter en {exportFormat.toUpperCase()}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
