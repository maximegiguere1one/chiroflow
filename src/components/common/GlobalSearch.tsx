import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
import { Search, X, User, Calendar, FileText, DollarSign, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Patient, Appointment } from '../../types/database';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (view: string, id?: string) => void;
}

interface SearchResults {
  patients: Patient[];
  appointments: Appointment[];
  recentSearches: string[];
}

export function GlobalSearch({ isOpen, onClose, onNavigate }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>({
    patients: [],
    appointments: [],
    recentSearches: []
  });
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      loadRecentSearches();
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.length >= 2) {
      const debounce = setTimeout(() => {
        performSearch(query);
      }, 300);
      return () => clearTimeout(debounce);
    } else {
      setResults(prev => ({ ...prev, patients: [], appointments: [] }));
    }
  }, [query]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, totalResults - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSelectResult(selectedIndex);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, results]);

  async function performSearch(searchQuery: string) {
    setLoading(true);
    try {
      const term = searchQuery.toLowerCase();

      const [patientsResult, appointmentsResult] = await Promise.all([
        supabase
          .from('patients')
          .select('*')
          .or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`)
          .eq('status', 'active')
          .limit(5),

        supabase
          .from('appointments_api')
          .select('*')
          .or(`name.ilike.%${term}%,reason.ilike.%${term}%`)
          .gte('scheduled_date', new Date().toISOString().split('T')[0])
          .order('scheduled_date', { ascending: true })
          .limit(5)
      ]);

      setResults({
        patients: patientsResult.data || [],
        appointments: appointmentsResult.data || [],
        recentSearches: []
      });

      saveRecentSearch(searchQuery);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }

  function loadRecentSearches() {
    const recent = localStorage.getItem('recentSearches');
    if (recent) {
      setResults(prev => ({ ...prev, recentSearches: JSON.parse(recent) }));
    }
  }

  function saveRecentSearch(search: string) {
    const recent = localStorage.getItem('recentSearches');
    const searches = recent ? JSON.parse(recent) : [];
    const updated = [search, ...searches.filter((s: string) => s !== search)].slice(0, 5);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  }

  const totalResults = results.patients.length + results.appointments.length;

  function handleSelectResult(index: number) {
    if (index < results.patients.length) {
      const patient = results.patients[index];
      onNavigate?.('patients', patient.id);
      onClose();
    } else if (index < totalResults) {
      const apt = results.appointments[index - results.patients.length];
      onNavigate?.('appointments', apt.id);
      onClose();
    }
  }

  function handleQuickAction(patient: Patient, action: 'view' | 'call' | 'sms') {
    switch (action) {
      case 'view':
        onNavigate?.('patients', patient.id);
        onClose();
        break;
      case 'call':
        if (patient.phone) {
          window.location.href = `tel:${patient.phone}`;
          onClose();
        }
        break;
      case 'sms':
        alert(`SMS à ${patient.first_name} ${patient.last_name}: ${patient.phone}`);
        break;
    }
  }

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-start justify-center pt-[10vh]"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: -20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: -20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden"
        >
          {/* Search Input */}
          <div className="relative border-b border-neutral-200">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-neutral-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher patients, rendez-vous, notes..."
              autoFocus
              className="w-full pl-14 pr-12 py-5 text-lg focus:outline-none"
            />
            <button
              onClick={onClose}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!loading && query.length < 2 && results.recentSearches.length > 0 && (
              <div className="p-4">
                <div className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2 px-2">
                  Recherches récentes
                </div>
                <div className="space-y-1">
                  {results.recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => setQuery(search)}
                      className="w-full text-left px-4 py-2 hover:bg-neutral-100 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-neutral-400" />
                        <span className="text-foreground">{search}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!loading && query.length >= 2 && totalResults === 0 && (
              <div className="py-12 text-center text-neutral-500">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Aucun résultat pour "{query}"</p>
              </div>
            )}

            {/* Patients Results */}
            {results.patients.length > 0 && (
              <div className="border-b border-neutral-100">
                <div className="text-xs font-medium text-neutral-500 uppercase tracking-wide px-6 py-3 bg-neutral-50">
                  <User className="w-3 h-3 inline mr-2" />
                  Patients ({results.patients.length})
                </div>
                <div>
                  {results.patients.map((patient, index) => (
                    <button
                      key={patient.id}
                      onClick={() => handleSelectResult(index)}
                      className={`w-full text-left px-6 py-4 border-b border-neutral-50 last:border-0 transition-colors ${
                        selectedIndex === index
                          ? 'bg-gold-50 border-gold-100'
                          : 'hover:bg-neutral-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-foreground mb-1">
                            {patient.first_name} {patient.last_name}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-foreground/60">
                            {patient.email && <span>{patient.email}</span>}
                            {patient.phone && <span>{patient.phone}</span>}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                              {patient.total_visits} visites
                            </span>
                            {patient.last_visit && (
                              <span className="text-xs text-foreground/50">
                                Dernière: {new Date(patient.last_visit).toLocaleDateString('fr-CA')}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <kbd className="px-2 py-1 bg-neutral-100 border border-neutral-300 rounded text-xs">
                            ↵
                          </kbd>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Appointments Results */}
            {results.appointments.length > 0 && (
              <div>
                <div className="text-xs font-medium text-neutral-500 uppercase tracking-wide px-6 py-3 bg-neutral-50">
                  <Calendar className="w-3 h-3 inline mr-2" />
                  Rendez-vous ({results.appointments.length})
                </div>
                <div>
                  {results.appointments.map((apt, index) => {
                    const resultIndex = results.patients.length + index;
                    return (
                      <button
                        key={apt.id}
                        onClick={() => handleSelectResult(resultIndex)}
                        className={`w-full text-left px-6 py-4 border-b border-neutral-50 last:border-0 transition-colors ${
                          selectedIndex === resultIndex
                            ? 'bg-gold-50 border-gold-100'
                            : 'hover:bg-neutral-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <div className="text-sm font-bold text-foreground">
                                {apt.scheduled_time}
                              </div>
                              <div className="text-xs text-foreground/50">
                                {new Date(apt.scheduled_date || '').toLocaleDateString('fr-CA', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                            </div>
                            <div>
                              <div className="font-medium text-foreground">{apt.name}</div>
                              <div className="text-sm text-foreground/60">{apt.reason}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-xs px-2 py-0.5 rounded ${
                                  apt.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                                  apt.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                                  apt.status === 'completed' ? 'bg-green-100 text-green-700' :
                                  'bg-neutral-100 text-neutral-600'
                                }`}>
                                  {apt.status === 'confirmed' && 'Confirmé'}
                                  {apt.status === 'pending' && 'En attente'}
                                  {apt.status === 'completed' && 'Complété'}
                                  {apt.status === 'cancelled' && 'Annulé'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <kbd className="px-2 py-1 bg-neutral-100 border border-neutral-300 rounded text-xs">
                            ↵
                          </kbd>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-neutral-200 px-6 py-3 bg-neutral-50 flex items-center justify-between text-xs text-neutral-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-neutral-300 rounded">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-white border border-neutral-300 rounded">↓</kbd>
                naviguer
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-neutral-300 rounded">↵</kbd>
                sélectionner
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-neutral-300 rounded">ESC</kbd>
                fermer
              </span>
            </div>
            <div>
              <kbd className="px-1.5 py-0.5 bg-white border border-neutral-300 rounded">Ctrl</kbd>
              {' + '}
              <kbd className="px-1.5 py-0.5 bg-white border border-neutral-300 rounded">K</kbd>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
