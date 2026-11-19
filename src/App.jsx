import React, { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

const STORAGE_KEY = "library-books";
const EMPTY_FORM = { bookName: "", bookId: "", authorName: "" };

// Load saved books safely (handles missing/corrupt data)
const loadBooks = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
};

// Reusable Book Card Component
const BookCard = React.memo(function BookCard({ book, onDelete }) {
  return (
    <article className="book-card">
      <h3>{book.bookName}</h3>
      <p><b>Book ID:</b> {book.bookId}</p>
      <p><b>Author:</b> {book.authorName}</p>
      <button
        type="button"
        className="btn-danger"
        onClick={() => onDelete(book.bookId)}
        aria-label={`Delete ${book.bookName}`}
      >
        Delete Book
      </button>
    </article>
  );
});

// Reusable labelled input with inline error
function Field({ label, name, value, onChange, error, inputRef }) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type="text"
        placeholder={`Enter ${label}`}
        value={value}
        onChange={onChange}
        ref={inputRef}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : undefined}
      />
      {error && (
        <span id={`${name}-error`} className="error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

// Main App Component
function App() {
  const [books, setBooks] = useState(loadBooks);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [query, setQuery] = useState("");
  const firstInputRef = useRef(null);

  // Persist books
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
    } catch {
      /* storage unavailable – ignore */
    }
  }, [books]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = ({ bookName, bookId, authorName }) => {
    const result = {};
    if (!bookName) result.bookName = "Book name is required";
    if (!bookId) result.bookId = "Book ID is required";
    else if (books.some((b) => b.bookId.toLowerCase() === bookId.toLowerCase()))
      result.bookId = "Book ID already exists";
    if (!authorName) result.authorName = "Author name is required";
    return result;
  };

  // Add Book
  const addBook = (e) => {
    e.preventDefault();

    const trimmed = {
      bookName: form.bookName.trim(),
      bookId: form.bookId.trim(),
      authorName: form.authorName.trim(),
    };

    const validation = validate(trimmed);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setBooks((prev) => [...prev, trimmed]);
    setForm(EMPTY_FORM);
    firstInputRef.current?.focus();
  };

  // Delete Book (with confirmation)
  const deleteBook = (id) => {
    if (!window.confirm("Delete this book?")) return;
    setBooks((prev) => prev.filter((b) => b.bookId !== id));
  };

  // Search filter
  const filteredBooks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return books;
    return books.filter(
      (b) =>
        b.bookName.toLowerCase().includes(q) ||
        b.authorName.toLowerCase().includes(q) ||
        b.bookId.toLowerCase().includes(q)
    );
  }, [books, query]);

  return (
    <div className="container">
      <h1>Library Book Management System</h1>

      <section>
        <h2>Add New Book</h2>
        <form onSubmit={addBook} noValidate>
          <Field
            label="Book Name"
            name="bookName"
            value={form.bookName}
            onChange={handleChange}
            error={errors.bookName}
            inputRef={firstInputRef}
          />
          <Field
            label="Book ID"
            name="bookId"
            value={form.bookId}
            onChange={handleChange}
            error={errors.bookId}
          />
          <Field
            label="Author Name"
            name="authorName"
            value={form.authorName}
            onChange={handleChange}
            error={errors.authorName}
          />
          <button type="submit" className="btn-primary">Add Book</button>
        </form>
      </section>

      <section>
        <div className="list-header">
          <h2>Available Books ({books.length})</h2>
          {books.length > 0 && (
            <input
              type="search"
              className="search"
              placeholder="Search by name, author or ID"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search books"
            />
          )}
        </div>

        <div className="book-list">
          {books.length === 0 ? (
            <p className="empty">No books available in the library.</p>
          ) : filteredBooks.length === 0 ? (
            <p className="empty">No books match "{query}".</p>
          ) : (
            filteredBooks.map((book) => (
              <BookCard key={book.bookId} book={book} onDelete={deleteBook} />
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default App;