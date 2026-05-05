'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { Panel } from './Panel';
import { Badge } from './Badge';
import { aiApi, type AiChatSession, type AiChatMessage } from '@/lib/ai-api';
import type { SupportSession, AuthIdentity } from '@/lib/api';
import { ApiClientError } from '@/lib/api';

export function ChatPanel({
  session,
  identity,
}: {
  session?: SupportSession;
  identity: AuthIdentity;
}) {
  const [chatSession, setChatSession] = useState<AiChatSession | undefined>(undefined);
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const canChat = identity.permissions.includes('*') || identity.permissions.includes('ai:chat');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleCreateSession = useCallback(async () => {
    if (!session || !canChat) return;
    setCreating(true);
    setError(null);
    try {
      const chat = await aiApi.createChatSession(session.id, {
        title: `Chat for ${session.title}`,
      });
      setChatSession(chat);
      setMessages(chat.messages);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to create chat session');
    } finally {
      setCreating(false);
    }
  }, [session, canChat]);

  const handleSend = useCallback(async () => {
    if (!session || !chatSession || !input.trim() || !canChat) return;
    setLoading(true);
    setError(null);
    try {
      const result = await aiApi.sendChatMessage(session.id, chatSession.id, {
        content: input.trim(),
        role: 'user',
      });
      setMessages(result.session.messages);
      setChatSession(result.session);
      setInput('');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to send message');
    } finally {
      setLoading(false);
    }
  }, [session, chatSession, input, canChat]);

  const getProviderLabel = (msg: AiChatMessage) => {
    if (msg.role !== 'assistant') return null;
    const provider = msg.provider ?? 'mock';
    const fallback = msg.usageMetadata?.fallbackUsed === true;
    if (provider === 'ollama') {
      return fallback ? 'Ollama local / fallback' : 'Ollama local / real host';
    }
    if (provider === 'lmstudio') {
      return fallback ? 'LM Studio local / fallback' : 'LM Studio local / real host';
    }
    return fallback ? 'Mock / fallback' : 'Mock / no real call';
  };

  return (
    <Panel
      title="AI Chat"
      headerRight={
        chatSession ? (
          <Badge variant="success">{chatSession.messages.length} messages</Badge>
        ) : (
          <Badge variant="default">No session</Badge>
        )
      }
    >
      {!session ? (
        <div className="rounded border border-cockpit-600 bg-cockpit-900/50 px-3 py-4 text-center text-sm text-cockpit-400">
          Select a session to start AI chat.
        </div>
      ) : !canChat ? (
        <div className="rounded border border-danger/30 bg-danger/10 px-3 py-4 text-center text-sm text-danger">
          You do not have permission to use AI chat.
        </div>
      ) : !chatSession ? (
        <div className="space-y-3">
          <div className="text-xs text-cockpit-400">
            Start a new AI chat session for{' '}
            <span className="text-cockpit-200">{session.title}</span>.
          </div>
          <button
            onClick={handleCreateSession}
            disabled={creating}
            className="inline-flex items-center gap-1.5 rounded bg-accent px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creating ? <Loader2 size={12} className="animate-spin" /> : <Bot size={12} />}
            Start AI chat
          </button>
          {error && (
            <div className="rounded border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
              {error}
            </div>
          )}
        </div>
      ) : (
        <div className="flex h-80 flex-col gap-2">
          <div className="flex-1 overflow-y-auto rounded border border-cockpit-700 bg-cockpit-900/30 p-2">
            {messages.length === 0 && (
              <div className="py-4 text-center text-xs text-cockpit-400">
                No messages yet. Send a message to start the conversation.
              </div>
            )}
            <div className="space-y-2">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-xs ${
                      msg.role === 'user'
                        ? 'bg-accent/20 text-cockpit-100'
                        : 'bg-cockpit-800 text-cockpit-100'
                    }`}
                  >
                    <div className="mb-1 flex items-center gap-1.5">
                      {msg.role === 'user' ? (
                        <User size={10} className="text-cockpit-400" />
                      ) : (
                        <Bot size={10} className="text-cockpit-400" />
                      )}
                      <span className="text-[10px] font-medium uppercase text-cockpit-400">
                        {msg.role}
                      </span>
                      {msg.role === 'assistant' && (
                        <span className="text-[10px] text-amber-300">{getProviderLabel(msg)}</span>
                      )}
                    </div>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {error && (
            <div className="rounded border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type a message..."
              disabled={loading}
              className="flex-1 rounded border border-cockpit-600 bg-cockpit-900 px-3 py-2 text-xs text-cockpit-100 placeholder:text-cockpit-400 focus:border-accent focus:outline-none"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="inline-flex items-center gap-1.5 rounded bg-accent px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              Send
            </button>
          </div>
        </div>
      )}
    </Panel>
  );
}
