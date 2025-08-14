#!/bin/bash

# Exit on any error
set -e

echo "🔍 Starting publication process..."

# Check if we're in a git repository and working directory is clean
if [ -d .git ]; then
    if [ -n "$(git status --porcelain)" ]; then
        echo "❌ Working directory is not clean. Please commit or stash your changes."
        exit 1
    fi
    echo "✅ Git working directory is clean"
fi

# Build the project
echo "🏗️  Building project..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Build failed - dist directory not found"
    exit 1
fi

echo "✅ Build completed successfully"

# Bump patch version
echo "⬆️  Bumping patch version..."
npm version patch --no-git-tag-version

# Get the new version
NEW_VERSION=$(node -p "require('./package.json').version")
echo "📦 New version: $NEW_VERSION"

# Publish to npm
echo "🚀 Publishing to npm..."
npm publish

echo "✅ Successfully published version $NEW_VERSION to npm!"

# If in git repo, commit and tag the version bump
if [ -d .git ]; then
    echo "📝 Committing version bump..."
    git add package.json
    git commit -m "Bump version to $NEW_VERSION"
    git tag "v$NEW_VERSION"
    
    echo "🏷️  Created git tag v$NEW_VERSION"
    echo "💡 Don't forget to push the changes and tags:"
    echo "   git push && git push --tags"
fi

echo "🎉 Publication complete!"