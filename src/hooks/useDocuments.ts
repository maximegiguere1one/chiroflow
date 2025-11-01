import { useEffect } from 'react';
import { useDocumentsStore } from '../presentation/stores/documentsStore';

export function useDocuments(contactId?: string, autoLoad = true) {
  const {
    documents,
    loading,
    uploading,
    error,
    filters,
    isRealtimeActive,
    uploadDocument,
    updateDocument,
    deleteDocument,
    archiveDocument,
    unarchiveDocument,
    downloadDocument,
    setFilters,
    searchDocuments,
    getDocumentsByType,
    refresh,
    enableRealtime,
    disableRealtime,
  } = useDocumentsStore();

  useEffect(() => {
    if (autoLoad && contactId) {
      useDocumentsStore.getState().loadDocuments(contactId);
    }
  }, [contactId, autoLoad]);

  return {
    documents,
    loading,
    uploading,
    error,
    filters,
    isRealtimeActive,
    uploadDocument,
    updateDocument,
    deleteDocument,
    archiveDocument,
    unarchiveDocument,
    downloadDocument,
    setFilters,
    searchDocuments,
    getDocumentsByType,
    refresh,
    enableRealtime,
    disableRealtime,
  };
}
