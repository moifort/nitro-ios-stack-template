#!/bin/bash
set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== nitro-ios-stack-template init ===${NC}"
echo ""

# 1. Prompt for project name (PascalCase)
read -p "Project name (PascalCase, e.g. MyApp): " PROJECT_NAME

if [[ -z "$PROJECT_NAME" ]]; then
  echo -e "${RED}Error: Project name cannot be empty${NC}"
  exit 1
fi

if [[ ! "$PROJECT_NAME" =~ ^[A-Z][a-zA-Z0-9]+$ ]]; then
  echo -e "${RED}Error: Project name must be PascalCase (start with uppercase, alphanumeric only)${NC}"
  exit 1
fi

# 2. Derive variants
LOWERCASE=$(echo "$PROJECT_NAME" | tr '[:upper:]' '[:lower:]')
# Convert PascalCase to kebab-case
KEBAB=$(echo "$PROJECT_NAME" | sed 's/\([A-Z]\)/-\1/g' | sed 's/^-//' | tr '[:upper:]' '[:lower:]')

read -p "Bundle ID prefix (e.g. com.yourcompany): " BUNDLE_PREFIX
if [[ -z "$BUNDLE_PREFIX" ]]; then
  BUNDLE_PREFIX="com.example"
fi

BUNDLE_ID="${BUNDLE_PREFIX}.${LOWERCASE}"
BUNDLE_ID_TESTS="${BUNDLE_PREFIX}.${LOWERCASE}.uitests"

echo ""
echo -e "Project name:  ${GREEN}${PROJECT_NAME}${NC}"
echo -e "Package name:  ${GREEN}${KEBAB}${NC}"
echo -e "Bundle ID:     ${GREEN}${BUNDLE_ID}${NC}"
echo ""
read -p "Continue? (y/N): " CONFIRM
if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
  echo "Aborted."
  exit 0
fi

echo ""
echo -e "${BLUE}Renaming files and directories...${NC}"

# 3. Rename iOS directories
if [ -d "ios/MyApp" ]; then
  mv "ios/MyApp" "ios/${PROJECT_NAME}"
fi
if [ -d "ios/MyAppUITests" ]; then
  mv "ios/MyAppUITests" "ios/${PROJECT_NAME}UITests"
fi
if [ -d "ios/MyApp.xcodeproj" ]; then
  mv "ios/MyApp.xcodeproj" "ios/${PROJECT_NAME}.xcodeproj"
fi

# 4. Rename Swift files
if [ -f "ios/${PROJECT_NAME}/MyAppApp.swift" ]; then
  mv "ios/${PROJECT_NAME}/MyAppApp.swift" "ios/${PROJECT_NAME}/${PROJECT_NAME}App.swift"
fi

# Rename xctestplan
if [ -f "ios/MyApp.xctestplan" ]; then
  mv "ios/MyApp.xctestplan" "ios/${PROJECT_NAME}.xctestplan"
fi

# Rename xcscheme
if [ -f "ios/${PROJECT_NAME}.xcodeproj/xcshareddata/xcschemes/MyApp.xcscheme" ]; then
  mv "ios/${PROJECT_NAME}.xcodeproj/xcshareddata/xcschemes/MyApp.xcscheme" \
     "ios/${PROJECT_NAME}.xcodeproj/xcshareddata/xcschemes/${PROJECT_NAME}.xcscheme"
fi

echo -e "${BLUE}Replacing references in files...${NC}"

# 5. Find-and-replace in all text files
# Use find to get all text files, exclude .git and binary dirs
find . -type f \
  -not -path './.git/*' \
  -not -path './node_modules/*' \
  -not -path './.output/*' \
  -not -path './.nitro/*' \
  -not -name '*.png' \
  -not -name '*.jpg' \
  -not -name '*.ico' \
  -not -name 'init.sh' \
  | while read -r file; do
    # Check if file is text (not binary)
    if file --brief --mime-type "$file" | grep -q 'text\|json\|xml'; then
      sed -i '' "s/MyApp/${PROJECT_NAME}/g" "$file" 2>/dev/null || true
      sed -i '' "s/my-app/${KEBAB}/g" "$file" 2>/dev/null || true
      sed -i '' "s/com\.example\.myapp\.uitests/${BUNDLE_ID_TESTS}/g" "$file" 2>/dev/null || true
      sed -i '' "s/com\.example\.myapp/${BUNDLE_ID}/g" "$file" 2>/dev/null || true
    fi
  done

# Uncomment gitignore secrets paths (already renamed by find-and-replace above)
sed -i '' "s|# ios/${PROJECT_NAME}/Shared/Secrets.swift|ios/${PROJECT_NAME}/Shared/Secrets.swift|g" .gitignore 2>/dev/null || true
sed -i '' "s|# ios/${PROJECT_NAME}UITests/Support/TestSecrets.swift|ios/${PROJECT_NAME}UITests/Support/TestSecrets.swift|g" .gitignore 2>/dev/null || true

echo -e "${BLUE}Creating secret files from templates...${NC}"

# 6. Create secrets from examples
if [ -f "ios/${PROJECT_NAME}/Shared/Secrets.swift.example" ]; then
  cp "ios/${PROJECT_NAME}/Shared/Secrets.swift.example" "ios/${PROJECT_NAME}/Shared/Secrets.swift"
fi
if [ -f "ios/${PROJECT_NAME}UITests/Support/TestSecrets.swift.example" ]; then
  cp "ios/${PROJECT_NAME}UITests/Support/TestSecrets.swift.example" "ios/${PROJECT_NAME}UITests/Support/TestSecrets.swift"
fi
if [ -f ".env.example" ]; then
  cp .env.example .env
fi

echo -e "${BLUE}Installing dependencies...${NC}"

# 7. Install dependencies
bun install

echo -e "${BLUE}Initializing git...${NC}"

# 8. Init git + first commit
rm -rf .git
git init
git add -A
git commit -m "Initial commit from nitro-ios-stack-template"

echo ""
echo -e "${GREEN}=== Done! ===${NC}"
echo ""
echo "Next steps:"
echo "  1. Update ios/${PROJECT_NAME}/Shared/Secrets.swift with your API token"
echo "  2. Update .env with your environment variables"
echo "  3. Set your Development Team in Xcode"
echo "  4. Run the backend:  bun run dev"
echo "  5. Open the iOS project:  open ios/${PROJECT_NAME}.xcodeproj"
echo ""
