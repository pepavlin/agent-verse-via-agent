#!/bin/bash

# Disk Space Cleanup Script
# This script cleans up unnecessary files to free disk space

set -e

echo "=== Disk Space Cleanup Script ==="
echo ""

# Function to show disk usage
show_disk_usage() {
    echo "Current disk usage:"
    df -h | grep -E '(Filesystem|/workspace)'
    echo ""
}

# Show initial disk usage
echo "--- Before Cleanup ---"
show_disk_usage

CLEANED_SPACE=0

# 1. Clean Next.js build cache
if [ -d ".next/dev/cache" ]; then
    echo "Cleaning Next.js dev cache..."
    BEFORE=$(du -sb .next/dev/cache 2>/dev/null | cut -f1 || echo 0)
    rm -rf .next/dev/cache
    mkdir -p .next/dev/cache
    AFTER=$(du -sb .next/dev/cache 2>/dev/null | cut -f1 || echo 0)
    SAVED=$((BEFORE - AFTER))
    CLEANED_SPACE=$((CLEANED_SPACE + SAVED))
    echo "✓ Cleaned Next.js cache (saved $(numfmt --to=iec $SAVED 2>/dev/null || echo "$SAVED bytes"))"
fi

# 2. Clean standalone builds (if exists)
if [ -d ".next/standalone" ]; then
    echo "Cleaning standalone build..."
    BEFORE=$(du -sb .next/standalone 2>/dev/null | cut -f1 || echo 0)
    rm -rf .next/standalone
    AFTER=0
    SAVED=$((BEFORE - AFTER))
    CLEANED_SPACE=$((CLEANED_SPACE + SAVED))
    echo "✓ Cleaned standalone build (saved $(numfmt --to=iec $SAVED 2>/dev/null || echo "$SAVED bytes"))"
fi

# 3. Clean npm cache
if command -v npm &> /dev/null; then
    echo "Cleaning npm cache..."
    npm cache clean --force > /dev/null 2>&1
    echo "✓ Cleaned npm cache"
fi

# 4. Clean test results and temporary files
if [ -d "test-results" ]; then
    echo "Cleaning test results..."
    BEFORE=$(du -sb test-results 2>/dev/null | cut -f1 || echo 0)
    rm -rf test-results/*
    AFTER=$(du -sb test-results 2>/dev/null | cut -f1 || echo 0)
    SAVED=$((BEFORE - AFTER))
    CLEANED_SPACE=$((CLEANED_SPACE + SAVED))
    echo "✓ Cleaned test results (saved $(numfmt --to=iec $SAVED 2>/dev/null || echo "$SAVED bytes"))"
fi

# 5. Clean temporary test files
echo "Cleaning temporary test files..."
TEMP_FILES=$(find . -maxdepth 1 -type f -name "*.tmp" 2>/dev/null || true)
if [ -n "$TEMP_FILES" ]; then
    echo "$TEMP_FILES" | xargs rm -f
    echo "✓ Cleaned temporary test files"
fi

# 6. Clean log files (keep only recent ones)
echo "Cleaning old log files..."
find . -name "*.log" -type f -mtime +7 -delete 2>/dev/null || true
echo "✓ Cleaned old log files (older than 7 days)"

# 7. Clean playwright cache/artifacts (if exists)
if [ -d ".playwright" ]; then
    echo "Cleaning Playwright artifacts..."
    BEFORE=$(du -sb .playwright 2>/dev/null | cut -f1 || echo 0)
    rm -rf .playwright
    AFTER=0
    SAVED=$((BEFORE - AFTER))
    CLEANED_SPACE=$((CLEANED_SPACE + SAVED))
    echo "✓ Cleaned Playwright artifacts (saved $(numfmt --to=iec $SAVED 2>/dev/null || echo "$SAVED bytes"))"
fi

# Show summary
echo ""
echo "--- After Cleanup ---"
show_disk_usage

echo "Total space cleaned: $(numfmt --to=iec $CLEANED_SPACE 2>/dev/null || echo "$CLEANED_SPACE bytes")"
echo ""
echo "=== Cleanup Completed ==="
