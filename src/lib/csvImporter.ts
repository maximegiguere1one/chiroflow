import { supabase } from './supabase';

export interface CSVImportResult {
  success: number;
  errors: Array<{ row: number; error: string; data: any }>;
  duplicates: number;
}

export interface CSVColumn {
  csvHeader: string;
  dbField: string;
  required?: boolean;
  transform?: (value: string) => any;
  validate?: (value: string) => boolean;
}

function parseCSV(csvText: string): string[][] {
  const lines: string[][] = [];
  let currentField = '';
  let currentLine: string[] = [];
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentLine.push(currentField.trim());
      currentField = '';
    } else if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      if (currentField || currentLine.length > 0) {
        currentLine.push(currentField.trim());
        if (currentLine.some(field => field !== '')) {
          lines.push(currentLine);
        }
        currentLine = [];
        currentField = '';
      }
    } else {
      currentField += char;
    }
  }

  if (currentField || currentLine.length > 0) {
    currentLine.push(currentField.trim());
    if (currentLine.some(field => field !== '')) {
      lines.push(currentLine);
    }
  }

  return lines;
}

function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .trim()
    .replace(/[éèê]/g, 'e')
    .replace(/[àâ]/g, 'a')
    .replace(/[îï]/g, 'i')
    .replace(/[ôö]/g, 'o')
    .replace(/[ùûü]/g, 'u')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

const patientColumnMappings: CSVColumn[] = [
  { csvHeader: 'prenom', dbField: 'first_name', required: true },
  { csvHeader: 'nom', dbField: 'last_name', required: true },
  { csvHeader: 'email', dbField: 'email', required: false, validate: (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) },
  { csvHeader: 'telephone', dbField: 'phone', required: false },
  { csvHeader: 'date_de_naissance', dbField: 'date_of_birth', required: false },
  { csvHeader: 'adresse', dbField: 'address', required: false },
  { csvHeader: 'ville', dbField: 'city', required: false },
  { csvHeader: 'code_postal', dbField: 'postal_code', required: false },
  { csvHeader: 'statut', dbField: 'status', required: false, transform: (v) => v || 'active' },
  { csvHeader: 'numero_dassurance', dbField: 'insurance_number', required: false },
  { csvHeader: 'fournisseur_assurance', dbField: 'insurance_provider', required: false },
  { csvHeader: 'historique_medical', dbField: 'medical_history', required: false },
  { csvHeader: 'medicaments', dbField: 'medications', required: false },
  { csvHeader: 'allergies', dbField: 'allergies', required: false },
  { csvHeader: 'notes', dbField: 'notes', required: false },
];

const appointmentColumnMappings: CSVColumn[] = [
  { csvHeader: 'nom', dbField: 'name', required: true },
  { csvHeader: 'email', dbField: 'email', required: true, validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) },
  { csvHeader: 'telephone', dbField: 'phone', required: true },
  { csvHeader: 'motif', dbField: 'reason', required: true },
  { csvHeader: 'date', dbField: 'scheduled_date', required: false },
  { csvHeader: 'heure', dbField: 'scheduled_time', required: false },
  { csvHeader: 'statut', dbField: 'status', required: false, transform: (v) => v || 'pending' },
  { csvHeader: 'notes', dbField: 'notes', required: false },
];

export async function importPatientsFromCSV(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<CSVImportResult> {
  const result: CSVImportResult = {
    success: 0,
    errors: [],
    duplicates: 0,
  };

  try {
    const csvText = await file.text();
    const lines = parseCSV(csvText);

    if (lines.length < 2) {
      throw new Error('Le fichier CSV doit contenir au moins une ligne d\'en-tête et une ligne de données');
    }

    const headers = lines[0].map(normalizeHeader);
    const dataLines = lines.slice(1);

    const columnMap = new Map<string, number>();
    patientColumnMappings.forEach(mapping => {
      const index = headers.findIndex(h => {
        const normalized = normalizeHeader(mapping.csvHeader);
        return h === normalized || h.includes(normalized) || normalized.includes(h);
      });
      if (index >= 0) {
        columnMap.set(mapping.dbField, index);
      }
    });

    const requiredColumns = patientColumnMappings.filter(m => m.required);
    const missingRequired = requiredColumns.filter(col => !columnMap.has(col.dbField));
    if (missingRequired.length > 0) {
      throw new Error(`Colonnes requises manquantes: ${missingRequired.map(c => c.csvHeader).join(', ')}`);
    }

    const { data: existingPatients } = await supabase
      .from('patients_full')
      .select('email, first_name, last_name');

    const existingEmails = new Set(
      (existingPatients || [])
        .filter(p => p.email)
        .map(p => p.email.toLowerCase())
    );

    const existingNames = new Set(
      (existingPatients || []).map(p => `${p.first_name}|${p.last_name}`.toLowerCase())
    );

    for (let i = 0; i < dataLines.length; i++) {
      const rowNum = i + 2;
      const line = dataLines[i];

      try {
        if (onProgress) {
          onProgress(i + 1, dataLines.length);
        }

        const patientData: any = {};

        patientColumnMappings.forEach(mapping => {
          const colIndex = columnMap.get(mapping.dbField);
          if (colIndex !== undefined && colIndex < line.length) {
            let value = line[colIndex].trim();

            if (mapping.validate && value && !mapping.validate(value)) {
              throw new Error(`Valeur invalide pour ${mapping.csvHeader}: ${value}`);
            }

            if (mapping.transform) {
              value = mapping.transform(value);
            }

            if (value) {
              patientData[mapping.dbField] = value;
            }
          } else if (mapping.required) {
            throw new Error(`Colonne requise manquante: ${mapping.csvHeader}`);
          }
        });

        if (!patientData.first_name || !patientData.last_name) {
          throw new Error('Prénom et nom sont requis');
        }

        const email = patientData.email?.toLowerCase();
        const fullName = `${patientData.first_name}|${patientData.last_name}`.toLowerCase();

        if (email && existingEmails.has(email)) {
          result.duplicates++;
          continue;
        }

        if (existingNames.has(fullName)) {
          result.duplicates++;
          continue;
        }

        const { error } = await supabase
          .from('patients_full')
          .insert({
            ...patientData,
            total_visits: 0,
            status: patientData.status || 'active',
          });

        if (error) throw error;

        result.success++;

        if (email) existingEmails.add(email);
        existingNames.add(fullName);

      } catch (error: any) {
        result.errors.push({
          row: rowNum,
          error: error.message,
          data: line,
        });
      }
    }

    return result;
  } catch (error: any) {
    throw new Error(`Erreur lors de l'import: ${error.message}`);
  }
}

export async function importAppointmentsFromCSV(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<CSVImportResult> {
  const result: CSVImportResult = {
    success: 0,
    errors: [],
    duplicates: 0,
  };

  try {
    const csvText = await file.text();
    const lines = parseCSV(csvText);

    if (lines.length < 2) {
      throw new Error('Le fichier CSV doit contenir au moins une ligne d\'en-tête et une ligne de données');
    }

    const headers = lines[0].map(normalizeHeader);
    const dataLines = lines.slice(1);

    const columnMap = new Map<string, number>();
    appointmentColumnMappings.forEach(mapping => {
      const index = headers.findIndex(h => {
        const normalized = normalizeHeader(mapping.csvHeader);
        return h === normalized || h.includes(normalized) || normalized.includes(h);
      });
      if (index >= 0) {
        columnMap.set(mapping.dbField, index);
      }
    });

    const requiredColumns = appointmentColumnMappings.filter(m => m.required);
    const missingRequired = requiredColumns.filter(col => !columnMap.has(col.dbField));
    if (missingRequired.length > 0) {
      throw new Error(`Colonnes requises manquantes: ${missingRequired.map(c => c.csvHeader).join(', ')}`);
    }

    for (let i = 0; i < dataLines.length; i++) {
      const rowNum = i + 2;
      const line = dataLines[i];

      try {
        if (onProgress) {
          onProgress(i + 1, dataLines.length);
        }

        const appointmentData: any = {};

        appointmentColumnMappings.forEach(mapping => {
          const colIndex = columnMap.get(mapping.dbField);
          if (colIndex !== undefined && colIndex < line.length) {
            let value = line[colIndex].trim();

            if (mapping.validate && value && !mapping.validate(value)) {
              throw new Error(`Valeur invalide pour ${mapping.csvHeader}: ${value}`);
            }

            if (mapping.transform) {
              value = mapping.transform(value);
            }

            if (value) {
              appointmentData[mapping.dbField] = value;
            }
          } else if (mapping.required) {
            throw new Error(`Colonne requise manquante: ${mapping.csvHeader}`);
          }
        });

        if (!appointmentData.name || !appointmentData.email || !appointmentData.phone || !appointmentData.reason) {
          throw new Error('Nom, email, téléphone et motif sont requis');
        }

        const { error } = await supabase
          .from('appointments_api')
          .insert({
            ...appointmentData,
            status: appointmentData.status || 'pending',
          });

        if (error) throw error;

        result.success++;

      } catch (error: any) {
        result.errors.push({
          row: rowNum,
          error: error.message,
          data: line,
        });
      }
    }

    return result;
  } catch (error: any) {
    throw new Error(`Erreur lors de l'import: ${error.message}`);
  }
}

export function generateCSVTemplate(type: 'patients' | 'appointments'): string {
  const mappings = type === 'patients' ? patientColumnMappings : appointmentColumnMappings;

  const headers = mappings.map(m => m.csvHeader).join(',');

  const exampleData = type === 'patients'
    ? 'Jean,Tremblay,jean.tremblay@example.com,514-555-1234,1980-05-15,123 rue Principale,Montréal,H1A 1A1,active,,,,,Notes exemple'
    : 'Marie Dubois,marie.dubois@example.com,438-555-5678,Douleur lombaire,2025-10-25,10:00,pending,Première visite';

  return `${headers}\n${exampleData}`;
}

export function downloadCSVTemplate(type: 'patients' | 'appointments'): void {
  const csv = generateCSVTemplate(type);
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `template_${type}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
