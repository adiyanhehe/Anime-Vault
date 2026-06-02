#!/bin/bash
# Fix broken submodule reference

# Remove cached submodule
git rm --cached clean-repo 2>/dev/null || true

# Remove submodule from .gitmodules if it exists
if [ -f .gitmodules ]; then
  git config --file .gitmodules --remove-section submodule.clean-repo 2>/dev/null || true
  # If .gitmodules is empty, remove it
  if [ ! -s .gitmodules ]; then
    git rm .gitmodules
  fi
fi

# Commit the fix
git config user.email "action@github.com"
git config user.name "GitHub Action"
git add -A
git commit -m "fix: remove broken submodule reference" || echo "No changes to commit"
git push origin main
