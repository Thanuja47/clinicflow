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
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            SMS & WhatsApp Notifications Desk
          </h1>
          <p className="text-slate-400 text-sm">
            Monitor SMSGo.lk logs and send automated patient appointment updates
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors flex items-center gap-2 text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Audit Logs
        </button>
      </div>

      {/* Grid: Dispatch Form & Log History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Quick Dispatch Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-400" /> Dispatch Direct Message
            </h2>
            <p className="text-xs text-slate-400">Send an instant SMS or WhatsApp reminder</p>
          </div>

          <form onSubmit={handleSendTestMessage} className="space-y-4">
            {successMsg && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-rose-950/60 border border-rose-500/30 rounded-lg text-rose-400 text-xs flex items-center gap-2">
                <XCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Channel
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setChannel('SMS')}
                  className={`p-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border transition-colors ${
                    channel === 'SMS'
                      ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  <Smartphone className="w-4 h-4" /> SMS (SMSGo.lk)
                </button>
                <button
                  type="button"
                  onClick={() => setChannel('WHATSAPP')}
                  className={`p-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border transition-colors ${
                    channel === 'WHATSAPP'
                      ? 'bg-green-600/20 text-green-400 border-green-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Recipient Mobile Number *
              </label>
              <input
                type="text"
                placeholder="e.g. 0771234567 or 94771234567"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Message Content *
              </label>
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type appointment notification or reminder..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                rows={4}
                required
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {sending ? 'Dispatching...' : `Send ${channel} Message`}
            </button>
          </form>
        </div>

        {/* Right Column: Notification Logs Table */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex justify-between items-center">
            <span className="text-sm font-semibold text-slate-300">Notification Logs History</span>

            <select
              value={filterChannel}
              onChange={(e) => setFilterChannel(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Channels</option>
              <option value="SMS">SMS</option>
              <option value="WHATSAPP">WhatsApp</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Channel</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Patient / Recipient</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Sent At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                        No notification logs recorded yet.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold ${
                              log.channel === 'SMS'
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                : 'bg-green-500/10 text-green-400 border border-green-500/20'
                            }`}
                          >
                            {log.channel}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-slate-300">
                          {log.type}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-200">
                          {log.patient ? (
                            <div>
                              <div className="font-sans text-sm font-medium text-slate-100">{log.patient.fullName}</div>
                              <div className="text-slate-400">{log.patient.phone}</div>
                            </div>
                          ) : (
                            <span className="text-slate-400">Direct Recipient</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                              log.status === 'SENT'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400">
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
