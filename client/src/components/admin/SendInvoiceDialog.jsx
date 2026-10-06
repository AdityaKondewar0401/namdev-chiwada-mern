import { useState } from 'react';
import { Send, Paperclip } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminSheet from './AdminSheet';
import { apiErrorMessage } from '../../utils/pdfDownload';

/**
 * @param {{ label: string, defaultEmail?: string, onSend: (data: {to: string, message: string}) => Promise<any>, onClose: () => void, onSent?: () => void }} props
 *   `label` names what is being sent, e.g. "Invoice NC/26-27/0001" or "Order #2D518807".
 */
export default function SendInvoiceDialog({ label, defaultEmail = '', onSend, onClose, onSent }) {
  const [to, setTo] = useState(defaultEmail);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to.trim())) {
      setError('Enter a valid email address');
      return;
    }
    setSending(true);
    try {
      const res = await onSend({ to: to.trim(), message: message.trim() });
      toast.success(res?.data?.message || 'Invoice sent');
      onSent?.();
      onClose();
    } catch (err) {
      setError(await apiErrorMessage(err, "The invoice couldn't be sent. Try again."));
    } finally {
      setSending(false);
    }
  };

  return (
    <AdminSheet title="Send invoice" onClose={onClose} maxWidth="sm:max-w-md">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <p className="text-sm text-brown-mid/80">
          {label} will be emailed with the invoice attached as a PDF.
        </p>

        <div>
          <label htmlFor="send-to" className="block text-xs font-bold text-brown-dark mb-1.5">Customer email</label>
          <input id="send-to" type="email" className="form-input w-full" value={to} autoFocus
            placeholder="customer@example.com"
            onChange={(e) => { setTo(e.target.value); setError(''); }} />
        </div>

        <div>
          <label htmlFor="send-message" className="block text-xs font-bold text-brown-dark mb-1.5">
            Personal note <span className="font-normal text-brown-mid/60">(optional)</span>
          </label>
          <textarea id="send-message" rows={3} maxLength={1000} className="form-input w-full resize-none" value={message}
            placeholder="Thank you for your order. The balance is due within 15 days."
            onChange={(e) => setMessage(e.target.value)} />
        </div>

        <div className="flex items-center gap-2 text-xs text-brown-mid/70 bg-cream-mid/60 rounded-xl px-3 py-2.5">
          <Paperclip size={14} className="flex-shrink-0" /> The invoice PDF is attached automatically.
        </div>

        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={sending}
          className="w-full inline-flex items-center justify-center gap-2 rounded-full font-bold text-white text-sm min-h-[44px] disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg,#e07000,#ff9010)' }}>
          <Send size={15} /> {sending ? 'Sending…' : 'Send invoice'}
        </button>
      </form>
    </AdminSheet>
  );
}
