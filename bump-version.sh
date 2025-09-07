#!/bin/bash

# PWA Version Bump Script
# Usage: ./bump-version.sh v21

if [ $# -eq 0 ]; then
    echo "Usage: $0 <new_version>"
    echo "Example: $0 v21"
    exit 1
fi

NEW_VERSION=$1
echo "🚀 Bumping PWA to version: $NEW_VERSION"

# Update app-version.js
echo "📝 Updating app-version.js..."
sed -i "s/^\/\/ v.*/\/\/ $NEW_VERSION/" app-version.js
sed -i "s/export const APP_VERSION = '[^']*'/export const APP_VERSION = '$NEW_VERSION'/" app-version.js

# Update index.html
echo "📝 Updating index.html..."
sed -i "s/?v=v[^\"]*/?v=$NEW_VERSION/g" index.html
sed -i "s/const v = '[^']*'/const v = '$NEW_VERSION'/" index.html

# Update sw.js
echo "📝 Updating sw.js..."
sed -i "s/^\/\/ v.*/\/\/ $NEW_VERSION/" sw.js
sed -i "s/const APP_VERSION = '[^']*'/const APP_VERSION = '$NEW_VERSION'/" sw.js
sed -i "s/?v=v[^']*/?v=$NEW_VERSION/g" sw.js

# Update app.js
echo "📝 Updating app.js..."
sed -i "s/?v=v[^']*/?v=$NEW_VERSION/g" app.js

echo "✅ Version bump complete! All files updated to $NEW_VERSION"
echo ""
echo "🔄 Next steps:"
echo "1. Test the PWA locally"
echo "2. git add ."
echo "3. git commit -m \"release($NEW_VERSION): bump version and update cache keys\""
echo "4. git push origin main"