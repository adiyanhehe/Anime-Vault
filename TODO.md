# Implementation Checklist
- [x] Read and analyze all source files
- [ ] Fix Consumet API: add timeout, fallback URLs, non-JSON response handling
- [ ] Fix VideoPlayer: add .catch() on dynamic import, guard undefined url
- [ ] Fix AnimeDetails: safe optional chaining on title, rename shadowed gogoId var
- [ ] Add ErrorBoundary component to prevent white screen from uncaught errors
- [ ] Fix AnimeCard: make entire card clickable without breaking favorite button
- [ ] Add lint script to package.json
- [ ] Run build and verify no errors
- [ ] Run preview and verify no white screen