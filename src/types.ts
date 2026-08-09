export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarBg: string;
  password?: string;
}

export interface Share {
  id: string;
  documentId: string;
  userId: string;
  createdAt: string;
  user?: User;
}

export interface Document {
  id: string;
  title: string;
  content: any; // Tiptap JSON document structure
  ownerId: string;
  owner?: User;
  createdAt: string;
  updatedAt: string;
  shares?: Share[];
  isPublic?: boolean;
  publicAccessLevel?: 'view' | 'edit';
  publicToken?: string;
  isPublicAccess?: boolean;
  userAccessLevel?: 'owner' | 'edit' | 'view';
}

export type DocumentFilter = 'all' | 'owned' | 'shared';

export interface FileUploadResponse {
  success: boolean;
  document?: Document;
  error?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

