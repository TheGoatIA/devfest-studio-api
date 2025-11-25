#!/bin/sh
set -e

# Fix permissions on the uploads directory
if [ -d "/app/uploads" ]; then
    echo "🔧 Fixing permissions for /app/uploads..."
    chown -R nodejs:nodejs /app/uploads
fi

# Execute the command as the nodejs user
echo "🚀 Starting application as nodejs user..."
exec su-exec nodejs "$@"
