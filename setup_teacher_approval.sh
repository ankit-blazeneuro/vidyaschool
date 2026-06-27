#!/bin/bash

echo "🚀 Setting up Teacher Approval Feature..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set"
    echo "Please set it in your .env file"
    exit 1
fi

# Load environment variables from frontend/.env.local
if [ -f "frontend/.env.local" ]; then
    export $(cat frontend/.env.local | grep -v '^#' | xargs)
fi

echo "📦 Installing dependencies..."
cd frontend && npm install socket.io-client uuid @types/uuid

echo "🗄️  Running database migration..."
psql "$DATABASE_URL" < migrations/add_teacher_approval.sql

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Start backend: cd backend && source .venv/bin/activate && uvicorn main:app --reload --port 8000"
echo "2. Start frontend: cd frontend && npm run dev"
echo "3. Test by signing up with 'Teacher' role"
