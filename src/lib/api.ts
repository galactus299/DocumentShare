import { User, Document, FileUploadResponse } from '../types';

export async function fetchCurrentAuthUser(): Promise<User | null> {
  try {
    const res = await fetch('/api/auth/me');
    if (!res.ok) return null;
    const data = await res.json();
    return data.user || null;
  } catch {
    return null;
  }
}

export async function signUpUser(userData: {
  name: string;
  email: string;
  password?: string;
  role?: string;
}): Promise<User> {
  const res = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to sign up');
  return data.user;
}

export async function logInUser(credentials: { email: string; password?: string }): Promise<User> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to log in');
  return data.user;
}

export async function resetPassword(email: string, newPassword: string): Promise<void> {
  const res = await fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to reset password');
}

export async function logOutUser(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST' });
}

export async function fetchUsers(): Promise<{ users: User[]; activeUserId: string }> {
  const res = await fetch('/api/users');
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

export async function searchUsers(q: string): Promise<User[]> {
  const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error('Failed to search users');
  const data = await res.json();
  return data.users || [];
}

export async function switchUser(userId: string): Promise<User> {
  const res = await fetch('/api/auth/switch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error('Failed to switch user');
  const data = await res.json();
  return data.user;
}

export async function fetchDocuments(userId?: string): Promise<{ owned: Document[]; shared: Document[] }> {
  const headers: Record<string, string> = {};
  if (userId) headers['x-user-id'] = userId;

  const res = await fetch('/api/documents', { headers });
  if (!res.ok) throw new Error('Failed to fetch documents');
  return res.json();
}

export async function fetchDocumentById(id: string, userId?: string, token?: string): Promise<Document> {
  const headers: Record<string, string> = {};
  if (userId) headers['x-user-id'] = userId;

  let url = `/api/documents/${id}`;
  if (token) url += `?token=${encodeURIComponent(token)}`;

  const res = await fetch(url, { headers });
  if (!res.ok) {
    if (res.status === 403) {
      throw new Error('403: Access Denied');
    }
    throw new Error('Failed to fetch document');
  }
  const data = await res.json();
  return data.document;
}

export async function createDocument(title?: string, content?: any, userId?: string): Promise<Document> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (userId) headers['x-user-id'] = userId;

  const res = await fetch('/api/documents', {
    method: 'POST',
    headers,
    body: JSON.stringify({ title, content }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to create document');
  }
  const data = await res.json();
  return data.document;
}

export async function updateDocument(
  id: string,
  updates: { title?: string; content?: any },
  userId?: string,
  token?: string
): Promise<Document> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (userId) headers['x-user-id'] = userId;

  let url = `/api/documents/${id}`;
  if (token) url += `?token=${encodeURIComponent(token)}`;

  const res = await fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ ...updates, token }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to update document');
  }
  const data = await res.json();
  return data.document;
}

export async function updatePublicSharing(
  id: string,
  isPublic: boolean,
  publicAccessLevel: 'view' | 'edit',
  userId?: string
): Promise<Document> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (userId) headers['x-user-id'] = userId;

  const res = await fetch(`/api/documents/${id}/public-share`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ isPublic, publicAccessLevel }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to update public sharing settings');
  }
  const data = await res.json();
  return data.document;
}

export async function deleteDocument(id: string, userId?: string): Promise<void> {
  const headers: Record<string, string> = {};
  if (userId) headers['x-user-id'] = userId;

  const res = await fetch(`/api/documents/${id}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) throw new Error('Failed to delete document');
}

export async function shareDocument(id: string, targetUserId: string, userId?: string): Promise<Document> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (userId) headers['x-user-id'] = userId;

  const res = await fetch(`/api/documents/${id}/share`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ targetUserId }),
  });
  if (!res.ok) throw new Error('Failed to share document');
  const data = await res.json();
  return data.document;
}

export async function shareDocumentByEmail(id: string, email: string, userId?: string): Promise<Document> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (userId) headers['x-user-id'] = userId;

  const res = await fetch(`/api/documents/${id}/share-email`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to share with email');
  return data.document;
}

export async function unshareDocument(id: string, targetUserId: string, userId?: string): Promise<Document> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (userId) headers['x-user-id'] = userId;

  const res = await fetch(`/api/documents/${id}/unshare`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ targetUserId }),
  });
  if (!res.ok) throw new Error('Failed to unshare document');
  const data = await res.json();
  return data.document;
}

export async function uploadDocument(file: File, userId?: string): Promise<FileUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const headers: Record<string, string> = {};
  if (userId) headers['x-user-id'] = userId;

  const res = await fetch('/api/upload', {
    method: 'POST',
    headers,
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    return { success: false, error: data.error || 'Failed to upload document' };
  }
  return { success: true, document: data.document };
}
