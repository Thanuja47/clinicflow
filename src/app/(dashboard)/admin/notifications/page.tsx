'use client';
import { useState, useEffect, useCallback } from 'react';
import { Send, CheckCircle2, XCircle, RefreshCw, Smartphone, MessageCircle } from 'lucide-react';

interface NotificationLog {
  id: string;
  channel: 'SMS' | 'WHATSAPP';
  type: 'CONFIRMATION' | 'REMINDER' | 'QUEUE_UPDATE';
  status: string;
  sentAt: string;
  patient?: { fullName: string; phone: string };
}

export default function NotificationLogsPage() {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [filterChannel, setFilterChannel] = useState('');
  const [loading, setLoading] = useState(true);

  // Send Test Message State
  const [recipient, setRecipient] = useState('');
  const [channel, setChannel] = useState<'SMS' | 'WHATSAPP'>('SMS');
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/api/notifications/logs';
      if (filterChannel) url += `?channel=${filterChannel}`;
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filterChannel]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  async function handleSendTestMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!recipient || !messageText) {
      setErrorMsg('Recipient phone and message content are required');
      return;
    }

    setSending(true);
    setErrorMsg('');
    setSuccessMsg('');

    const endpoint = channel === 'SMS' ? '/api/notifications/sms' : '/api/notifications/whatsapp';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipient,
          message: messageText,
          type: 'REMINDER',
        }),
      });

      const data = await res.json();
      if (!res.ok || data.status === 'FAILED') {
        throw new Error(data.error || 'Failed to dispatch message');
      }

      setSuccessMsg(`Test ${channel} notification dispatched successfully to ${recipient}!`);
      setRecipient('');
      setMessageText('');
      fetchLogs();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Failed to send notification');
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="apple-title flex items-center gap-2">
            SMS & WhatsApp Notifications Desk
          </h1>
          <p className="apple-caption mt-1">
            Monitor SMSGo.lk logs and send automated patient appointment updates
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="apple-btn-secondary text-xs flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Audit Logs
        </button>
      </div>

      {/* Grid: Dispatch Form & Log History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Quick Dispatch Form */}
        <div className="apple-card p-6 space-y-4">
          <div className="border-b border-apple-border pb-3">
            <h2 className="apple-section-header flex items-center gap-2">
              <Send className="w-4 h-4 text-apple-blue" /> Dispatch Direct Message
            </h2>
            <p className="apple-caption mt-0.5">Send an instant SMS or WhatsApp reminder</p>
          </div>

          <form onSubmit={handleSendTestMessage} className="space-y-4">
            {successMsg && (
              <div className="p-3 bg-apple-green/10 border border-apple-green/20 rounded-apple-md text-apple-green text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-apple-red/10 border border-apple-red/20 rounded-apple-md text-apple-red text-xs font-medium flex items-center gap-2">
                <XCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block apple-caption mb-1 font-medium">
                Channel
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setChannel('SMS')}
                  className={`p-2.5 rounded-apple-md text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                    channel === 'SMS'
                      ? 'bg-apple-blue/10 text-apple-blue border-apple-blue/30'
                      : 'bg-apple-secondary text-apple-muted border-apple-border'
                  }`}
                >
                  <Smartphone className="w-4 h-4" /> SMS (SMSGo.lk)
                </button>
                <button
                  type="button"
                  onClick={() => setChannel('WHATSAPP')}
                  className={`p-2.5 rounded-apple-md text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                    channel === 'WHATSAPP'
                      ? 'bg-apple-green/10 text-apple-green border-apple-green/30'
                      : 'bg-apple-secondary text-apple-muted border-apple-border'
                  }`}
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </button>
              </div>
            </div>

            <div>
              <label className="block apple-caption mb-1 font-medium">
                Recipient mobile number *
              </label>
              <input
                type="text"
                placeholder="e.g. 0771234567 or 94771234567"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full apple-input"
                required
              />
            </div>

            <div>
              <label className="block apple-caption mb-1 font-medium">
                Message content *
              </label>
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type appointment notification or reminder..."
                className="w-full apple-input resize-none"
                rows={4}
                required
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="apple-btn-primary w-full py-2.5 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {sending ? 'Dispatching...' : `Send ${channel} Message`}
            </button>
          </form>
        </div>

        {/* Right Column: Notification Logs Table */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <div className="apple-card p-4 flex justify-between items-center">
            <span className="text-sm font-semibold text-apple-text">Notification Logs History</span>

            <select
              value={filterChannel}
              onChange={(e) => setFilterChannel(e.target.value)}
              className="apple-input text-xs"
            >
              <option value="">All channels</option>
              <option value="SMS">SMS</option>
              <option value="WHATSAPP">WhatsApp</option>
            </select>
          </div>

          {/* Table */}
          <div className="apple-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-apple-text">
                <thead>
                  <tr className="border-b border-apple-border text-apple-muted text-xs font-semibold">
                    <th className="px-6 py-3.5">Channel</th>
                    <th className="px-6 py-3.5">Type</th>
                    <th className="px-6 py-3.5">Patient / Recipient</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Sent At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-apple-border">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center apple-caption">
                        No notification logs recorded yet.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-apple-secondary/40 transition-colors">
                        <td className="px-6 py-4">
                          <span
                            className={`apple-pill ${
                              log.channel === 'SMS' ? 'apple-pill-blue' : 'apple-pill-green'
                            }`}
                          >
                            {log.channel}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-apple-text">
                          {log.type}
                        </td>
                        <td className="px-6 py-4 text-xs text-apple-text">
                          {log.patient ? (
                            <div>
                              <div className="font-semibold text-apple-text">{log.patient.fullName}</div>
                              <div className="text-apple-muted">{log.patient.phone}</div>
                            </div>
                          ) : (
                            <span className="text-apple-muted">Direct Recipient</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`apple-pill ${
                              log.status === 'SENT' ? 'apple-pill-green' : 'apple-pill-red'
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-apple-muted">
                          {new Date(log.sentAt).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
