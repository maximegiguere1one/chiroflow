import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { X, Plus, FileText, Edit, Trash2, Calendar, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { SoapNoteEditor } from './SoapNoteEditor';
import type { SoapNote } from '../../types/database';
import { useToastContext } from '../../contexts/ToastContext';

interface SoapNotesListModalProps {
  patient: {
    id: string;
    first_name: string;
    last_name: string;
  };
  onClose: () => void;
}

export function SoapNotesListModal({ patient, onClose }: SoapNotesListModalProps) {
  const [notes, setNotes] = useState<SoapNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [selectedNote, setSelectedNote] = useState<SoapNote | null>(null);
  const toast = useToastContext();

  useEffect(() => {
    loadNotes();
  }, [patient.id]);

  async function loadNotes() {
    try {
      const { data, error } = await supabase
        .from('soap_notes')
        .select('*')
        .eq('patient_id', patient.id)
        .order('visit_date', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error loading SOAP notes:', error);
      toast.error('Erreur lors du chargement des notes');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(noteId: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette note SOAP?')) return;

    try {
      const { error } = await supabase
        .from('soap_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
      toast.success('Note SOAP supprimée');
      loadNotes();
    } catch (error) {
      console.error('Error deleting SOAP note:', error);
      toast.error('Erreur lors de la suppression');
    }
  }

  function handleNewNote() {
    setSelectedNote(null);
    setShowEditor(true);
  }

  function handleEditNote(note: SoapNote) {
    setSelectedNote(note);
    setShowEditor(true);
  }

  function handleEditorClose() {
    setShowEditor(false);
    setSelectedNote(null);
  }

  function handleEditorSave() {
    setShowEditor(false);
    setSelectedNote(null);
    loadNotes();
    toast.success('Note SOAP enregistrée avec succès');
  }

  if (showEditor) {
    return (
      <SoapNoteEditor
        patient={patient}
        existingNote={selectedNote || undefined}
        onClose={handleEditorClose}
        onSave={handleEditorSave}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-lifted"
      >
        <div className="sticky top-0 bg-white border-b border-neutral-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-gold-400 to-gold-600 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-heading text-foreground">Notes SOAP</h3>
              <p className="text-sm text-foreground/60 mt-1">
                {patient.first_name} {patient.last_name} - {notes.length} note{notes.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleNewNote}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-600 text-white hover:from-gold-600 hover:to-gold-700 transition-all duration-300 shadow-soft"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvelle note</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-gold-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-foreground mb-2">
                Aucune note SOAP
              </h4>
              <p className="text-foreground/60 mb-6">
                Créez la première note SOAP pour ce patient
              </p>
              <button
                onClick={handleNewNote}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-white hover:from-gold-600 hover:to-gold-700 transition-all duration-300 shadow-soft"
              >
                <Plus className="w-4 h-4" />
                <span>Créer une note</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-neutral-200 shadow-soft hover:shadow-soft-lg transition-all p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-gold-100 to-gold-200 rounded-lg flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-gold-600" />
                      </div>
                      <div>
                        <div className="text-lg font-medium text-foreground">
                          {new Date(note.visit_date).toLocaleDateString('fr-CA', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                        <div className="text-sm text-foreground/60">
                          Créée le {new Date(note.created_at).toLocaleDateString('fr-CA')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditNote(note)}
                        className="p-2 hover:bg-blue-50 rounded-lg transition-colors group"
                        title="Modifier"
                      >
                        <Edit className="w-5 h-5 text-blue-600 group-hover:text-blue-700" />
                      </button>
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                        title="Supprimer"
                      >
                        <Trash2 className="w-5 h-5 text-red-400 group-hover:text-red-600" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {note.subjective && (
                      <div>
                        <div className="text-sm font-medium text-foreground/70 mb-2">
                          <strong>S</strong>ubjectif
                        </div>
                        <div className="text-foreground/90 bg-neutral-50 p-3 rounded border border-neutral-200">
                          {note.subjective}
                        </div>
                      </div>
                    )}

                    {note.objective && (
                      <div>
                        <div className="text-sm font-medium text-foreground/70 mb-2">
                          <strong>O</strong>bjectif
                        </div>
                        <div className="text-foreground/90 bg-neutral-50 p-3 rounded border border-neutral-200">
                          {note.objective}
                        </div>
                      </div>
                    )}

                    {note.assessment && (
                      <div>
                        <div className="text-sm font-medium text-foreground/70 mb-2">
                          <strong>A</strong>ssessment
                        </div>
                        <div className="text-foreground/90 bg-neutral-50 p-3 rounded border border-neutral-200">
                          {note.assessment}
                        </div>
                      </div>
                    )}

                    {note.plan && (
                      <div>
                        <div className="text-sm font-medium text-foreground/70 mb-2">
                          <strong>P</strong>lan
                        </div>
                        <div className="text-foreground/90 bg-neutral-50 p-3 rounded border border-neutral-200">
                          {note.plan}
                        </div>
                      </div>
                    )}

                    {note.follow_up_date && (
                      <div className="flex items-center gap-2 text-sm text-foreground/70 mt-2">
                        <Calendar className="w-4 h-4" />
                        <span>Suivi prévu le {new Date(note.follow_up_date).toLocaleDateString('fr-CA')}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
