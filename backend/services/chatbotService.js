const { PromptTemplate } = require('@langchain/core/prompts');
const { StringOutputParser } = require('@langchain/core/output_parsers');
const { RunnableSequence } = require('@langchain/core/runnables');
const { ChatOpenAI } = require('@langchain/openai');

const UNKNOWN_RESPONSE = 'I don\'t know about it. Please contact your Woreda office for assistance.';
const UNAVAILABLE_RESPONSE = 'Chatbot is currently unavailable. Please try again later.';

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'can', 'do', 'for', 'from', 'how', 'i',
  'if', 'in', 'is', 'it', 'me', 'my', 'of', 'on', 'or', 'please', 'system', 'the', 'to',
  'what', 'where', 'when', 'who', 'why', 'with', 'you', 'your'
]);

const GREETING_PATTERNS = [
  /\bhi\b/i,
  /\bhello\b/i,
  /\bhey\b/i,
  /\bgood\s+morning\b/i,
  /\bgood\s+afternoon\b/i,
  /\bgood\s+evening\b/i,
  /\bwelcome\b/i,
  /\bwell\s*come\b/i
];

const THANKS_PATTERNS = [
  /\bthank\s+you\b/i,
  /\bthanks\b/i,
  /\bthank\s*u\b/i,
  /\bthx\b/i,
  /\bmuch\s+appreciated\b/i,
  /\bi\s+appreciate\b/i,
  /\bgrateful\b/i,
  /\bthat\s+helps\b/i
];

const GOODBYE_PATTERNS = [
  /\bgood\s*bye\b/i,
  /\bbye\b/i,
  /\bsee\s+you\b/i,
  /\btake\s+care\b/i,
  /\bcatch\s+you\s+later\b/i,
  /\btalk\s+to\s+you\s+later\b/i,
  /\bhave\s+a\s+(good|nice|great|wonderful)\s+(day|night|evening)\b/i
];

const PLATFORM_OVERVIEW_PATTERNS = [
  /\bwhat\b.*\byegara\b.*\b(do|does|can)\b/i,
  /\bwhat\b.*\bsystem\b.*\b(do|does|can)\b/i,
  /\babout\b.*\byegara\b/i,
  /\bpurpose\b.*\byegara\b/i,
  /\bwhat\b.*\bplatform\b.*\b(do|does|can)\b/i,
  /\bwhat\b.*\bmareko\b/i,
  /\babout\b.*\bmareko\b/i,
  /\babout\b.*\bspecial\s+woreda\b/i
];

const MAREKO_WEREDA_KNOWLEDGE = [
  {
    topic: 'About Mareko Special Woreda',
    keywords: [
      'mareko', 'special', 'woreda', 'wereda', 'about', 'administration', 'local', 'government', 'governance'
    ],
    content:
      'Mareko Special Woreda is the local administration for Mareko Wereda in Central Ethiopia Regional State, named after the Mareko people. This platform is the digital front door for residents to access services, public information, community reports, announcements, and events.'
  },
  {
    topic: 'Administrative center Koshe',
    keywords: ['koshe', 'center', 'centre', 'location', 'where', 'office', 'headquarters', 'map'],
    content:
      'The administrative center of Mareko Special Woreda is Koshe (often shown as Mareko · Koshe on this site). For in-person visits, directions, or official documents, contact or visit the woreda office in Koshe.'
  },
  {
    topic: 'Mareko geography and population',
    keywords: ['population', 'region', 'state', 'central', 'ethiopia', 'demographics', 'people', 'mareko'],
    content:
      'Mareko Special Woreda is in Central Ethiopia Regional State. Public information on the landing page notes a 2007 population figure of 64,512 for the woreda. For the latest official statistics, ask the woreda administration office.'
  },
  {
    topic: 'Woreda services and requests',
    keywords: ['service', 'services', 'request', 'department', 'apply', 'browse', 'citizen'],
    content:
      'Residents can browse woreda services on the Services page (also highlighted on the home page). After registering and logging in, you can view service details and submit service requests to the relevant department. New services appear as departments publish them.'
  },
  {
    topic: 'Kebeles in Mareko',
    keywords: ['kebele', 'kebeles', 'neighborhood', 'area', 'local', 'community'],
    content:
      'Mareko Wereda is organized into kebeles for local administration. Kebele information is managed by woreda administrators. If you need your kebele office or boundaries, register on the platform and contact the woreda office or check announcements for kebele-related updates.'
  },
  {
    topic: 'Mareko Wereda administration contact information',
    keywords: [
      'contact', 'info', 'information', 'phone', 'email', 'call', 'number', 'reach',
      'abdul', 'hamid', 'administration', 'office', 'support', 'woreda', 'wereda', 'mareko'
    ],
    content:
      'Official Mareko Special Woreda Administration contact: Name Abdul Hamid, Phone +251921426433, Email hamidawel06@gmail.com. Office location: Koshe (administrative center of Mareko Special Woreda).'
  },
  {
    topic: 'Community participation in Mareko',
    keywords: ['participate', 'community', 'transparent', 'feedback', 'complaint', 'voice'],
    content:
      'The platform supports transparent, responsive local governance in Mareko. Residents can report community issues, track progress, read announcements, join events or virtual meetings, and share feedback. Creating a resident account connects you to Mareko Special Woreda Administration workflows.'
  }
];

const RESIDENT_KNOWLEDGE_BASE = [
  ...MAREKO_WEREDA_KNOWLEDGE,
  {
    topic: 'Submit new report',
    keywords: ['report', 'submit', 'issue', 'new report', 'problem', 'complaint'],
    content:
      'Residents can submit a new issue report from the Report Issue page. Provide a clear title, category, location, and a detailed description. Attach a photo if available before submitting.'
  },
  {
    topic: 'Track report status',
    keywords: ['track', 'status', 'my report', 'progress', 'update'],
    content:
      'Residents can track report progress under My Reports. Typical statuses are Pending, In Progress, Resolved, or Rejected. Open a report to view detailed updates posted by officers.'
  },
  {
    topic: 'Events and meetings',
    keywords: ['event', 'meeting', 'virtual', 'calendar', 'join'],
    content:
      'Residents can view upcoming community events and virtual meetings from Events or Meetings pages. Details include date, location or meeting link, and organizer information.'
  },
  {
    topic: 'Announcements',
    keywords: ['announcement', 'notice', 'news', 'update from admin'],
    content:
      'Announcements contain official community updates from officers and administrators. Residents can review announcements for urgent notices, service updates, and participation calls.'
  },
  {
    topic: 'Resources',
    keywords: ['resource', 'document', 'download', 'guide', 'file'],
    content:
      'Residents can open the Resources section to access public documents, guidance materials, and downloadable files shared by officers and administrators.'
  },
  {
    topic: 'Profile and account',
    keywords: ['profile', 'edit profile', 'account', 'password', 'login'],
    content:
      'Residents can open Profile to view account details and Edit Profile to update personal information. Use account recovery options from the login page for forgotten passwords.'
  },
  {
    topic: 'Support contact',
    keywords: ['help', 'support', 'contact', 'office', 'woreda office'],
    content:
      'For unresolved platform or service questions, residents should contact their Woreda office for direct assistance and official follow-up.'
  },
  {
    topic: 'System cost and fees',
    keywords: ['free', 'cost', 'price', 'payment', 'subscription', 'fee', 'paid'],
    content:
      'For residents, using the Yegara platform is free. You can register, submit reports, track progress, and view announcements and events without subscription charges. If your local office has special service fees outside the platform, contact your Woreda office for details.'
  },
  {
    topic: 'Register in system',
    keywords: ['register', 'sign up', 'create account', 'join', 'new account'],
    content:
      'Residents can register from the Register page by providing full name, email, phone number, password, and woreda information. After registration, login to access reporting and tracking features.'
  }
];

const PUBLIC_KNOWLEDGE_BASE = [
  ...MAREKO_WEREDA_KNOWLEDGE,
  {
    topic: 'What Yegara does',
    keywords: ['what is yegara', 'purpose', 'about', 'platform', 'what do you do'],
    content:
      'Yegara Community Report Tracking and Event Management System helps residents report local issues, track progress, receive announcements, and stay informed about community events and meetings.'
  },
  {
    topic: 'How to register',
    keywords: ['register', 'sign up', 'create account', 'new user', 'join'],
    content:
      'To register, open the Register page, enter your personal details, choose your woreda, and create a password. Then login to access resident features.'
  },
  {
    topic: 'How to use the system',
    keywords: ['use system', 'how to use', 'steps', 'start', 'guide'],
    content:
      'Start by creating an account or logging in. Residents can submit issue reports, track report status, view announcements, and check events or meetings. Use the dashboard to access these sections quickly.'
  },
  {
    topic: 'System cost and free usage',
    keywords: ['free', 'cost', 'price', 'payment', 'subscription', 'fee', 'paid'],
    content:
      'Yes, community members can use the Yegara platform features without subscription payment. You can register, view information, and use reporting functions as part of community service access.'
  },
  {
    topic: 'Reports feature',
    keywords: ['report', 'issue', 'submit complaint', 'track report', 'status'],
    content:
      'Residents can submit reports with title, category, location, and description, optionally with image evidence. Each report can be tracked through pending, in-progress, and resolved stages.'
  },
  {
    topic: 'Events and announcements',
    keywords: ['events', 'announcements', 'meeting', 'news', 'updates'],
    content:
      'The platform publishes official announcements and upcoming events or virtual meetings so community members can stay informed and participate.'
  }
];

const promptTemplate = PromptTemplate.fromTemplate(
  `You are an assistant for Mareko Special Woreda Administration and its citizen platform (community reporting, services, announcements, and events).

Rules:
- Answer only using the provided context.
- Prioritize Mareko Wereda facts, local guidance, and how to use this platform.
- Keep the response short, practical, and clear for a resident or visitor.
- If context is insufficient, reply exactly with: "I don't know about it. Please contact your Woreda office for assistance."
- If steps are needed, return numbered steps.

Resident name: {residentName}
User question: {question}
Relevant context:\n{context}`
);

const outputParser = new StringOutputParser();

const llm = process.env.OPENAI_API_KEY
  ? new ChatOpenAI({
      modelName: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.2,
      maxTokens: 280
    })
  : null;

const qaChain = llm
  ? RunnableSequence.from([promptTemplate, llm, outputParser])
  : null;

const tokenize = (text) =>
  String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => Boolean(token) && !STOP_WORDS.has(token));

const scoreEntry = (questionTokens, entry) => {
  const keywordTokens = tokenize(entry.keywords.join(' '));
  const contentTokens = tokenize(entry.content);
  const tokenSet = new Set([...keywordTokens, ...contentTokens]);

  let score = 0;
  for (const token of questionTokens) {
    if (tokenSet.has(token)) {
      score += keywordTokens.includes(token) ? 3 : 1;
    }
  }

  return score;
};

const getRelevantContext = (question, knowledgeBase) => {
  const questionTokens = tokenize(question);

  const ranked = knowledgeBase.map((entry) => ({
    ...entry,
    score: scoreEntry(questionTokens, entry)
  }))
    .filter((entry) => entry.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  if (!ranked.length) return '';

  return ranked
    .map((entry) => `- ${entry.topic}: ${entry.content}`)
    .join('\n');
};

const buildFallbackAnswer = (context) => {
  const firstLine = context.split('\n').find(Boolean);
  if (!firstLine) return UNKNOWN_RESPONSE;

  const trimmed = firstLine.replace(/^-\s*/, '').trim();
  return `${trimmed} If you need more help, please contact your Woreda office.`;
};

const normalizeAnswer = (answer) => {
  const text = String(answer || '').trim();
  if (!text) return UNKNOWN_RESPONSE;
  return text;
};

const getGreetingResponse = (residentName) => {
  const name = residentName ? ` ${residentName}` : '';
  return `Hello${name}! Welcome to Mareko Special Woreda Administration. I can help with Mareko Wereda information, local services, registration, reports, announcements, events, and using the citizen platform.`;
};

const getThanksAndGoodbyeResponse = ({ residentName, kind }) => {
  const name = residentName && residentName !== 'Visitor' ? ` ${residentName}` : '';
  const welcomeLine =
    kind === 'thanks'
      ? `You're very welcome${name}! I'm glad I could help with Mareko Special Wereda Administration.`
      : `Goodbye${name}! Thank you for using the Mareko Special Wereda Administration assistant.`;
  return `${welcomeLine} You can return anytime for woreda guidance, services, reports, or contact information. Wishing you a great day—goodbye!`;
};

const getPlatformOverviewResponse = () =>
  'Mareko Special Woreda Administration serves Koshe and communities across Mareko Wereda in Central Ethiopia Regional State. This platform lets you browse local services, report community issues, track progress, read official announcements, and follow events or virtual meetings—connecting residents with woreda administrators for faster, more transparent local governance.';

const WOREDA_CONTACT = {
  name: 'Abdul Hamid',
  phone: '+251921426433',
  email: 'hamidawel06@gmail.com'
};

const getWoredaContactResponse = () =>
  `Mareko Special Wereda Administration contact:\nName: ${WOREDA_CONTACT.name}\nPhone: ${WOREDA_CONTACT.phone}\nEmail: ${WOREDA_CONTACT.email}`;

const isContactInfoQuestion = (question) => {
  const text = String(question || '').trim();
  if (!text) return false;

  const hasContactIntent =
    /\b(contact|phone|email|e-mail|call|telephone|mobile|whatsapp|number|reach)\b/i.test(text) ||
    /\bcontact\s+(info|information|details)\b/i.test(text);

  if (!hasContactIntent) return false;

  return /\b(mareko|woreda|wereda|administration|office|koshe)\b/i.test(text) ||
    /\bcontact\s+(info|information|details)\b/i.test(text) ||
    /\b(get|give|provide|share)\b.*\bcontact\b/i.test(text);
};

const isGreeting = (question) => {
  const text = String(question || '').trim();
  if (!text) return false;
  return GREETING_PATTERNS.some((pattern) => pattern.test(text));
};

const getThanksOrGoodbyeKind = (question) => {
  const text = String(question || '').trim();
  if (!text) return null;

  const hasThanks = THANKS_PATTERNS.some((pattern) => pattern.test(text));
  const hasGoodbye = GOODBYE_PATTERNS.some((pattern) => pattern.test(text));

  if (hasThanks && hasGoodbye) return 'thanks';
  if (hasThanks) return 'thanks';
  if (hasGoodbye) return 'goodbye';
  return null;
};

const isPlatformOverviewQuestion = (question) => {
  const text = String(question || '').trim();
  if (!text) return false;

  if (isContactInfoQuestion(text)) {
    return false;
  }

  if (PLATFORM_OVERVIEW_PATTERNS.some((pattern) => pattern.test(text))) {
    return true;
  }

  const tokens = tokenize(text);
  const hasYegara = tokens.includes('yegara');
  const hasMareko = tokens.includes('mareko') || tokens.includes('koshe');
  const hasIntent = tokens.some((token) =>
    ['about', 'purpose', 'overview', 'platform', 'feature', 'features', 'benefit', 'benefits', 'do', 'does'].includes(token)
  );

  const hasGenericCapabilityQuestion =
    tokens.includes('can') &&
    tokens.some((token) => ['do', 'does', 'help', 'platform', 'system', 'yegara'].includes(token));

  const hasWoredaAboutIntent =
    (hasMareko || hasYegara) &&
    tokens.some((token) => ['about', 'purpose', 'overview', 'what'].includes(token));

  return (hasYegara || hasMareko) && (hasIntent || hasGenericCapabilityQuestion || hasWoredaAboutIntent);
};

const askWithKnowledgeBase = async ({ question, residentName, knowledgeBase }) => {
  const cleanedQuestion = String(question || '').trim();
  if (!cleanedQuestion) {
    return {
      answer: 'Please type a question so I can help you.',
      source: 'validation'
    };
  }

  if (isGreeting(cleanedQuestion)) {
    return {
      answer: getGreetingResponse(residentName),
      source: 'greeting'
    };
  }

  const thanksOrGoodbye = getThanksOrGoodbyeKind(cleanedQuestion);
  if (thanksOrGoodbye) {
    return {
      answer: getThanksAndGoodbyeResponse({ residentName, kind: thanksOrGoodbye }),
      source: 'farewell'
    };
  }

  if (isContactInfoQuestion(cleanedQuestion)) {
    return {
      answer: getWoredaContactResponse(),
      source: 'intent'
    };
  }

  if (isPlatformOverviewQuestion(cleanedQuestion)) {
    return {
      answer: getPlatformOverviewResponse(),
      source: 'intent'
    };
  }

  const context = getRelevantContext(cleanedQuestion, knowledgeBase);
  if (!context) {
    return {
      answer: UNKNOWN_RESPONSE,
      source: 'fallback'
    };
  }

  if (!qaChain) {
    return {
      answer: buildFallbackAnswer(context),
      source: 'fallback'
    };
  }

  const answer = await qaChain.invoke({
    residentName: residentName || 'Resident',
    question: cleanedQuestion,
    context
  });

  return {
    answer: normalizeAnswer(answer),
    source: 'langchain'
  };
};

const askResidentChatbot = async ({ question, residentName }) =>
  askWithKnowledgeBase({ question, residentName, knowledgeBase: RESIDENT_KNOWLEDGE_BASE });

const askPublicChatbot = async ({ question }) =>
  askWithKnowledgeBase({ question, residentName: 'Visitor', knowledgeBase: PUBLIC_KNOWLEDGE_BASE });

module.exports = {
  askResidentChatbot,
  askPublicChatbot,
  UNKNOWN_RESPONSE,
  UNAVAILABLE_RESPONSE
};
