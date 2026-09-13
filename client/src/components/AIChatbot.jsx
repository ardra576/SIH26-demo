import React, { useState } from 'react';
import { Send, MessageCircle } from 'lucide-react';

/**
 * AIChatbot – floating button that opens a simple chat panel.
 * Sends user messages to the backend /api/chat endpoint.
 */
export default function AIChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]); // {role: 'user'|'bot', text: string}
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const toggle = () => setOpen(!open);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);
    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      });
      const data = await resp.json();
      const botReply = data.reply || 'Sorry, I could not respond.';
      setMessages(prev => [...prev, { role: 'bot', text: botReply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'bot', text: 'Error contacting AI service.' }]);
    }
    setLoading(false);
  };

  const handleKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={toggle}
        className="fixed bottom-6 right-6 bg-purple-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-purple-500 transition"
        aria-label="Open AI Assistant"
      >
        <MessageCircle size={24} />
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 w-80 max-h-[70vh] bg-gray-900 text-white rounded-lg shadow-xl flex flex-col" style={{ backdropFilter: 'blur(8px)' }}>
          <div className="flex items-center justify-between p-3 border-b border-gray-700">
            <h4 className="font-semibold">SkillBridge AI Assistant</h4>
            <button onClick={toggle} className="text-gray-400 hover:text-gray-200">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`rounded px-3 py-2 max-w-xs ${msg.role === 'user' ? 'bg-purple-600' : 'bg-gray-800'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start"><div className="bg-gray-800 rounded px-3 py-2 max-w-xs">Typing...</div></div>
            )}
          </div>
          <div className="p-3 border-t border-gray-700 flex items-center">
            <textarea
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              className="flex-1 bg-gray-800 text-white rounded-md p-2 mr-2 focus:outline-none"
              placeholder="Ask something…"
            />
            <button onClick={sendMessage} disabled={loading} className="p-2 bg-purple-600 rounded-full hover:bg-purple-500 disabled:opacity-50">
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
