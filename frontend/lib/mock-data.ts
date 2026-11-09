export type Profile = {
  id: string;
  name: string;
  category: string;
  description: string;
  status: 'enabled' | 'draft' | 'archived';
  languages: string[];
  formats: string[];
  destinations: string[];
};

export type Project = {
  id: string;
  title: string;
  profile: string;
  status: 'Ready for review' | 'In production' | 'Queued' | 'Needs edits';
  owner: string;
  progress: number;
  duration: string;
  language: string;
};

export const profiles: Profile[] = [
  {
    id: 'current-affairs',
    name: 'Current Affairs',
    category: 'News & Commentary',
    description: 'Tracks recent events with sourcing, fact checking, and polished explainer narratives.',
    status: 'enabled',
    languages: ['English', 'French', 'Spanish'],
    formats: ['16:9', '9:16'],
    destinations: ['YouTube', 'LinkedIn', 'X'],
  },
  {
    id: 'breaking-news',
    name: 'Breaking News',
    category: 'Realtime Coverage',
    description: 'Fast-turn production pipeline optimized for high-velocity publication windows.',
    status: 'enabled',
    languages: ['English', 'Arabic', 'Portuguese'],
    formats: ['16:9'],
    destinations: ['YouTube', 'Instagram', 'TikTok'],
  },
  {
    id: 'tech-update',
    name: 'Technology Updates',
    category: 'Product & Research',
    description: 'Research-forward summaries with product explainers, statistics, and source validation.',
    status: 'draft',
    languages: ['English', 'German'],
    formats: ['16:9', '1:1'],
    destinations: ['YouTube', 'Blog', 'Newsletter'],
  },
  {
    id: 'product-explainer',
    name: 'Product Explainer',
    category: 'Marketing',
    description: 'Story-driven product demos, feature walkthroughs, and creator-led promotional content.',
    status: 'enabled',
    languages: ['English', 'Japanese'],
    formats: ['16:9', '9:16'],
    destinations: ['YouTube', 'LinkedIn', 'Webinars'],
  },
];

export const projects: Project[] = [
  {
    id: 'PRJ-1041',
    title: 'AI chip exports reshape enterprise strategy',
    profile: 'Current Affairs',
    status: 'Ready for review',
    owner: 'Maya Patel',
    progress: 82,
    duration: '4:20',
    language: 'English',
  },
  {
    id: 'PRJ-1009',
    title: 'Construction robotics in emerging markets',
    profile: 'Research Story',
    status: 'In production',
    owner: 'Omar Hassan',
    progress: 58,
    duration: '6:10',
    language: 'Arabic',
  },
  {
    id: 'PRJ-0994',
    title: 'How AI agents are changing developer workflows',
    profile: 'Technology Updates',
    status: 'Queued',
    owner: 'Nora Chen',
    progress: 35,
    duration: '5:40',
    language: 'English',
  },
  {
    id: 'PRJ-0988',
    title: 'Sustainable data centers and policy pressure',
    profile: 'Business',
    status: 'Needs edits',
    owner: 'Daniel Shaw',
    progress: 72,
    duration: '7:00',
    language: 'English',
  },
];

export const approvalQueue = [
  { id: 'APR-23', title: 'Global EV battery boom', stage: 'Script review', reviewer: 'Rina Gomez', urgency: 'High' },
  { id: 'APR-24', title: 'Climate grid resilience plan', stage: 'Voiceover QA', reviewer: 'Jules Martin', urgency: 'Medium' },
  { id: 'APR-25', title: 'AI-powered design tool launch', stage: 'Thumbnail approval', reviewer: 'Alicia Stone', urgency: 'Low' },
];

export const kpis = [
  { label: 'Active workspaces', value: '148', change: '+18%' },
  { label: 'Published this week', value: '46', change: '+13%' },
  { label: 'Avg. approval time', value: '2.4h', change: '-21%' },
  { label: 'Automation success', value: '96.8%', change: '+3.4%' },
];
