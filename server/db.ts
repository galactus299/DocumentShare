import fs from 'fs';
import path from 'path';
import { User, Document, Share } from '../src/types.js';

interface DatabaseSchema {
  users: User[];
  documents: Document[];
  shares: Share[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const AVATAR_COLORS = [
  'bg-indigo-600',
  'bg-rose-600',
  'bg-emerald-600',
  'bg-amber-600',
  'bg-purple-600',
  'bg-blue-600',
  'bg-teal-600',
  'bg-sky-600',
];

// Default Seed Users
const SEED_USERS: User[] = [
  {
    id: 'user_1',
    name: 'Ajaia Patel',
    email: 'ajaia.patel@company.com',
    role: 'Product Lead',
    avatarBg: 'bg-indigo-600',
    password: 'password123',
  },
  {
    id: 'user_2',
    name: 'Sam Vance',
    email: 'sam.vance@company.com',
    role: 'Design Director',
    avatarBg: 'bg-rose-600',
    password: 'password123',
  },
  {
    id: 'user_3',
    name: 'Priya Sharma',
    email: 'priya.sharma@company.com',
    role: 'Engineering Lead',
    avatarBg: 'bg-emerald-600',
    password: 'password123',
  },
];

function createSampleDocContent(title: string, paragraphs: string[]): any {
  return {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: title }],
      },
      ...paragraphs.map((p) => ({
        type: 'paragraph',
        content: [{ type: 'text', text: p }],
      })),
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'Action Items & Next Steps' }],
      },
      {
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Review document feedback from team members' }],
              },
            ],
          },
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Finalize core specifications for current sprint' }],
              },
            ],
          },
        ],
      },
    ],
  };
}

const SEED_DOCUMENTS: Document[] = [
  {
    id: 'doc_1',
    title: 'Product Strategy & Q4 Roadmap',
    content: createSampleDocContent('Product Strategy & Q4 Roadmap', [
      'Welcome to our Q4 Product Roadmap outline. Our key objective this quarter is to deliver an intuitive, high-performance collaborative document editing experience.',
      'We are prioritizing speed, document integrity, seamless file import, and granular sharing controls across engineering and design.',
    ]),
    ownerId: 'user_1',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    isPublic: true,
    publicAccessLevel: 'view',
    publicToken: 'token_doc_1_public',
  },
  {
    id: 'doc_2',
    title: 'Design System Guidelines v2.0',
    content: createSampleDocContent('Design System Guidelines v2.0', [
      'This document defines our core visual hierarchy, typography scale, responsive spacing, and dark/light contrast standards.',
      'All UI components must adhere to WCAG AA accessibility contrast ratios and fluid desktop-first layouts.',
    ]),
    ownerId: 'user_2',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    isPublic: false,
    publicAccessLevel: 'view',
    publicToken: 'token_doc_2_public',
  },
  {
    id: 'doc_3',
    title: 'Technical Architecture Review',
    content: createSampleDocContent('Technical Architecture Review', [
      'Overview of our full-stack architecture using Express backend, file persistence, Tiptap ProseMirror state engine, and mammoth/marked document converters.',
      'Designed for zero-latency document editing, local storage reliability, and seamless user switching.',
    ]),
    ownerId: 'user_3',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    isPublic: true,
    publicAccessLevel: 'edit',
    publicToken: 'token_doc_3_public',
  },
];

const SEED_SHARES: Share[] = [
  {
    id: 'share_1',
    documentId: 'doc_1',
    userId: 'user_2',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'share_2',
    documentId: 'doc_1',
    userId: 'user_3',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'share_3',
    documentId: 'doc_2',
    userId: 'user_1',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
];

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(fileContent);
      }
    } catch (err) {
      console.error('Error loading database file, re-initializing seed:', err);
    }

    const initialData: DatabaseSchema = {
      users: SEED_USERS,
      documents: SEED_DOCUMENTS,
      shares: SEED_SHARES,
    };
    this.saveData(initialData);
    return initialData;
  }

  private saveData(data: DatabaseSchema): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save database file:', err);
    }
  }

  public getUsers(): User[] {
    return this.data.users.map(({ password, ...u }) => u);
  }

  public getUserById(id: string): User | undefined {
    const user = this.data.users.find((u) => u.id === id);
    if (!user) return undefined;
    const { password, ...safeUser } = user;
    return safeUser;
  }

  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  }

  public createUser(userData: { name: string; email: string; password?: string; role?: string }): User {
    const existing = this.getUserByEmail(userData.email);
    if (existing) {
      throw new Error('User with this email already exists');
    }

    const id = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const colorIndex = this.data.users.length % AVATAR_COLORS.length;

    const newUser: User = {
      id,
      name: userData.name.trim(),
      email: userData.email.trim().toLowerCase(),
      role: userData.role?.trim() || 'Contributor',
      avatarBg: AVATAR_COLORS[colorIndex],
      password: userData.password || 'password123',
    };

    this.data.users.push(newUser);
    this.saveData(this.data);

    const { password, ...safeUser } = newUser;
    return safeUser;
  }

  public authenticateUser(email: string, passwordAttempt?: string): User | null {
    const user = this.data.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) return null;

    if (user.password && passwordAttempt && user.password !== passwordAttempt) {
      return null;
    }

    const { password, ...safeUser } = user;
    return safeUser;
  }

  public resetPassword(email: string, newPassword: string): boolean {
    const userIndex = this.data.users.findIndex(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (userIndex === -1) return false;

    this.data.users[userIndex].password = newPassword;
    this.saveData(this.data);
    return true;
  }

  public searchUsers(query: string, excludeUserId?: string): User[] {
    const q = query.toLowerCase().trim();
    return this.data.users
      .filter((u) => {
        if (excludeUserId && u.id === excludeUserId) return false;
        if (!q) return true;
        return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      })
      .map(({ password, ...u }) => u);
  }

  public getDocumentsForUser(userId: string): { owned: Document[]; shared: Document[] } {
    const userMap = new Map<string, User>(this.data.users.map((u) => [u.id, u]));

    const owned = this.data.documents
      .filter((doc) => doc.ownerId === userId)
      .map((doc) => this.enrichDocument(doc, userMap, userId));

    const userShareDocIds = new Set(
      this.data.shares.filter((s) => s.userId === userId).map((s) => s.documentId)
    );

    const shared = this.data.documents
      .filter((doc) => userShareDocIds.has(doc.id) && doc.ownerId !== userId)
      .map((doc) => this.enrichDocument(doc, userMap, userId));

    owned.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    shared.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return { owned, shared };
  }

  public getDocumentById(docId: string, userId?: string, token?: string): Document | null {
    const doc = this.data.documents.find((d) => d.id === docId || (token && d.publicToken === token));
    if (!doc) return null;

    const isOwner = userId && doc.ownerId === userId;
    const isShared = userId && this.data.shares.some((s) => s.documentId === doc.id && s.userId === userId);
    const isPublicMatch = doc.isPublic || (token && doc.publicToken === token);

    if (!isOwner && !isShared && !isPublicMatch) {
      return null;
    }

    const userMap = new Map<string, User>(this.data.users.map((u) => [u.id, u]));
    const enriched = this.enrichDocument(doc, userMap, userId);

    if (isOwner) {
      enriched.userAccessLevel = 'owner';
    } else if (isShared) {
      enriched.userAccessLevel = 'edit';
    } else if (isPublicMatch) {
      enriched.isPublicAccess = true;
      enriched.userAccessLevel = doc.publicAccessLevel || 'view';
    }

    return enriched;
  }

  public createDocument(title: string, content: any, ownerId: string): Document {
    const id = 'doc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const now = new Date().toISOString();

    const newDoc: Document = {
      id,
      title: title.trim() || 'Untitled Document',
      content: content || {
        type: 'doc',
        content: [{ type: 'paragraph' }],
      },
      ownerId,
      createdAt: now,
      updatedAt: now,
      isPublic: false,
      publicAccessLevel: 'view',
      publicToken: 'token_' + id,
    };

    this.data.documents.push(newDoc);
    this.saveData(this.data);

    const userMap = new Map<string, User>(this.data.users.map((u) => [u.id, u]));
    const enriched = this.enrichDocument(newDoc, userMap, ownerId);
    enriched.userAccessLevel = 'owner';
    return enriched;
  }

  public updateDocument(
    docId: string,
    userId: string | undefined,
    updates: { title?: string; content?: any },
    token?: string
  ): Document | null {
    const docIndex = this.data.documents.findIndex((d) => d.id === docId || (token && d.publicToken === token));
    if (docIndex === -1) return null;

    const doc = this.data.documents[docIndex];
    const isOwner = userId && doc.ownerId === userId;
    const isShared = userId && this.data.shares.some((s) => s.documentId === doc.id && s.userId === userId);
    const isPublicEdit = (doc.isPublic || (token && doc.publicToken === token)) && doc.publicAccessLevel === 'edit';

    if (!isOwner && !isShared && !isPublicEdit) return null;

    if (updates.title !== undefined) {
      doc.title = updates.title.trim() || 'Untitled Document';
    }
    if (updates.content !== undefined) {
      doc.content = updates.content;
    }
    doc.updatedAt = new Date().toISOString();

    this.data.documents[docIndex] = doc;
    this.saveData(this.data);

    const userMap = new Map<string, User>(this.data.users.map((u) => [u.id, u]));
    const enriched = this.enrichDocument(doc, userMap, userId);
    enriched.userAccessLevel = isOwner ? 'owner' : isShared ? 'edit' : 'view';
    return enriched;
  }

  public updatePublicSharing(
    docId: string,
    ownerId: string,
    settings: { isPublic: boolean; publicAccessLevel: 'view' | 'edit' }
  ): Document | null {
    const docIndex = this.data.documents.findIndex((d) => d.id === docId);
    if (docIndex === -1) return null;

    const doc = this.data.documents[docIndex];
    if (doc.ownerId !== ownerId) return null;

    doc.isPublic = settings.isPublic;
    doc.publicAccessLevel = settings.publicAccessLevel;
    if (!doc.publicToken) {
      doc.publicToken = 'token_' + docId + '_' + Math.random().toString(36).substring(2, 6);
    }

    this.data.documents[docIndex] = doc;
    this.saveData(this.data);

    const userMap = new Map<string, User>(this.data.users.map((u) => [u.id, u]));
    return this.enrichDocument(doc, userMap, ownerId);
  }

  public deleteDocument(docId: string, userId: string): boolean {
    const doc = this.data.documents.find((d) => d.id === docId);
    if (!doc || doc.ownerId !== userId) return false;

    this.data.documents = this.data.documents.filter((d) => d.id !== docId);
    this.data.shares = this.data.shares.filter((s) => s.documentId !== docId);
    this.saveData(this.data);
    return true;
  }

  public shareDocument(docId: string, ownerId: string, targetUserId: string): boolean {
    const doc = this.data.documents.find((d) => d.id === docId);
    if (!doc || doc.ownerId !== ownerId) return false;

    if (targetUserId === ownerId) return false;

    const existingShare = this.data.shares.find(
      (s) => s.documentId === docId && s.userId === targetUserId
    );
    if (existingShare) return true;

    const newShare: Share = {
      id: 'share_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      documentId: docId,
      userId: targetUserId,
      createdAt: new Date().toISOString(),
    };

    this.data.shares.push(newShare);
    this.saveData(this.data);
    return true;
  }

  public unshareDocument(docId: string, ownerId: string, targetUserId: string): boolean {
    const doc = this.data.documents.find((d) => d.id === docId);
    if (!doc || doc.ownerId !== ownerId) return false;

    this.data.shares = this.data.shares.filter(
      (s) => !(s.documentId === docId && s.userId === targetUserId)
    );
    this.saveData(this.data);
    return true;
  }

  private enrichDocument(doc: Document, userMap: Map<string, User>, activeUserId?: string): Document {
    const owner = userMap.get(doc.ownerId);
    const sharesForDoc = this.data.shares
      .filter((s) => s.documentId === doc.id)
      .map((s) => ({
        ...s,
        user: userMap.get(s.userId),
      }));

    return {
      ...doc,
      owner,
      shares: sharesForDoc,
      isPublic: !!doc.isPublic,
      publicAccessLevel: doc.publicAccessLevel || 'view',
      publicToken: doc.publicToken || 'token_' + doc.id,
    };
  }
}

export const db = new Database();
