# Checklist Upload Form

A static, browser-based checklist submission form with file selection, checklist progress tracking, local autosave, and JSON export.

## Location

Open this folder from the repository root:

```text
checklist-upload/index.html
```

If GitHub Pages is enabled for the repository, the page should be available at:

```text
https://burnt-exe.github.io/hf-digital/checklist-upload/
```

## Features

- Submitter details capture
- Project/client capture
- Due date field
- Five configurable checklist items
- Multiple file selection
- File name, file size, type, and last-modified metadata capture
- Browser-local autosave using `localStorage`
- Visual completion percentage
- Submission preview
- JSON export
- Mobile-responsive layout

## Important upload note

This is a static frontend implementation. It can capture file metadata and stage selected files in the browser, but it does **not** permanently upload files to a server.

For production file storage, connect the form to one of the following:

- Supabase Storage
- Firebase Storage
- Azure Blob Storage
- AWS S3
- Cloudflare R2
- A custom API endpoint

## Files

```text
checklist-upload/
├── index.html
├── styles.css
├── app.js
└── README.md
```

## Suggested production next steps

1. Add authentication if the checklist contains private client data.
2. Add server-side file upload handling.
3. Store submissions in a database or CRM.
4. Add email notification on submission.
5. Add PDF export for signed-off checklists.
