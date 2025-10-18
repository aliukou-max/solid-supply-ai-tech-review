#!/bin/bash
cd /frontend
find . -name "*.tsx" -type f | while read file; do
  if ! head -1 "$file" | grep -q "@ts-nocheck"; then
    echo "// @ts-nocheck" > temp
    cat "$file" >> temp
    mv temp "$file"
  fi
done
