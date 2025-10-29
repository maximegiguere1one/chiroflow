interface InvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  patientAddress: string;
  services: Array<{
    description: string;
    date: string;
    amount: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  paid: number;
  balance: number;
  paymentMethod?: string;
  notes?: string;
}

export function generateInvoiceHTML(data: InvoiceData): string {
  const formatCurrency = (amount: number) => {
    try {
      return new Intl.NumberFormat('fr-CA', {
        style: 'currency',
        currency: 'CAD',
      }).format(amount);
    } catch (e) {
      return `${amount.toFixed(2)} $`;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('fr-CA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      return dateString;
    }
  };

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Facture ${data.invoiceNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #1a1a1a;
      background: white;
      line-height: 1.6;
    }

    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
      background: white;
    }

    .header {
      display: table;
      width: 100%;
      margin-bottom: 2.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 3px solid #C9A55C;
    }

    .logo-section {
      display: table-cell;
      width: 50%;
      vertical-align: top;
    }

    .clinic-name {
      font-size: 2rem;
      font-weight: 700;
      color: #1a1a1a;
      letter-spacing: -0.5px;
      margin-bottom: 0.25rem;
    }

    .clinic-tagline {
      font-size: 0.875rem;
      color: #C9A55C;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .clinic-info {
      display: table-cell;
      width: 50%;
      text-align: right;
      font-size: 0.875rem;
      color: #666;
      line-height: 1.8;
      vertical-align: top;
    }

    .clinic-info strong {
      color: #1a1a1a;
      font-weight: 600;
    }

    .invoice-title {
      text-align: center;
      margin-bottom: 2rem;
    }

    .invoice-title h1 {
      font-size: 2.5rem;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 0.5rem;
      letter-spacing: -1px;
    }

    .invoice-number {
      font-size: 1.125rem;
      color: #666;
      font-weight: 500;
    }

    .invoice-meta {
      display: table;
      width: 100%;
      margin-bottom: 2.5rem;
      padding: 1.5rem;
      background: linear-gradient(135deg, #f8f6f0 0%, #ffffff 100%);
      border-radius: 8px;
      border: 1px solid #e5e5e5;
    }

    .meta-section {
      display: table-cell;
      width: 50%;
      vertical-align: top;
    }

    .meta-section h3 {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #C9A55C;
      font-weight: 600;
      margin-bottom: 0.75rem;
    }

    .meta-section p {
      color: #333;
      font-size: 0.9375rem;
      margin-bottom: 0.25rem;
    }

    .services-table {
      width: 100%;
      margin-bottom: 2rem;
      border-collapse: collapse;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .services-table thead {
      background: linear-gradient(135deg, #1a1a1a 0%, #333 100%);
      color: white;
    }

    .services-table th {
      padding: 1rem;
      text-align: left;
      font-weight: 600;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .services-table th:last-child {
      text-align: right;
    }

    .services-table tbody tr {
      border-bottom: 1px solid #e5e5e5;
    }

    .services-table td {
      padding: 1rem;
      font-size: 0.9375rem;
    }

    .services-table td:last-child {
      text-align: right;
      font-weight: 600;
      color: #1a1a1a;
    }

    .date-cell {
      color: #666;
      font-size: 0.875rem;
    }

    .totals-section {
      margin-left: auto;
      width: 350px;
      margin-bottom: 2rem;
    }

    .total-row {
      display: table;
      width: 100%;
      padding: 0.75rem 1.25rem;
      border-bottom: 1px solid #e5e5e5;
      font-size: 0.9375rem;
    }

    .total-row span {
      display: table-cell;
    }

    .total-row span:last-child {
      text-align: right;
    }

    .total-row.subtotal {
      color: #666;
    }

    .total-row.tax {
      color: #666;
      font-size: 0.875rem;
    }

    .total-row.grand-total {
      background: linear-gradient(135deg, #1a1a1a 0%, #333 100%);
      color: white;
      font-size: 1.125rem;
      font-weight: 700;
      border: none;
      margin-top: 0.5rem;
      border-radius: 6px;
    }

    .total-row.paid {
      background: linear-gradient(135deg, #2d7a3e 0%, #35a34a 100%);
      color: white;
      font-weight: 600;
      border: none;
      border-radius: 4px;
      margin-top: 0.25rem;
    }

    .total-row.balance {
      background: linear-gradient(135deg, #C9A55C 0%, #d4b36a 100%);
      color: white;
      font-size: 1.25rem;
      font-weight: 700;
      border: none;
      margin-top: 0.5rem;
      border-radius: 6px;
      padding: 1rem 1.25rem;
    }

    .notes-section {
      margin-top: 2rem;
      padding: 1.5rem;
      background: #f8f6f0;
      border-left: 4px solid #C9A55C;
      border-radius: 4px;
    }

    .notes-section h3 {
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #C9A55C;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    .notes-section p {
      color: #555;
      font-size: 0.9375rem;
      line-height: 1.6;
    }

    .footer {
      margin-top: 3rem;
      padding-top: 1.5rem;
      border-top: 2px solid #e5e5e5;
      text-align: center;
      color: #666;
      font-size: 0.875rem;
    }

    .footer p {
      margin-bottom: 0.5rem;
    }

    .footer strong {
      color: #C9A55C;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div class="logo-section">
        <div class="clinic-name">Dr. Janie Leblanc</div>
        <div class="clinic-tagline">Chiropraticienne</div>
      </div>
      <div class="clinic-info">
        <strong>Clinique Chiropratique Janie Leblanc</strong><br>
        123 Rue Principale, Suite 200<br>
        Montréal, QC H1A 1A1<br>
        <strong>Tél:</strong> (514) 555-0123<br>
        <strong>Email:</strong> info@cliniquejanie.com
      </div>
    </div>

    <div class="invoice-title">
      <h1>FACTURE</h1>
      <div class="invoice-number">${data.invoiceNumber}</div>
    </div>

    <div class="invoice-meta">
      <div class="meta-section">
        <h3>Facturé à</h3>
        <p><strong>${data.patientName}</strong></p>
        <p>${data.patientAddress}</p>
        <p>${data.patientEmail}</p>
        <p>${data.patientPhone}</p>
      </div>
      <div class="meta-section">
        <h3>Détails de facturation</h3>
        <p><strong>Date de facture:</strong> ${formatDate(data.date)}</p>
        <p><strong>Date d'échéance:</strong> ${formatDate(data.dueDate)}</p>
        ${data.paymentMethod ? `<p><strong>Méthode de paiement:</strong> ${data.paymentMethod}</p>` : ''}
      </div>
    </div>

    <table class="services-table">
      <thead>
        <tr>
          <th>Description du service</th>
          <th>Date</th>
          <th>Montant</th>
        </tr>
      </thead>
      <tbody>
        ${data.services.map(service => `
          <tr>
            <td>${service.description}</td>
            <td class="date-cell">${formatDate(service.date)}</td>
            <td>${formatCurrency(service.amount)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="totals-section">
      <div class="total-row subtotal">
        <span>Sous-total</span>
        <span>${formatCurrency(data.subtotal)}</span>
      </div>
      <div class="total-row tax">
        <span>TPS/TVQ (${((data.tax / data.subtotal) * 100).toFixed(2)}%)</span>
        <span>${formatCurrency(data.tax)}</span>
      </div>
      <div class="total-row grand-total">
        <span>TOTAL</span>
        <span>${formatCurrency(data.total)}</span>
      </div>
      ${data.paid > 0 ? `
        <div class="total-row paid">
          <span>Payé</span>
          <span>-${formatCurrency(data.paid)}</span>
        </div>
      ` : ''}
      ${data.balance > 0 ? `
        <div class="total-row balance">
          <span>SOLDE DÛ</span>
          <span>${formatCurrency(data.balance)}</span>
        </div>
      ` : ''}
    </div>

    ${data.notes ? `
      <div class="notes-section">
        <h3>Notes</h3>
        <p>${data.notes}</p>
      </div>
    ` : ''}

    <div class="footer">
      <p><strong>Merci de votre confiance!</strong></p>
      <p>Pour toute question concernant cette facture, veuillez nous contacter au (514) 555-0123</p>
      <p style="margin-top: 1rem; color: #999; font-size: 0.8125rem;">
        Cette facture a été générée électroniquement et est valide sans signature.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
