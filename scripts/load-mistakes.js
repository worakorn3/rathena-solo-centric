#!/usr/bin/env node
// Universal Node.js / Bun cross-platform context loader
// Reads distilled HOT mistakes and action items into agent context (< 350 tokens)
try {
  const fs = require('fs');
  const path = require('path');

  const hotPath = path.join(__dirname, '..', 'MISTAKES_AND_LEARNINGS.md');
  if (fs.existsSync(hotPath)) {
    process.stdout.write(fs.readFileSync(hotPath, 'utf8'));
  }
} catch {
  // Fail-safe: ensure hook never blocks agent invocation even if file access fails
}
process.exit(0);
