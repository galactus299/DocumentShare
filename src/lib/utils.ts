export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export function downloadFile(filename: string, content: string, contentType: string) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Convert Tiptap JSON content to plain text
export function tiptapJsonToPlainText(node: any): string {
  if (!node) return '';
  if (typeof node === 'string') return node;

  if (node.text) return node.text;

  let text = '';
  if (node.content && Array.isArray(node.content)) {
    for (const child of node.content) {
      text += tiptapJsonToPlainText(child);
      if (['paragraph', 'heading', 'listItem'].includes(child.type)) {
        text += '\n';
      }
    }
  }
  return text;
}

// Convert Tiptap JSON to simple Markdown
export function tiptapJsonToMarkdown(node: any): string {
  if (!node) return '';

  if (node.type === 'doc' && node.content) {
    return node.content.map(tiptapJsonToMarkdown).join('\n\n');
  }

  if (node.type === 'heading') {
    const level = '#'.repeat(node.attrs?.level || 1);
    const contentText = (node.content || []).map(tiptapJsonToMarkdown).join('');
    return `${level} ${contentText}`;
  }

  if (node.type === 'paragraph') {
    return (node.content || []).map(tiptapJsonToMarkdown).join('');
  }

  if (node.type === 'bulletList') {
    return (node.content || []).map((item: any) => `- ${tiptapJsonToMarkdown(item)}`).join('\n');
  }

  if (node.type === 'orderedList') {
    return (node.content || [])
      .map((item: any, idx: number) => `${idx + 1}. ${tiptapJsonToMarkdown(item)}`)
      .join('\n');
  }

  if (node.type === 'listItem') {
    return (node.content || []).map(tiptapJsonToMarkdown).join('').trim();
  }

  if (node.text) {
    let text = node.text;
    if (node.marks && Array.isArray(node.marks)) {
      for (const mark of node.marks) {
        if (mark.type === 'bold') text = `**${text}**`;
        if (mark.type === 'italic') text = `*${text}*`;
        if (mark.type === 'underline') text = `<u>${text}</u>`;
      }
    }
    return text;
  }

  return '';
}
