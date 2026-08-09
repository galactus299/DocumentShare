import mammoth from 'mammoth';
import { marked } from 'marked';
import { generateJSON } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { JSDOM } from 'jsdom';

export async function parseFileToTiptapJson(
  fileBuffer: Buffer,
  filename: string,
  mimetype: string
): Promise<{ title: string; content: any }> {
  const ext = filename.split('.').pop()?.toLowerCase();
  const rawTitle = filename.replace(/\.[^/.]+$/, '');
  let html = '';

  if (ext === 'docx' || mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.convertToHtml({ buffer: fileBuffer });
    html = result.value || '<p>Empty document</p>';
  } else if (ext === 'md' || ext === 'markdown') {
    const markdownStr = fileBuffer.toString('utf-8');
    const parsed = await marked.parse(markdownStr);
    html = typeof parsed === 'string' ? parsed : '<p></p>';
  } else if (ext === 'txt' || mimetype.startsWith('text/')) {
    const textStr = fileBuffer.toString('utf-8');
    const paragraphs = textStr
      .split(/\r?\n\r?\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    if (paragraphs.length === 0) {
      html = '<p></p>';
    } else {
      html = paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('');
    }
  } else {
    throw new Error(`Unsupported file type ".${ext}". Only .txt, .md, and .docx files are supported.`);
  }

  // Setup DOM environment for @tiptap/html in Node environment
  const dom = new JSDOM(`<!DOCTYPE html><html><body>${html}</body></html>`);
  // @ts-ignore
  global.window = dom.window;
  // @ts-ignore
  global.document = dom.window.document;

  const jsonContent = generateJSON(html, [StarterKit, Underline]);

  return {
    title: rawTitle || 'Imported Document',
    content: jsonContent,
  };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
