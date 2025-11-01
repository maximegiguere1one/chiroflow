import { useState, useEffect } from 'react';
import {
  Users, TrendingUp, AlertTriangle, Star, Plus,
  Edit, Trash2, Filter, Tag, BarChart3
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Segment {
  id: string;
  name: string;
  description: string;
  segment_type: 'manual' | 'automatic' | 'smart';
  is_active: boolean;
  member_count?: number;
}

interface SegmentStats {
  total_patients: number;
  avg_visits: number;
  total_revenue: number;
  no_show_rate: number;
}

export function PatientSegmentationManager() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null);
  const [stats, setStats] = useState<SegmentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSegments();
  }, []);

  useEffect(() => {
    if (selectedSegment) {
      loadSegmentStats(selectedSegment.id);
    }
  }, [selectedSegment]);

  const loadSegments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: segmentsData } = await supabase
        .from('patient_segments')
        .select(`
          *,
          member_count:segment_members(count)
        `)
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (segmentsData) {
        const formatted = segmentsData.map(seg => ({
          ...seg,
          member_count: seg.member_count?.[0]?.count || 0
        }));
        setSegments(formatted);
        if (formatted.length > 0 && !selectedSegment) {
          setSelectedSegment(formatted[0]);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading segments:', error);
      setLoading(false);
    }
  };

  const loadSegmentStats = async (segmentId: string) => {
    try {
      const { data: members } = await supabase
        .from('segment_members')
        .select('contact_id')
        .eq('segment_id', segmentId);

      if (!members || members.length === 0) {
        setStats({
          total_patients: 0,
          avg_visits: 0,
          total_revenue: 0,
          no_show_rate: 0
        });
        return;
      }

      const contactIds = members.map(m => m.contact_id);

      const { data: appointments } = await supabase
        .from('appointments')
        .select('id, status, contact_id')
        .in('contact_id', contactIds);

      const totalPatients = members.length;
      const completedVisits = appointments?.filter(a => a.status === 'completed').length || 0;
      const noShows = appointments?.filter(a => a.status === 'no-show').length || 0;
      const avgVisits = totalPatients > 0 ? completedVisits / totalPatients : 0;
      const noShowRate = appointments && appointments.length > 0
        ? (noShows / appointments.length) * 100
        : 0;

      setStats({
        total_patients: totalPatients,
        avg_visits: Math.round(avgVisits * 10) / 10,
        total_revenue: 0,
        no_show_rate: Math.round(noShowRate * 10) / 10
      });
    } catch (error) {
      console.error('Error loading segment stats:', error);
    }
  };

  const getSegmentIcon = (type: string) => {
    switch (type) {
      case 'manual':
        return Star;
      case 'automatic':
        return Filter;
      case 'smart':
        return TrendingUp;
      default:
        return Users;
    }
  };

  const getSegmentColor = (name: string) => {
    if (name.includes('High Value') || name.includes('VIP')) {
      return 'text-amber-600 bg-amber-50 border-amber-200';
    }
    if (name.includes('At Risk')) {
      return 'text-red-600 bg-red-50 border-red-200';
    }
    if (name.includes('New')) {
      return 'text-blue-600 bg-blue-50 border-blue-200';
    }
    return 'text-neutral-600 bg-neutral-50 border-neutral-200';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" />
            Segmentation Patients
          </h2>
          <p className="text-neutral-600 mt-1">
            Organisez vos patients en segments pour des communications ciblées
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
          <Plus className="w-4 h-4" />
          Nouveau Segment
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
            <h3 className="font-semibold text-neutral-900 mb-3">Segments</h3>
            <div className="space-y-2">
              {segments.map(segment => {
                const Icon = getSegmentIcon(segment.segment_type);
                const colorClass = getSegmentColor(segment.name);
                const isSelected = selectedSegment?.id === segment.id;

                return (
                  <button
                    key={segment.id}
                    onClick={() => setSelectedSegment(segment)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      isSelected
                        ? colorClass
                        : 'bg-white border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span className="font-medium">{segment.name}</span>
                      </div>
                      <span className="text-sm font-semibold">
                        {segment.member_count}
                      </span>
                    </div>
                    {segment.description && (
                      <p className="text-xs mt-1 opacity-75">
                        {segment.description}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-sm p-6 text-white">
            <h3 className="font-semibold mb-2">Total Segments</h3>
            <div className="text-4xl font-bold">{segments.length}</div>
            <p className="text-sm mt-2 opacity-90">
              {segments.filter(s => s.segment_type === 'automatic').length} automatiques •{' '}
              {segments.filter(s => s.segment_type === 'manual').length} manuels
            </p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {selectedSegment && stats && (
            <>
              <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-neutral-900">
                      {selectedSegment.name}
                    </h3>
                    <p className="text-neutral-600 mt-1">
                      {selectedSegment.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        selectedSegment.segment_type === 'automatic'
                          ? 'bg-blue-100 text-blue-700'
                          : selectedSegment.segment_type === 'smart'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-neutral-100 text-neutral-700'
                      }`}>
                        {selectedSegment.segment_type === 'automatic' ? 'Automatique' :
                         selectedSegment.segment_type === 'smart' ? 'Intelligent' : 'Manuel'}
                      </span>
                      {selectedSegment.is_active && (
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">
                          Actif
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                      <BarChart3 className="w-4 h-4 text-neutral-600" />
                    </button>
                    <button className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                      <Edit className="w-4 h-4 text-neutral-600" />
                    </button>
                    <button className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-neutral-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-neutral-600 text-sm mb-2">
                      <Users className="w-4 h-4" />
                      Patients
                    </div>
                    <div className="text-2xl font-bold text-neutral-900">
                      {stats.total_patients}
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-blue-600 text-sm mb-2">
                      <BarChart3 className="w-4 h-4" />
                      Visites moy.
                    </div>
                    <div className="text-2xl font-bold text-blue-900">
                      {stats.avg_visits}
                    </div>
                  </div>

                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-red-600 text-sm mb-2">
                      <AlertTriangle className="w-4 h-4" />
                      No-shows
                    </div>
                    <div className="text-2xl font-bold text-red-900">
                      {stats.no_show_rate}%
                    </div>
                  </div>

                  <div className="bg-emerald-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-emerald-600 text-sm mb-2">
                      <TrendingUp className="w-4 h-4" />
                      Taux activité
                    </div>
                    <div className="text-2xl font-bold text-emerald-900">
                      {stats.avg_visits > 3 ? 'Élevé' : stats.avg_visits > 1 ? 'Moyen' : 'Faible'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                <h3 className="font-semibold text-neutral-900 mb-4">
                  Actions pour ce segment
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button className="flex items-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                    <Tag className="w-4 h-4" />
                    <span className="font-medium">Campagne Email</span>
                  </button>
                  <button className="flex items-center gap-2 px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
                    <Tag className="w-4 h-4" />
                    <span className="font-medium">Campagne SMS</span>
                  </button>
                  <button className="flex items-center gap-2 px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">
                    <Tag className="w-4 h-4" />
                    <span className="font-medium">Offre Spéciale</span>
                  </button>
                  <button className="flex items-center gap-2 px-4 py-3 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors">
                    <Tag className="w-4 h-4" />
                    <span className="font-medium">Export Liste</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-3">
          Segments Automatiques Disponibles
        </h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong className="text-blue-900">High Value Patients:</strong>
            <p className="text-blue-700 mt-1">5+ visites dans les 6 derniers mois</p>
          </div>
          <div>
            <strong className="text-blue-900">At Risk:</strong>
            <p className="text-blue-700 mt-1">60+ jours sans RDV et pas de RDV futur</p>
          </div>
          <div>
            <strong className="text-blue-900">New Patients:</strong>
            <p className="text-blue-700 mt-1">Moins de 3 visites au total</p>
          </div>
          <div>
            <strong className="text-blue-900">VIP Patients:</strong>
            <p className="text-blue-700 mt-1">Liste manuelle curée</p>
          </div>
        </div>
      </div>
    </div>
  );
}
