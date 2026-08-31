import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

export interface FeedbackEntry {
  id: string;
  timestamp: string;
  studentName: string;
  year: string;
  branch: string;
  seminarName: string;
  overallRating: number;
  presentationRating: number;
  contentRating: number;
  likedMost: string;
  improvements: string;
  nextTopicRequest: string;
  preferredFormat: string;
  volunteerStatus: string;
}

const CSV_DIR = path.join(process.cwd(), 'data');
const CSV_FILE = path.join(CSV_DIR, 'feedback.csv');

const CSV_HEADERS = [
  'id',
  'timestamp',
  'studentName',
  'year',
  'branch',
  'seminarName',
  'overallRating',
  'presentationRating',
  'contentRating',
  'likedMost',
  'improvements',
  'nextTopicRequest',
  'preferredFormat',
  'volunteerStatus',
];

function ensureCsvFileExists(): void {
  if (!fs.existsSync(CSV_DIR)) {
    fs.mkdirSync(CSV_DIR, { recursive: true });
  }

  if (!fs.existsSync(CSV_FILE)) {
    const initialContent = stringify([], { header: true, columns: CSV_HEADERS });
    fs.writeFileSync(CSV_FILE, initialContent, 'utf8');
  }
}

export function saveFeedback(data: Omit<FeedbackEntry, 'id' | 'timestamp'>): FeedbackEntry {
  ensureCsvFileExists();

  const newEntry: FeedbackEntry = {
    id: `fb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    ...data,
  };

  const row = CSV_HEADERS.map((header) => {
    const val = (newEntry as unknown as Record<string, string | number>)[header];
    return val !== undefined ? String(val) : '';
  });

  const formattedRow = stringify([row], { header: false });
  fs.appendFileSync(CSV_FILE, formattedRow, 'utf8');

  return newEntry;
}

export function getAllFeedback(): FeedbackEntry[] {
  ensureCsvFileExists();

  const fileContent = fs.readFileSync(CSV_FILE, 'utf8');
  if (!fileContent.trim()) {
    return [];
  }

  try {
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    return records.map((rec: Record<string, string>) => ({
      id: rec.id || `fb_${Math.random().toString(36).substring(2, 8)}`,
      timestamp: rec.timestamp || new Date().toISOString(),
      studentName: rec.studentName || 'Anonymous',
      year: rec.year || 'N/A',
      branch: rec.branch || 'N/A',
      seminarName: rec.seminarName || 'General Seminar',
      overallRating: Number(rec.overallRating) || 5,
      presentationRating: Number(rec.presentationRating) || 5,
      contentRating: Number(rec.contentRating) || 5,
      likedMost: rec.likedMost || '',
      improvements: rec.improvements || '',
      nextTopicRequest: rec.nextTopicRequest || 'N/A',
      preferredFormat: rec.preferredFormat || 'Hands-on Workshop',
      volunteerStatus: rec.volunteerStatus || 'No',
    }));
  } catch (error) {
    console.error('Error parsing CSV file:', error);
    return [];
  }
}

export function getCsvFilePath(): string {
  ensureCsvFileExists();
  return CSV_FILE;
}

export function seedMockFeedback(): FeedbackEntry[] {
  ensureCsvFileExists();
  
  const mockEntries: Omit<FeedbackEntry, 'id' | 'timestamp'>[] = [
    {
      studentName: 'Alex Rivera',
      year: '2nd Year',
      branch: 'Computer Science',
      seminarName: 'AI Agents & Modern Web Architecture',
      overallRating: 5,
      presentationRating: 5,
      contentRating: 5,
      likedMost: 'The live demo of building a full-stack agent with Next.js was mind-blowing!',
      improvements: 'Provide links to the starter template beforehand.',
      nextTopicRequest: 'Full-Stack Next.js 15 & Vector Databases',
      preferredFormat: 'Hands-on Workshop',
      volunteerStatus: 'Yes',
    },
    {
      studentName: 'Priya Sharma',
      year: '1st Year',
      branch: 'Data Science / AI',
      seminarName: 'AI Agents & Modern Web Architecture',
      overallRating: 5,
      presentationRating: 4,
      contentRating: 5,
      likedMost: 'Seniors explained backend concepts very clearly without overwhelming technical jargon.',
      improvements: 'Slightly slow down during the live terminal commands.',
      nextTopicRequest: 'Machine Learning Models Deployment & Docker',
      preferredFormat: 'Interactive Demo',
      volunteerStatus: 'Yes',
    },
    {
      studentName: 'Rahul Patel',
      year: '3rd Year',
      branch: 'Electronics & Comm.',
      seminarName: 'Git, GitHub & Open Source Mastery',
      overallRating: 4,
      presentationRating: 5,
      contentRating: 4,
      likedMost: 'Interactive resolution of merge conflicts was super practical.',
      improvements: 'Have extra mentors walking around the room for troubleshooting.',
      nextTopicRequest: 'System Design & Scalable Microservices',
      preferredFormat: 'Hackathon / Project Sprint',
      volunteerStatus: 'No',
    },
    {
      studentName: 'Anonymous',
      year: '1st Year',
      branch: 'Information Technology',
      seminarName: 'AI Agents & Modern Web Architecture',
      overallRating: 5,
      presentationRating: 5,
      contentRating: 5,
      likedMost: 'Great enthusiasm from the speakers! Learned how prompt engineering works.',
      improvements: 'Everything was great!',
      nextTopicRequest: 'Building Mobile Apps with React Native',
      preferredFormat: 'Hands-on Workshop',
      volunteerStatus: 'No',
    },
    {
      studentName: 'David Chen',
      year: '2nd Year',
      branch: 'Computer Science',
      seminarName: 'Git, GitHub & Open Source Mastery',
      overallRating: 4,
      presentationRating: 4,
      contentRating: 4,
      likedMost: 'Clear explanation of rebase vs merge.',
      improvements: 'Add a 5-minute break in the middle.',
      nextTopicRequest: 'Full-Stack Next.js 15 & Vector Databases',
      preferredFormat: 'Hands-on Workshop',
      volunteerStatus: 'Yes',
    },
    {
      studentName: 'Ananya Verma',
      year: '1st Year',
      branch: 'AI & Robotics',
      seminarName: 'AI Agents & Modern Web Architecture',
      overallRating: 5,
      presentationRating: 5,
      contentRating: 5,
      likedMost: 'The Q&A session at the end answered all my career doubts!',
      improvements: 'Extend the duration by 30 mins next time.',
      nextTopicRequest: 'LLM Fine-tuning & Retrieval Augmented Generation (RAG)',
      preferredFormat: 'Interactive Seminar + Q&A',
      volunteerStatus: 'Yes',
    },
  ];

  const created = mockEntries.map((item) => saveFeedback(item));
  return created;
}
