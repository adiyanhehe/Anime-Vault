import { useState } from 'react';

function SearchBar({ defaultValue = '', onSearch }) {
  const [query, setQuery] = useState(defaultValue);

  function submit(e) {
    e.preventDefault();
    onSearch(query.trim());
  }

  return (
    <form onSubmit={submit} className="search-bar">
      <input
        type="text"
        placeholder="Search anime..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button type="submit">Search</button>
    </form>
  );
}

export default SearchBar;
