#!/bin/bash

# Fix for Vite environment variables TypeScript error
echo "🔧 Fixing TypeScript environment variables issue..."

# Create Vite environment types declaration
cat > chatbot-frontend/src/vite-env.d.ts << 'EOF'
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CHATBOT_API_URL: string
  readonly VITE_CATALOG_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
EOF

# Update tsconfig.node.json to be more explicit
cat > chatbot-frontend/tsconfig.node.json << 'EOF'
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "types": ["vite/client"]
  },
  "include": ["vite.config.ts"]
}
EOF

# Also ensure the main tsconfig includes the vite-env file
cat > chatbot-frontend/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["vite/client"]
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
EOF

echo "✅ TypeScript configuration fixed!"
echo ""
echo "Now rebuild the containers:"
echo "  docker compose build chatbot-frontend"
echo "  docker compose up -d"
