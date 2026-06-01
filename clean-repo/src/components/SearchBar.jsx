import { useState } from 'react';

function SearchBar({ defaultValue = '', onSearch }) {
  const [query, setQuery] = useState(defaultValue);

  function submit(e) {
    e.preventDefault();
    onSearch(query.trim());
  }

  return (
    <form onSubmit={submit} className="search-bar">
      <span className="material-symbols-outlined search-start">search</span>
      <input
        type="text"
        placeholder="Search anime, movies, genres..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button type="submit" className="button button-primary">Search</button>
    </form>
  );
}

export default SearchBar;
