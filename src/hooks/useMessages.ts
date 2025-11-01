import { useEffect } from 'react';
import { useMessagesStore } from '../presentation/stores/messagesStore';

export function useMessages(contactId?: string, autoLoad = true) {
  const {
    messages,
    templates,
    threads,
    loading,
    sending,
    error,
    unreadCount,
    isRealtimeActive,
    sendMessage,
    scheduleMessage,
    updateMessage,
    deleteMessage,
    markAsRead,
    markAsUnread,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    applyTemplate,
    setFilters,
    setSelectedThread,
    searchMessages,
    refresh,
    enableRealtime,
    disableRealtime,
  } = useMessagesStore();

  useEffect(() => {
    if (autoLoad) {
      useMessagesStore.getState().loadMessages(contactId);
      useMessagesStore.getState().loadTemplates();
      if (contactId) {
        useMessagesStore.getState().loadThreads(contactId);
      }
    }
  }, [contactId, autoLoad]);

  return {
    messages,
    templates,
    threads,
    loading,
    sending,
    error,
    unreadCount,
    isRealtimeActive,
    sendMessage,
    scheduleMessage,
    updateMessage,
    deleteMessage,
    markAsRead,
    markAsUnread,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    applyTemplate,
    setFilters,
    setSelectedThread,
    searchMessages,
    refresh,
    enableRealtime,
    disableRealtime,
  };
}

export function useMessageTemplates() {
  const templates = useMessagesStore((state) => state.templates);
  const createTemplate = useMessagesStore((state) => state.createTemplate);
  const updateTemplate = useMessagesStore((state) => state.updateTemplate);
  const deleteTemplate = useMessagesStore((state) => state.deleteTemplate);
  const applyTemplate = useMessagesStore((state) => state.applyTemplate);

  useEffect(() => {
    useMessagesStore.getState().loadTemplates();
  }, []);

  return {
    templates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    applyTemplate,
  };
}
