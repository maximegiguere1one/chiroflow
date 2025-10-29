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
    @page {
      size: letter;
      margin: 0;
    }

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
      max-width: 8.5in;
      margin: 0 auto;
      padding: 0.75in;
      background: white;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 3px solid #C9A55C;
    }

    .logo-section {
      flex: 1;
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
      text-align: right;
      font-size: 0.875rem;
      color: #666;
      line-height: 1.8;
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
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      margin-bottom: 2.5rem;
      padding: 1.5rem;
      background: linear-gradient(135deg, #f8f6f0 0%, #ffffff 100%);
      border-radius: 8px;
      border: 1px solid #e5e5e5;
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
      transition: background 0.2s;
    }

    .services-table tbody tr:hover {
      background: #f8f6f0;
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
      display: flex;
      justify-content: space-between;
      padding: 0.75rem 1.25rem;
      border-bottom: 1px solid #e5e5e5;
      font-size: 0.9375rem;
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

    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }

      .invoice-container {
        padding: 0.5in;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
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

    <!-- Invoice Title -->
    <div class="invoice-title">
      <h1>FACTURE</h1>
      <div class="invoice-number">${data.invoiceNumber}</div>
    </div>

    <!-- Invoice Meta -->
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

    <!-- Services Table -->
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

    <!-- Totals -->
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

    <!-- Notes -->
    ${data.notes ? `
      <div class="notes-section">
        <h3>Notes</h3>
        <p>${data.notes}</p>
      </div>
    ` : ''}

    <!-- Footer -->
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

export function downloadInvoiceAsPDF(data: InvoiceData) {
  const html = generateInvoiceHTML(data);

  // Créer une nouvelle fenêtre pour l'impression
  const printWindow = window.open('', '_blank');

  if (!printWindow) {
    alert('Veuillez autoriser les fenêtres popup pour télécharger la facture.');
    return;
  }

  // Écrire le contenu
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();

  // Attendre que le DOM soit prêt avant d'imprimer
  if (printWindow.document.readyState === 'complete') {
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);
  } else {
    printWindow.addEventListener('load', () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 500);
    });
  }
}

export function previewInvoice(data: InvoiceData) {
  try {
    console.log('=== INVOICE GENERATOR DEBUG ===');
    console.log('Input data:', JSON.stringify(data, null, 2));

    const html = generateInvoiceHTML(data);
    console.log('HTML generated successfully, length:', html.length);
    console.log('First 500 chars:', html.substring(0, 500));

    const previewWindow = window.open('', '_blank', 'width=800,height=1000');

    if (!previewWindow) {
      console.error('Failed to open popup window');
      alert('Veuillez autoriser les fenêtres popup pour prévisualiser la facture.');
      return;
    }

    console.log('Window opened successfully');

    previewWindow.document.open();
    previewWindow.document.write(html);
    previewWindow.document.close();

    console.log('Content written to window');

    // Forcer le focus après un court délai
    setTimeout(() => {
      previewWindow.focus();
      console.log('Window focused');
    }, 100);

    console.log('=== INVOICE PREVIEW COMPLETED ===');
  } catch (error) {
    console.error('=== ERROR IN PREVIEW INVOICE ===');
    console.error('Error details:', error);
    console.error('Stack trace:', (error as Error).stack);
    alert('Erreur lors de la génération de la facture: ' + (error as Error).message);
  }
}
