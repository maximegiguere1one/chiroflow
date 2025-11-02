import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Sparkles, Zap, History, TrendingUp, X } from 'lucide-react';
import { CONDITIONS_TEMPLATES, type SoapTemplate, type SmartSuggestion } from '../../lib/smartSoapTemplates';

interface SmartTemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: SoapTemplate) => void;
  patientHistory?: any[];
  smartSuggestions?: SmartSuggestion[];
}

export function SmartTemplateSelector({
  isOpen,
  onClose,
  onSelectTemplate,
  patientHistory = [],
  smartSuggestions = []
}: SmartTemplateSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['all', ...Array.from(new Set(CONDITIONS_TEMPLATES.map(t => t.category)))];

  const filteredTemplates = CONDITIONS_TEMPLATES.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = searchQuery === '' ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const mostUsedTemplate = patientHistory.length > 0 ? CONDITIONS_TEMPLATES[0] : null;

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Templates SOAP Intelligents</h2>
                <p className="text-purple-100 text-sm">Remplissage automatique basé sur votre historique</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Search */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher condition ou mot-clé..."
            className="w-full px-4 py-3 rounded-xl bg-white/20 backdrop-blur-sm text-white placeholder-white/60 border-2 border-white/30 focus:border-white focus:outline-none"
          />
        </div>

        {/* Smart Suggestions */}
        {smartSuggestions.length > 0 && (
          <div className="p-6 bg-amber-50 border-b border-amber-200">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-amber-600" />
              <h3 className="font-semibold text-amber-900">Suggestions Intelligentes</h3>
            </div>
            <div className="space-y-2">
              {smartSuggestions.slice(0, 3).map((suggestion, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 bg-white rounded-lg border border-amber-200"
                >
                  <div className="flex-1">
                    <p className="text-sm text-amber-900">{suggestion.text}</p>
                    <p className="text-xs text-amber-600 mt-1">
                      Confiance: {Math.round(suggestion.confidence * 100)}% • Source: {suggestion.source}
                    </p>
                  </div>
                  <div className="w-16 h-2 bg-amber-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${suggestion.confidence * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Most Used */}
        {patientHistory.length > 0 && mostUsedTemplate && (
          <div className="p-6 bg-blue-50 border-b border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <History className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">Basé sur Historique Patient</h3>
            </div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-4 bg-white rounded-xl border-2 border-blue-300 cursor-pointer shadow-sm hover:shadow-md transition-all"
              onClick={() => onSelectTemplate(mostUsedTemplate)}
            >
              <div className="flex items-center gap-3">
                <div className="text-3xl">{mostUsedTemplate.icon}</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-lg text-blue-900">{mostUsedTemplate.name}</h4>
                  <p className="text-sm text-blue-600">
                    Utilisé lors des {patientHistory.length} dernières visites
                  </p>
                </div>
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
            </motion.div>
          </div>
        )}

        {/* Categories */}
        <div className="p-6 border-b border-neutral-200">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                  selectedCategory === category
                    ? 'bg-purple-500 text-white shadow-md'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {category === 'all' ? 'Tous' : category}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="p-6 overflow-y-auto max-h-96">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <motion.div
                key={template.id}
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all shadow-sm hover:shadow-lg bg-${template.color}-50 border-${template.color}-200 hover:border-${template.color}-400`}
                onClick={() => {
                  onSelectTemplate(template);
                  onClose();
                }}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="text-3xl">{template.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg text-neutral-900 mb-1">
                      {template.name}
                    </h3>
                    <p className="text-xs text-neutral-500 uppercase tracking-wide">
                      {template.category}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex gap-1 flex-wrap">
                    {template.keywords.slice(0, 4).map((keyword, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-white/60 rounded-md text-neutral-600"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-neutral-200">
                  <p className="text-xs text-neutral-600 line-clamp-2">
                    {template.subjective.substring(0, 80)}...
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <p className="text-neutral-400 text-lg">Aucun template trouvé</p>
              <p className="text-neutral-400 text-sm mt-2">Essayez une autre recherche</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-neutral-50 border-t border-neutral-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-600">
              {filteredTemplates.length} template{filteredTemplates.length > 1 ? 's' : ''} disponible{filteredTemplates.length > 1 ? 's' : ''}
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 rounded-lg font-medium transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
