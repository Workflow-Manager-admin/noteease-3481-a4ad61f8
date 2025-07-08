import React, { useState, useEffect, useMemo } from "react";
import "./App.css";

// Primary, secondary, accent colors from requirements
const COLORS = {
  primary: "#1976D2",
  secondary: "#424242",
  accent: "#FFC107",
  background: "#ffffff",
  surface: "#f6f8fb",
  textPrimary: "#212121",
  textSecondary: "#757575",
  border: "#e9ecef"
};

// --- Utility to format date ---
function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return (
    date.toLocaleDateString() + " - " + date.toLocaleTimeString().replace(/:\d\d /, " ")
  );
}

// === Main App ===
// PUBLIC_INTERFACE
function App() {
  // Notes state
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  // TEMPORARY: Use dummy REST API endpoints for demonstration (swap for your backend)
  const NOTES_API_URL = "/api/notes"; // Replace with real backend endpoint/path

  // Runs on mount: fetch notes
  useEffect(() => {
    fetchNotes();
    // eslint-disable-next-line
  }, []);

  // PUBLIC_INTERFACE
  async function fetchNotes() {
    setLoading(true);
    setError("");
    try {
      // Simulate REST call (replace with: const res = await fetch(NOTES_API_URL) etc.)
      let notesFromLocal = JSON.parse(localStorage.getItem("notes_v1") || "[]");
      // Ensure date strings
      notesFromLocal = notesFromLocal.map(n => ({
        ...n,
        created_at: n.created_at || new Date().toISOString(),
        updated_at: n.updated_at || new Date().toISOString()
      }));
      setNotes(notesFromLocal);
    } catch (e) {
      setError("Failed to load notes.");
    }
    setLoading(false);
  }

  // --- Save notes to localStorage (TEMP in place of backend) ---
  function saveNotesToLocalStorage(newNotes) {
    localStorage.setItem("notes_v1", JSON.stringify(newNotes));
  }

  // PUBLIC_INTERFACE
  function handleSelectNote(noteId) {
    setSelectedId(noteId);
    setEditMode(false);
  }

  // PUBLIC_INTERFACE
  function handleAddNote() {
    // Blank note
    const newNote = {
      id: Date.now().toString(),
      title: "",
      content: "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);
    saveNotesToLocalStorage(updatedNotes);
    setSelectedId(newNote.id);
    setEditMode(true);
  }

  // PUBLIC_INTERFACE
  function handleDeleteNote(noteId) {
    if (!window.confirm("Delete this note?")) return;
    const updatedNotes = notes.filter((n) => n.id !== noteId);
    setNotes(updatedNotes);
    saveNotesToLocalStorage(updatedNotes);
    setSelectedId(null);
    setEditMode(false);
  }

  // PUBLIC_INTERFACE
  function handleEditNote() {
    setEditMode(true);
  }

  // PUBLIC_INTERFACE
  function handleSaveNote(edited) {
    if (!edited.title.trim() && !edited.content.trim()) {
      setError("Note must have a title or content.");
      return;
    }
    setError("");
    const updatedNotes = notes.map((n) =>
      n.id === edited.id ? { ...n, ...edited, updated_at: new Date().toISOString() } : n
    );
    setNotes(updatedNotes);
    saveNotesToLocalStorage(updatedNotes);
    setEditMode(false);
  }

  // PUBLIC_INTERFACE
  function handleCancelEdit() {
    setEditMode(false);
    setError("");
  }

  // PUBLIC_INTERFACE
  function handleSearch(value) {
    setSearch(value);
  }

  // --- Note list, search ---
  const filteredNotes = useMemo(() => {
    if (!search.trim()) return notes;
    const term = search.toLowerCase();
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(term) ||
        n.content.toLowerCase().includes(term)
    );
  }, [search, notes]);

  // Sort notes newest first (chronological order required)
  const sortedNotes = useMemo(
    () =>
      filteredNotes
        .slice()
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)),
    [filteredNotes]
  );

  const selectedNote = notes.find((n) => n.id === selectedId);

  // PUBLIC_INTERFACE
  function NoteList({ notes, onSelect, selectedId, onAdd, search, onSearch }) {
    return (
      <aside className="note-list-pane">
        <div className="note-list-header">
          <input
            type="text"
            className="note-search"
            placeholder="Search notes..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            aria-label="Search notes"
            style={{
              borderColor: COLORS.primary,
              color: COLORS.textPrimary
            }}
          />
        </div>
        <ul className="note-list">
          {notes.length === 0 && (
            <li className="note-list-empty">No notes found.</li>
          )}
          {notes.map((note) => (
            <li
              key={note.id}
              className={
                "note-list-item" +
                (note.id === selectedId ? " selected" : "")
              }
              onClick={() => onSelect(note.id)}
              tabIndex={0}
              aria-selected={note.id === selectedId}
            >
              <strong>{note.title || <em>(Untitled)</em>}</strong>
              <span className="note-list-date">
                {formatDate(note.updated_at)}
              </span>
              <span className="note-list-snippet">
                {note.content
                  ? note.content.substring(0, 36) + (note.content.length > 36 ? "..." : "")
                  : ""}
              </span>
            </li>
          ))}
        </ul>
        <button className="fab" title="Add note" onClick={onAdd}>
          +
        </button>
      </aside>
    );
  }

  // PUBLIC_INTERFACE
  function NoteDetail({
    note,
    editMode,
    onEdit,
    onDelete,
    onSave,
    onCancel,
    error
  }) {
    const [form, setForm] = useState(note ? { ...note } : { title: "", content: "" });

    // When switching notes, reset the form
    useEffect(() => {
      if (note) setForm({ ...note });
    }, [note]);

    if (!note) {
      return (
        <section className="note-detail-pane empty">
          <div style={{ color: COLORS.textSecondary, fontStyle: "italic" }}>
            Select or add a note to view.
          </div>
        </section>
      );
    }
    // --- Editing mode ---
    if (editMode) {
      return (
        <section className="note-detail-pane edit">
          <form
            className="note-edit-form"
            autoComplete="off"
            onSubmit={e => {
              e.preventDefault();
              onSave(form);
            }}
          >
            <input
              className="note-title-input"
              type="text"
              placeholder="Title"
              maxLength={120}
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              style={{ borderColor: COLORS.primary }}
            />
            <textarea
              className="note-content-input"
              placeholder="Write your note..."
              rows={12}
              maxLength={3000}
              value={form.content}
              onChange={e => setForm({ ...form, content: e.target.value })}
              style={{ borderColor: COLORS.secondary }}
            />
            <div className="edit-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={onCancel}
                tabIndex={0}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary" tabIndex={0}>
                Save
              </button>
            </div>
            {error && <div className="note-error">{error}</div>}
          </form>
        </section>
      );
    }

    // --- Read-only view mode ---
    return (
      <section className="note-detail-pane view">
        <div className="note-detail-header">
          <h2 className="note-title">{note.title || <em>(Untitled)</em>}</h2>
          <div className="note-date">{formatDate(note.updated_at)}</div>
        </div>
        <div className="note-detail-content">
          {note.content ? (
            <pre style={{
              whiteSpace: "pre-wrap",
              font: "inherit",
              color: COLORS.textPrimary,
              background: COLORS.surface,
              borderRadius: "8px",
              padding: "12px"
            }}>{note.content}</pre>
          ) : (
            <span style={{ color: COLORS.textSecondary, fontStyle: "italic" }}>
              (No content)
            </span>
          )}
        </div>
        <div className="view-actions">
          <button className="btn-secondary" onClick={onEdit} tabIndex={0}>
            Edit
          </button>
          <button
            className="btn-outline"
            onClick={() => onDelete(note.id)}
            tabIndex={0}
            style={{ color: "#d32f2f", borderColor: "#d32f2f" }}
          >
            Delete
          </button>
        </div>
      </section>
    );
  }

  // === Main UI ===
  return (
    <div className="note-app-container">
      <header
        className="note-app-header"
        style={{
          background: COLORS.primary,
          color: "#fff",
        }}
      >
        <span className="note-app-title" style={{ fontWeight: 700, fontSize: 28 }}>
          NoteEase
        </span>
      </header>
      <main className="note-app-main">
        <NoteList
          notes={sortedNotes}
          onSelect={handleSelectNote}
          selectedId={selectedId}
          onAdd={handleAddNote}
          search={search}
          onSearch={handleSearch}
        />
        <div className="note-main-divider" />
        <NoteDetail
          note={selectedNote}
          editMode={editMode}
          onEdit={handleEditNote}
          onDelete={handleDeleteNote}
          onSave={handleSaveNote}
          onCancel={handleCancelEdit}
          error={error}
        />
      </main>
      <footer className="note-app-footer">
        <span style={{ color: COLORS.textSecondary, fontSize: 12 }}>
          &copy; {new Date().getFullYear()} NoteEase
        </span>
      </footer>
    </div>
  );
}

export default App;
