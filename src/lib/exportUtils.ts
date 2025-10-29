import type { Patient, Appointment, SoapNote, InsuranceClaim } from '../types/database';

export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; label: string }[]
): void {
  if (data.length === 0) {
    throw new Error('Aucune donnée à exporter');
  }

  const cols = columns || Object.keys(data[0]).map((key) => ({ key: key as keyof T, label: key }));

  const headers = cols.map((col) => col.label).join(',');

  const rows = data.map((item) =>
    cols
      .map((col) => {
        const value = item[col.key];
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      })
      .join(',')
  );

  const csv = [headers, ...rows].join('\n');

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportPatientsToCSV(patients: Patient[]): void {
  exportToCSV(
    patients,
    `patients_${new Date().toISOString().split('T')[0]}`,
    [
      { key: 'first_name', label: 'Prénom' },
      { key: 'last_name', label: 'Nom' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Téléphone' },
      { key: 'date_of_birth', label: 'Date de naissance' },
      { key: 'status', label: 'Statut' },
      { key: 'total_visits', label: 'Nombre de visites' },
      { key: 'last_visit', label: 'Dernière visite' },
      { key: 'created_at', label: 'Date création' },
    ]
  );
}

export function exportAppointmentsToCSV(appointments: Appointment[]): void {
  exportToCSV(
    appointments,
    `appointments_${new Date().toISOString().split('T')[0]}`,
    [
      { key: 'name', label: 'Nom' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Téléphone' },
      { key: 'reason', label: 'Motif' },
      { key: 'status', label: 'Statut' },
      { key: 'scheduled_date', label: 'Date' },
      { key: 'scheduled_time', label: 'Heure' },
      { key: 'created_at', label: 'Demandé le' },
    ]
  );
}

export function exportToJSON<T>(data: T[], filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.json`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function printPatientReport(patient: Patient, appointments: Appointment[], soapNotes: SoapNote[]): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Impossible d\'ouvrir la fenêtre d\'impression');
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Dossier Patient - ${patient.first_name} ${patient.last_name}</title>
      <style>
        body {
          font-family: system-ui, -apple-system, sans-serif;
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
          color: #0F0F0F;
        }
        h1 { font-size: 28px; margin-bottom: 10px; border-bottom: 2px solid #D4AF37; padding-bottom: 10px; }
        h2 { font-size: 20px; margin-top: 30px; margin-bottom: 15px; color: #57534E; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px; }
        .info-item { padding: 10px; background: #F5F5F4; border-radius: 4px; }
        .label { font-weight: 600; font-size: 12px; color: #78716C; text-transform: uppercase; }
        .value { font-size: 16px; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th { background: #F5F5F4; padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #E7E5E4; }
        td { padding: 12px; border-bottom: 1px solid #E7E5E4; }
        .notes { background: #FAFAF9; padding: 15px; border-left: 3px solid #D4AF37; margin-top: 15px; }
        @media print {
          body { padding: 20px; }
          button { display: none; }
        }
      </style>
    </head>
    <body>
      <h1>Dossier Patient</h1>

      <div class="info-grid">
        <div class="info-item">
          <div class="label">Nom complet</div>
          <div class="value">${patient.first_name} ${patient.last_name}</div>
        </div>
        <div class="info-item">
          <div class="label">Date de naissance</div>
          <div class="value">${patient.date_of_birth || 'Non renseignée'}</div>
        </div>
        <div class="info-item">
          <div class="label">Email</div>
          <div class="value">${patient.email || 'Non renseigné'}</div>
        </div>
        <div class="info-item">
          <div class="label">Téléphone</div>
          <div class="value">${patient.phone || 'Non renseigné'}</div>
        </div>
        <div class="info-item">
          <div class="label">Statut</div>
          <div class="value">${patient.status === 'active' ? 'Actif' : 'Inactif'}</div>
        </div>
        <div class="info-item">
          <div class="label">Total visites</div>
          <div class="value">${patient.total_visits}</div>
        </div>
      </div>

      ${patient.medical_history ? `
        <h2>Historique médical</h2>
        <div class="notes">${patient.medical_history}</div>
      ` : ''}

      ${patient.medications ? `
        <h2>Médicaments</h2>
        <div class="notes">${patient.medications}</div>
      ` : ''}

      ${patient.allergies ? `
        <h2>Allergies</h2>
        <div class="notes">${patient.allergies}</div>
      ` : ''}

      <h2>Rendez-vous (${appointments.length})</h2>
      ${appointments.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Motif</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            ${appointments.map(appt => `
              <tr>
                <td>${appt.scheduled_date || 'Non planifié'}</td>
                <td>${appt.reason}</td>
                <td>${appt.status}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : '<p>Aucun rendez-vous</p>'}

      <h2>Notes SOAP (${soapNotes.length})</h2>
      ${soapNotes.length > 0 ? soapNotes.map(note => `
        <div class="notes" style="margin-bottom: 20px;">
          <strong>Date: ${new Date(note.visit_date).toLocaleDateString('fr-CA')}</strong>
          ${note.subjective ? `<p><strong>Subjectif:</strong> ${note.subjective}</p>` : ''}
          ${note.objective ? `<p><strong>Objectif:</strong> ${note.objective}</p>` : ''}
          ${note.assessment ? `<p><strong>Évaluation:</strong> ${note.assessment}</p>` : ''}
          ${note.plan ? `<p><strong>Plan:</strong> ${note.plan}</p>` : ''}
        </div>
      `).join('') : '<p>Aucune note SOAP</p>'}

      <div style="margin-top: 40px; text-align: center; color: #78716C; font-size: 12px;">
        Rapport généré le ${new Date().toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' })}
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() { window.print(); }, 500);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

export function exportInsuranceClaimsToCSV(claims: InsuranceClaim[]): void {
  exportToCSV(
    claims,
    `insurance_claims_${new Date().toISOString().split('T')[0]}`,
    [
      { key: 'claim_number', label: 'Numéro de réclamation' },
      { key: 'insurance_provider', label: 'Fournisseur' },
      { key: 'policy_number', label: 'Numéro de police' },
      { key: 'service_date', label: 'Date de service' },
      { key: 'submission_date', label: 'Date de soumission' },
      { key: 'claim_amount', label: 'Montant réclamé' },
      { key: 'approved_amount', label: 'Montant approuvé' },
      { key: 'status', label: 'Statut' },
      { key: 'processed_date', label: 'Date de traitement' },
    ]
  );
}

export function generateInsuranceClaimForm(
  claim: InsuranceClaim,
  patient: Patient,
  _provider: string = 'Standard'
): string {
  const formDate = new Date().toLocaleDateString('fr-CA');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Formulaire de réclamation - ${claim.claim_number}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 40px;
          max-width: 850px;
          margin: 0 auto;
          color: #000;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #000;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
        }
        .section {
          margin-bottom: 30px;
          border: 1px solid #ddd;
          padding: 20px;
        }
        .section-title {
          font-size: 16px;
          font-weight: bold;
          background: #f5f5f5;
          padding: 10px;
          margin: -20px -20px 20px -20px;
          border-bottom: 2px solid #000;
        }
        .field-group {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 15px;
        }
        .field {
          margin-bottom: 15px;
        }
        .field-label {
          font-weight: bold;
          font-size: 12px;
          color: #666;
          margin-bottom: 5px;
        }
        .field-value {
          border-bottom: 1px solid #000;
          padding: 5px 0;
          min-height: 20px;
        }
        .full-width {
          grid-column: 1 / -1;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }
        th, td {
          border: 1px solid #000;
          padding: 8px;
          text-align: left;
        }
        th {
          background: #f5f5f5;
          font-weight: bold;
        }
        .signature-line {
          margin-top: 50px;
          border-top: 1px solid #000;
          padding-top: 10px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
        }
        .footer {
          margin-top: 50px;
          text-align: center;
          font-size: 10px;
          color: #666;
        }
        @media print {
          body { padding: 20px; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>FORMULAIRE DE RÉCLAMATION D'ASSURANCE</h1>
        <p>Soins chiropratiques</p>
      </div>

      <div class="section">
        <div class="section-title">1. INFORMATIONS SUR LA RÉCLAMATION</div>
        <div class="field-group">
          <div class="field">
            <div class="field-label">Numéro de réclamation</div>
            <div class="field-value">${claim.claim_number}</div>
          </div>
          <div class="field">
            <div class="field-label">Date de soumission</div>
            <div class="field-value">${new Date(claim.submission_date).toLocaleDateString('fr-CA')}</div>
          </div>
        </div>
        <div class="field-group">
          <div class="field">
            <div class="field-label">Fournisseur d'assurance</div>
            <div class="field-value">${claim.insurance_provider}</div>
          </div>
          <div class="field">
            <div class="field-label">Numéro de police</div>
            <div class="field-value">${claim.policy_number || 'N/A'}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">2. INFORMATIONS SUR LE PATIENT</div>
        <div class="field-group">
          <div class="field">
            <div class="field-label">Nom complet</div>
            <div class="field-value">${patient.first_name} ${patient.last_name}</div>
          </div>
          <div class="field">
            <div class="field-label">Date de naissance</div>
            <div class="field-value">${patient.date_of_birth || 'N/A'}</div>
          </div>
        </div>
        <div class="field-group">
          <div class="field">
            <div class="field-label">Adresse</div>
            <div class="field-value">${patient.address || 'N/A'}</div>
          </div>
          <div class="field">
            <div class="field-label">Téléphone</div>
            <div class="field-value">${patient.phone || 'N/A'}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">3. DÉTAILS DU TRAITEMENT</div>
        <div class="field-group">
          <div class="field">
            <div class="field-label">Date de service</div>
            <div class="field-value">${new Date(claim.service_date).toLocaleDateString('fr-CA')}</div>
          </div>
          <div class="field">
            <div class="field-label">Type de réclamation</div>
            <div class="field-value">${claim.claim_type}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Code diagnostique</th>
              <th>Code de procédure</th>
              <th>Montant</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${claim.diagnostic_codes?.join(', ') || 'N/A'}</td>
              <td>${claim.procedure_codes?.join(', ') || 'N/A'}</td>
              <td>${claim.claim_amount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="section">
        <div class="section-title">4. RÉCAPITULATIF FINANCIER</div>
        <div class="field-group">
          <div class="field">
            <div class="field-label">Montant total réclamé</div>
            <div class="field-value">${claim.claim_amount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</div>
          </div>
          <div class="field">
            <div class="field-label">Statut</div>
            <div class="field-value">${claim.status.toUpperCase()}</div>
          </div>
        </div>
        ${claim.approved_amount ? `
          <div class="field-group">
            <div class="field">
              <div class="field-label">Montant approuvé</div>
              <div class="field-value">${claim.approved_amount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</div>
            </div>
            <div class="field">
              <div class="field-label">Date de traitement</div>
              <div class="field-value">${claim.processed_date ? new Date(claim.processed_date).toLocaleDateString('fr-CA') : 'En attente'}</div>
            </div>
          </div>
        ` : ''}
      </div>

      <div class="signature-line">
        <div>
          <div class="field-label">Signature du praticien</div>
          <div style="height: 60px;"></div>
          <div>Date: ${formDate}</div>
        </div>
        <div>
          <div class="field-label">Signature du patient</div>
          <div style="height: 60px;"></div>
          <div>Date: ${formDate}</div>
        </div>
      </div>

      <div class="footer">
        <p>Ce formulaire a été généré automatiquement par ChiroFlow AI</p>
        <p>Veuillez vérifier toutes les informations avant soumission</p>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() { window.print(); }, 500);
        };
      </script>
    </body>
    </html>
  `;

  return html;
}

export function printInsuranceClaimForm(claim: InsuranceClaim, patient: Patient): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Impossible d\'ouvrir la fenêtre d\'impression');
  }

  const html = generateInsuranceClaimForm(claim, patient);
  printWindow.document.write(html);
  printWindow.document.close();
}

export function exportClaimForProvider(
  claim: InsuranceClaim,
  patient: Patient,
  providerType: 'sunlife' | 'manulife' | 'desjardins' | 'bluecross' | 'standard'
): void {
  const formatters: Record<string, (c: InsuranceClaim, p: Patient) => any> = {
    sunlife: (c, p) => ({
      claimNumber: c.claim_number,
      policyNumber: c.policy_number,
      patientName: `${p.first_name} ${p.last_name}`,
      dateOfBirth: p.date_of_birth,
      serviceDate: c.service_date,
      diagnosticCodes: c.diagnostic_codes,
      procedureCodes: c.procedure_codes,
      amount: c.claim_amount,
      providerName: 'Clinique Chiropratique',
      submissionDate: c.submission_date
    }),
    manulife: (c, p) => ({
      claim_id: c.claim_number,
      policy_id: c.policy_number,
      patient_first_name: p.first_name,
      patient_last_name: p.last_name,
      patient_dob: p.date_of_birth,
      service_date: c.service_date,
      diagnosis_codes: c.diagnostic_codes?.join('|'),
      procedure_codes: c.procedure_codes?.join('|'),
      claim_amount: c.claim_amount,
      submission_date: c.submission_date
    }),
    desjardins: (c, p) => ({
      numeroDemande: c.claim_number,
      numeroPolice: c.policy_number,
      nomPatient: `${p.last_name}, ${p.first_name}`,
      dateNaissance: p.date_of_birth,
      dateService: c.service_date,
      codesDiagnostic: c.diagnostic_codes,
      codesProcedure: c.procedure_codes,
      montant: c.claim_amount
    }),
    bluecross: (c, p) => ({
      ClaimReference: c.claim_number,
      PolicyNumber: c.policy_number,
      MemberName: `${p.first_name} ${p.last_name}`,
      MemberDOB: p.date_of_birth,
      TreatmentDate: c.service_date,
      DiagnosisCodes: c.diagnostic_codes,
      ServiceCodes: c.procedure_codes,
      TotalAmount: c.claim_amount,
      ProviderID: 'CHIRO001'
    }),
    standard: (c, p) => ({
      claim_number: c.claim_number,
      policy_number: c.policy_number,
      patient_name: `${p.first_name} ${p.last_name}`,
      date_of_birth: p.date_of_birth,
      service_date: c.service_date,
      diagnostic_codes: c.diagnostic_codes,
      procedure_codes: c.procedure_codes,
      amount: c.claim_amount,
      status: c.status
    })
  };

  const formatter = formatters[providerType] || formatters.standard;
  const data = formatter(claim, patient);

  exportToJSON(
    [data],
    `${providerType}_claim_${claim.claim_number}_${new Date().toISOString().split('T')[0]}`
  );
}

export function generateBatchClaimsExport(
  claims: InsuranceClaim[],
  patients: Map<string, Patient>,
  format: 'csv' | 'json' = 'csv'
): void {
  const claimsWithPatients = claims.map(claim => {
    const patient = patients.get(claim.patient_id);
    return {
      claim_number: claim.claim_number,
      patient_name: patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown',
      insurance_provider: claim.insurance_provider,
      policy_number: claim.policy_number || '',
      service_date: claim.service_date,
      submission_date: claim.submission_date,
      claim_amount: claim.claim_amount,
      approved_amount: claim.approved_amount || 0,
      status: claim.status,
      diagnostic_codes: claim.diagnostic_codes?.join('|') || '',
      procedure_codes: claim.procedure_codes?.join('|') || ''
    };
  });

  const filename = `batch_claims_${new Date().toISOString().split('T')[0]}`;

  if (format === 'csv') {
    exportToCSV(claimsWithPatients, filename);
  } else {
    exportToJSON(claimsWithPatients, filename);
  }
}
