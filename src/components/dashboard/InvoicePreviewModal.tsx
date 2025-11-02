import { motion } from 'framer-motion';
import { X, Download, Printer } from 'lucide-react';
import { useRef } from 'react';
import { useToastContext } from '../../contexts/ToastContext';
import { generateInvoiceHTML } from '../../lib/invoiceHtmlGenerator';

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

interface InvoicePreviewModalProps {
  data: InvoiceData;
  onClose: () => void;
}

export function InvoicePreviewModal({ data, onClose }: InvoicePreviewModalProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handlePrint = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.print();
    }
  };

  const handleDownload = () => {
    const html = generateInvoiceHTML(data);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Facture-${data.invoiceNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-6xl h-[90vh] flex flex-col shadow-lifted"
      >
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-neutral-50">
          <h3 className="text-lg font-heading text-foreground">Aperçu de la facture</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-white hover:bg-gold-600 transition-colors"
              title="Télécharger"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm">Télécharger</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-700 text-white hover:bg-neutral-800 transition-colors"
              title="Imprimer"
            >
              <Printer className="w-4 h-4" />
              <span className="text-sm">Imprimer</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <iframe
            ref={iframeRef}
            srcDoc={generateInvoiceHTML(data)}
            className="w-full h-full border-0"
            title="Aperçu de la facture"
          />
        </div>
      </motion.div>
    </div>
  );
}
