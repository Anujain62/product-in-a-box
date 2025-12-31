export const SUBJECTS = [
  {
    id: 'dsa',
    name: 'Data Structures & Algorithms',
    slug: 'dsa',
    description: 'Master pattern-based problem solving for technical interviews',
    icon: 'Code',
    color: 'dsa',
  },
  {
    id: 'system-design',
    name: 'System Design',
    slug: 'system-design',
    description: 'Design scalable distributed systems from beginner to advanced',
    icon: 'Server',
    color: 'system-design',
  },
  {
    id: 'lld',
    name: 'Low Level Design',
    slug: 'lld',
    description: 'SOLID principles, design patterns, and clean architecture',
    icon: 'Layers',
    color: 'lld',
  },
  {
    id: 'os',
    name: 'Operating Systems',
    slug: 'os',
    description: 'Core OS concepts with practical examples',
    icon: 'Cpu',
    color: 'os',
  },
  {
    id: 'cn',
    name: 'Computer Networks',
    slug: 'cn',
    description: 'Protocols, networking fundamentals, and security',
    icon: 'Network',
    color: 'cn',
  },
  {
    id: 'dbms',
    name: 'Database Management Systems',
    slug: 'dbms',
    description: 'SQL, normalization, transactions, and optimization',
    icon: 'Database',
    color: 'dbms',
  },
  {
    id: 'aiml',
    name: 'AI & Machine Learning',
    slug: 'aiml',
    description: 'Applied ML fundamentals with practical focus',
    icon: 'Brain',
    color: 'aiml',
  },
] as const;

export const DIFFICULTY_COLORS = {
  beginner: 'text-success',
  intermediate: 'text-info',
  advanced: 'text-warning',
  expert: 'text-error',
  easy: 'text-success',
  medium: 'text-warning',
  hard: 'text-error',
} as const;

export const SESSION_TYPES = [
  { id: 'mock-interview', name: 'Mock Interview', duration: 60, price: 999 },
  { id: 'resume-review', name: 'Resume Review', duration: 30, price: 499 },
  { id: 'career-guidance', name: 'Career Guidance', duration: 45, price: 749 },
  { id: 'doubt-clearing', name: 'Doubt Clearing', duration: 30, price: 399 },
  { id: 'project-review', name: 'Project Review', duration: 60, price: 899 },
] as const;

export const SUBSCRIPTION_PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    features: [
      'Access to all courses',
      'Basic progress tracking',
      'Community forums',
      'Weekly challenges',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 299,
    features: [
      'Everything in Free',
      'Advanced analytics',
      'Custom study plans',
      'Priority support',
      'Streak freeze (3/month)',
      'Exclusive Discord channels',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 599,
    features: [
      'Everything in Pro',
      'Unlimited streak freeze',
      'Early access to new courses',
      'Monthly AMA sessions',
      'Resume templates',
      'Offline access',
    ],
  },
] as const;
