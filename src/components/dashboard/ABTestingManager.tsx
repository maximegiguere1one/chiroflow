import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FlaskConical, TrendingUp, Mail, Eye, MousePointer,
  CheckCircle, Plus, Copy, Edit, Trash2, BarChart3
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToastContext } from '../../contexts/ToastContext';
import { Tooltip } from '../common/Tooltip';
import { EmptyState } from '../common/EmptyState';
import { CardSkeleton, TableSkeleton } from '../common/LoadingSkeleton';
import { buttonHover, buttonTap } from '../../lib/animations';

interface Template {
  id: string;
  name: string;
  template_type: string;
  variant_name: string;
  subject_line: string;
  language: string;
  is_active: boolean;
  is_control: boolean;
}

interface TemplatePerformance {
  template_id: string;
  name: string;
  variant_name: string;
  total_sent: number;
  total_opened: number;
  total_clicked: number;
  total_converted: number;
  open_rate: number;
  click_rate: number;
  conversion_rate: number;
}

export function ABTestingManager() {
  const toast = useToastContext();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [performance, setPerformance] = useState<TemplatePerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('reminder_24h');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedType]);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: templatesData } = await supabase
        .from('email_templates')
        .select('*')
        .eq('template_type', selectedType)
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (templatesData) {
        setTemplates(templatesData);
      }

      const { data: perfData } = await supabase
        .from('template_performance')
        .select('*')
        .eq('template_type', selectedType);

      if (perfData) {
        setPerformance(perfData);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading A/B test data:', error);
      setLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      reminder_24h: 'Rappel 24h',
      reminder_2h: 'Rappel 2h',
      confirmation: 'Confirmation',
      followup: 'Follow-up',
      rebook: 'Rebooking'
    };
    return labels[type] || type;
  };

  const getWinnerVariant = (type: string): TemplatePerformance | null => {
    const typePerf = performance.filter(p => p.variant_name.includes(type));
    if (typePerf.length === 0) return null;

    return typePerf.reduce((best, current) =>
      current.conversion_rate > best.conversion_rate ? current : best
    );
  };

  const getPerformanceForTemplate = (templateId: string) => {
    return performance.find(p => p.template_id === templateId);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-20 bg-neutral-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <TableSkeleton rows={5} />
      </div>
    );
  }

  const winner = getWinnerVariant(selectedType);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-emerald-600" />
            A/B Testing Templates
          </h2>
          <p className="text-neutral-600 mt-1">
            Optimisez vos emails avec des tests A/B scientifiques
          </p>
        </div>
        <Tooltip content="Créer un nouveau variant pour tester" placement="bottom">
          <motion.button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            whileHover={buttonHover}
            whileTap={buttonTap}
          >
            <Plus className="w-4 h-4" />
            Nouveau Variant
          </motion.button>
        </Tooltip>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {['reminder_24h', 'reminder_2h', 'confirmation', 'followup', 'rebook'].map(type => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              selectedType === type
                ? 'bg-emerald-600 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            {getTypeLabel(type)}
          </button>
        ))}
      </div>

      {winner && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-xl p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-amber-900 flex items-center gap-2">
                🏆 Variant Gagnant
              </h3>
              <p className="text-amber-700 mt-1">
                {winner.variant_name} surperforme avec {winner.conversion_rate}% de conversion
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-amber-900">
                {winner.conversion_rate}%
              </div>
              <div className="text-sm text-amber-700">Taux de conversion</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-white rounded-lg p-3">
              <div className="flex items-center gap-2 text-neutral-600 text-sm">
                <Eye className="w-4 h-4" />
                Ouvertures
              </div>
              <div className="text-2xl font-bold text-neutral-900 mt-1">
                {winner.open_rate}%
              </div>
            </div>
            <div className="bg-white rounded-lg p-3">
              <div className="flex items-center gap-2 text-neutral-600 text-sm">
                <MousePointer className="w-4 h-4" />
                Clics
              </div>
              <div className="text-2xl font-bold text-neutral-900 mt-1">
                {winner.click_rate}%
              </div>
            </div>
            <div className="bg-white rounded-lg p-3">
              <div className="flex items-center gap-2 text-neutral-600 text-sm">
                <CheckCircle className="w-4 h-4" />
                Conversions
              </div>
              <div className="text-2xl font-bold text-neutral-900 mt-1">
                {winner.total_converted}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
        <div className="p-6 border-b border-neutral-200">
          <h3 className="text-lg font-semibold text-neutral-900">
            Variants pour {getTypeLabel(selectedType)}
          </h3>
        </div>

        <div className="divide-y divide-neutral-200">
          {templates.map(template => {
            const perf = getPerformanceForTemplate(template.id);
            const isWinner = winner?.template_id === template.id;

            return (
              <div
                key={template.id}
                className={`p-6 hover:bg-neutral-50 transition-colors ${
                  isWinner ? 'bg-amber-50/50' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold text-neutral-900">
                        {template.variant_name}
                      </h4>
                      {template.is_control && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                          Contrôle
                        </span>
                      )}
                      {isWinner && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded">
                          🏆 Gagnant
                        </span>
                      )}
                      {!template.is_active && (
                        <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 text-xs font-medium rounded">
                          Inactif
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 text-xs font-medium rounded">
                        {template.language.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-600 mt-1">
                      <strong>Sujet:</strong> {template.subject_line}
                    </p>

                    {perf && (
                      <div className="grid grid-cols-5 gap-4 mt-4">
                        <div>
                          <div className="text-xs text-neutral-500">Envoyés</div>
                          <div className="text-lg font-semibold text-neutral-900">
                            {perf.total_sent}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-neutral-500">Ouvertures</div>
                          <div className="text-lg font-semibold text-blue-600">
                            {perf.open_rate}%
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-neutral-500">Clics</div>
                          <div className="text-lg font-semibold text-purple-600">
                            {perf.click_rate}%
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-neutral-500">Conversions</div>
                          <div className="text-lg font-semibold text-emerald-600">
                            {perf.conversion_rate}%
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-neutral-500">Total</div>
                          <div className="text-lg font-semibold text-neutral-900">
                            {perf.total_converted}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                      <BarChart3 className="w-4 h-4 text-neutral-600" />
                    </button>
                    <button className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                      <Copy className="w-4 h-4 text-neutral-600" />
                    </button>
                    <button className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                      <Edit className="w-4 h-4 text-neutral-600" />
                    </button>
                    <button className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {templates.length === 0 && (
            <EmptyState
              icon={<Mail size={48} />}
              title="Aucun variant"
              description={`Créez votre premier variant pour optimiser vos emails ${selectedType}`}
              primaryAction={{
                label: 'Créer un variant',
                icon: <Plus />,
                onClick: () => setShowCreateModal(true)
              }}
            />
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Comment ça marche?
        </h3>
        <ul className="mt-3 space-y-2 text-sm text-blue-800">
          <li>• Créez plusieurs variants avec différents sujets et contenus</li>
          <li>• Les emails sont distribués aléatoirement entre les variants</li>
          <li>• Suivez les performances en temps réel (ouvertures, clics, conversions)</li>
          <li>• Le système identifie automatiquement le variant gagnant</li>
          <li>• Activez uniquement le meilleur variant pour maximiser les résultats</li>
        </ul>
      </div>
    </div>
  );
}
