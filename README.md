# Lightweight Collaborative Document Editor

A coherent, full-stack document editing web application built with Express, React 19, Tailwind CSS, and Tiptap (ProseMirror engine). It supports creating, editing, renaming, and deleting rich text documents with debounced autosaving, file imports (`.txt`, `.md`, `.docx`), team user switching (simulated auth), document sharing, and export capabilities (`.txt`, `.md`, `.html`). This project explicitly focuses on a polished vertical slice for document editing and sharing without heavy real-time infra dependencies like OT/CRDT or external auth services.

## Setup & Running Locally

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```
   The application will start on `http://localhost:3000`.

3. **Build & Production Execution**
   ```bash
   npm run build
   npm start
   ```

## Simulated Authentication

Users are simulated via a "Viewing as: [Name]" switcher located in the top navigation header. There is no real password authentication or session table. Switching the active user updates the cookie `currentUserId` and demonstrates ownership permissions, dashboard badges ("Owned by you" vs "Shared by {Name}"), and access control boundaries across seeded accounts (Ajaia Patel, Sam Vance, Priya Sharma).

## Supported File Import Formats

Import files directly into the workspace using the "Import File" modal button:
- **`.txt`**: Converts plain text line breaks into document paragraphs.
- **`.md`**: Parses Markdown syntax (headings, list items, bold/italic formatting) into Tiptap ProseMirror nodes.
- **`.docx`**: Uses `mammoth` to parse Microsoft Word XML formatting into HTML and imports it cleanly into the document editor.

*Unsupported file extensions (e.g. `.pdf`, `.png`) are automatically flagged with clear user-facing error messages.*

## Known Scope Simplifications & Intentional Out-Of-Scope Capabilities

- **No Real-Time Co-Editing**: No WebSocket, Yjs, or CRDT live multi-cursor synchronization.
- **No Granular Permission Levels**: Shared access grants full edit permission for simplicity.
- **No Comments / Track Changes**: Focuses strictly on rich text creation and editing.
- **No Real Authentication**: Accounts are seeded and switched instantly via header cookies.
# DocumentShare
