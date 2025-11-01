import { memo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Phone, Mail, Calendar, FileText, DollarSign, MoreVertical } from 'lucide-react';

interface Patient {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  status: string;
  last_visit?: string;
  next_appointment?: string;
}

interface VirtualPatientListProps {
  patients: Patient[];
  height: number;
  onPatientClick?: (patient: Patient) => void;
  onCallClick?: (patient: Patient) => void;
  onEmailClick?: (patient: Patient) => void;
  onAppointmentClick?: (patient: Patient) => void;
  onFileClick?: (patient: Patient) => void;
  onBillingClick?: (patient: Patient) => void;
}

interface RowProps {
  index: number;
  style: React.CSSProperties;
  data: {
    patients: Patient[];
    onPatientClick?: (patient: Patient) => void;
    onCallClick?: (patient: Patient) => void;
    onEmailClick?: (patient: Patient) => void;
    onAppointmentClick?: (patient: Patient) => void;
    onFileClick?: (patient: Patient) => void;
    onBillingClick?: (patient: Patient) => void;
  };
}

const PatientRow = memo(({ index, style, data }: RowProps) => {
  const patient = data.patients[index];

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-emerald-100 text-emerald-800';
      case 'inactive':
        return 'bg-neutral-100 text-neutral-600';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-neutral-100 text-neutral-600';
    }
  };

  return (
    <div
      style={style}
      className="px-6 py-4 hover:bg-neutral-50 transition-colors border-b border-neutral-100"
    >
      <div className="flex items-center justify-between">
        <div
          className="flex-1 cursor-pointer"
          onClick={() => data.onPatientClick?.(patient)}
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-semibold">
              {patient.full_name?.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-neutral-900 truncate">
                  {patient.full_name}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(patient.status)}`}>
                  {patient.status}
                </span>
              </div>

              <div className="flex items-center gap-4 mt-1 text-sm text-neutral-600">
                {patient.email && (
                  <span className="flex items-center gap-1 truncate">
                    <Mail className="w-3.5 h-3.5" />
                    {patient.email}
                  </span>
                )}
                {patient.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    {patient.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4">
          {data.onCallClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                data.onCallClick?.(patient);
              }}
              className="p-2 hover:bg-emerald-50 rounded-lg transition-colors group"
              title="Appeler"
            >
              <Phone className="w-4 h-4 text-neutral-400 group-hover:text-emerald-600" />
            </button>
          )}

          {data.onEmailClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                data.onEmailClick?.(patient);
              }}
              className="p-2 hover:bg-blue-50 rounded-lg transition-colors group"
              title="Envoyer email"
            >
              <Mail className="w-4 h-4 text-neutral-400 group-hover:text-blue-600" />
            </button>
          )}

          {data.onAppointmentClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                data.onAppointmentClick?.(patient);
              }}
              className="p-2 hover:bg-purple-50 rounded-lg transition-colors group"
              title="Rendez-vous"
            >
              <Calendar className="w-4 h-4 text-neutral-400 group-hover:text-purple-600" />
            </button>
          )}

          {data.onFileClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                data.onFileClick?.(patient);
              }}
              className="p-2 hover:bg-amber-50 rounded-lg transition-colors group"
              title="Dossier"
            >
              <FileText className="w-4 h-4 text-neutral-400 group-hover:text-amber-600" />
            </button>
          )}

          {data.onBillingClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                data.onBillingClick?.(patient);
              }}
              className="p-2 hover:bg-green-50 rounded-lg transition-colors group"
              title="Facturation"
            >
              <DollarSign className="w-4 h-4 text-neutral-400 group-hover:text-green-600" />
            </button>
          )}

          <button
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            title="Plus d'options"
          >
            <MoreVertical className="w-4 h-4 text-neutral-400" />
          </button>
        </div>
      </div>
    </div>
  );
});

PatientRow.displayName = 'PatientRow';

export function VirtualPatientList({
  patients,
  height,
  onPatientClick,
  onCallClick,
  onEmailClick,
  onAppointmentClick,
  onFileClick,
  onBillingClick,
}: VirtualPatientListProps) {
  const itemData = {
    patients,
    onPatientClick,
    onCallClick,
    onEmailClick,
    onAppointmentClick,
    onFileClick,
    onBillingClick,
  };

  if (patients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
        <p className="text-lg font-medium">Aucun patient trouvé</p>
        <p className="text-sm mt-1">Essayez d'ajuster vos filtres</p>
      </div>
    );
  }

  return (
    <List
      height={height}
      itemCount={patients.length}
      itemSize={80}
      width="100%"
      itemData={itemData}
      overscanCount={5}
      className="scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-neutral-100"
    >
      {PatientRow}
    </List>
  );
}
