import React, { useEffect, useRef, useState } from 'react';
import { chatbotAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';

const PUBLIC_QUICK_QUESTIONS = [
  'What is Mareko Special Woreda?',
  'Where is the woreda office (Koshe)?',
  'How do I register as a resident?',
  'What services are available in Mareko?',
  'How do I report a community issue?'
];

const RESIDENT_QUICK_QUESTIONS = [
  'About Mareko Wereda and Koshe',
  'How do I submit a service request?',
  'How do I track my report status?',
  'Where can I see announcements and events?',
  'How do I contact the woreda office?'
];

const ResidentChatbotWidget = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [showQuickQuestions, setShowQuickQuestions] = useState(true);
  const endRef = useRef(null);

  const canSend = input.trim().length > 0 && !loading;
  const isResident = user?.role === 'resident';
  const isLandingPage = location.pathname === '/';
  const shouldRender = isResident || isLandingPage;
  const chatContextKey = isResident ? `resident-${user?._id || 'unknown'}` : 'public-landing';

  const quickQuestions = isResident ? RESIDENT_QUICK_QUESTIONS : PUBLIC_QUICK_QUESTIONS;

  const welcomeMessage = isResident
    ? `Hello${user?.fullName ? ` ${user.fullName}` : ''}. Ask me about Mareko Wereda, local services, reports, events, announcements, and platform guidance—or tap a suggested question below.`
    : 'Hello Visitor! Welcome to Mareko Special Woreda Administration. Ask about Mareko Wereda, Koshe, services, reports, announcements, events, and using the citizen platform—or tap a suggested question below.';

  useEffect(() => {
    if (!shouldRender) return;

    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        text: welcomeMessage
      }
    ]);
    setInput('');
    setLoading(false);
    setShowQuickQuestions(true);
  }, [chatContextKey, shouldRender, welcomeMessage]);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  };

  const appendMessage = (role, text) => {
    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, role, text }
    ]);
  };

  const sendQuestion = async (question) => {
    const trimmed = String(question || '').trim();
    if (!trimmed || loading) return;

    appendMessage('user', trimmed);
    setInput('');
    setLoading(true);
    scrollToBottom();

    try {
      const response = isResident
        ? await chatbotAPI.ask(trimmed)
        : await chatbotAPI.askPublic(trimmed);
      const answer = response?.data?.data?.answer || 'Chatbot is currently unavailable. Please try again later.';
      appendMessage('assistant', answer);
    } catch (error) {
      appendMessage('assistant', 'Chatbot is currently unavailable. Please try again later.');
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  if (!shouldRender) return null;

  return (
    <>
      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-[92vw] max-w-sm rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between bg-gradient-to-r from-amber-600 to-orange-700 text-white px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Ask Chatbot</p>
              <p className="text-[11px] text-amber-100">
                {isResident ? 'Mareko Wereda · Resident' : 'Mareko Wereda · Public'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md p-1 hover:bg-amber-500/50"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto p-3 space-y-3 bg-gray-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'ml-auto bg-gradient-to-r from-amber-600 to-orange-700 text-white'
                    : 'bg-white border border-gray-200 text-gray-800'
                }`}
              >
                {msg.text}
              </div>
            ))}
            {loading && (
              <div className="max-w-[85%] rounded-xl px-3 py-2 text-sm bg-white border border-gray-200 text-gray-600">
                Thinking...
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="border-t border-gray-200 p-3 space-y-2">
            <button
              type="button"
              onClick={() => {
                setMessages([
                  {
                    id: 'welcome',
                    role: 'assistant',
                    text: welcomeMessage
                  }
                ]);
                setInput('');
                setShowQuickQuestions(true);
              }}
              className="w-full rounded-lg border border-gray-200 text-gray-700 text-xs font-medium py-2 hover:bg-gray-50"
            >
              Clear chat and restart
            </button>

            {!isResident && isLandingPage && (
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="w-full rounded-lg border border-amber-200 text-amber-800 text-sm font-medium py-2 hover:bg-amber-50"
              >
                Create Resident Account
              </button>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] text-gray-500">Suggested questions (optional)</p>
                <button
                  type="button"
                  onClick={() => setShowQuickQuestions((prev) => !prev)}
                  className="text-[11px] font-medium text-amber-700 hover:text-amber-800 shrink-0"
                >
                  {showQuickQuestions ? 'Hide' : 'Show'}
                </button>
              </div>
              {showQuickQuestions && (
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                  {quickQuestions.map((question) => (
                    <button
                      key={question}
                      type="button"
                      disabled={loading}
                      onClick={() => sendQuestion(question)}
                      className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-left text-[11px] leading-snug text-amber-900 hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendQuestion(input);
              }}
              className="flex items-center gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your question..."
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!canSend}
                className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-amber-600 to-orange-700 text-white p-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PaperAirplaneIcon className="h-4 w-4" />
              </button>
            </form>
            <p className="text-[11px] text-gray-500">
              Ask about Mareko Wereda, Koshe, services, reports, registration, announcements, events, or meetings.
            </p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-600 to-orange-700 text-white px-4 py-3 shadow-lg hover:brightness-110"
      >
        <ChatBubbleLeftRightIcon className="h-5 w-5" />
        <span className="text-sm font-medium">Ask Chatbot</span>
      </button>
    </>
  );
};

export default ResidentChatbotWidget;
