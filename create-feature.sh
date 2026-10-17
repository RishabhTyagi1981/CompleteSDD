#!/usr/bin/env bash
set -e

echo -e "\033[34m========================================================\033[0m"
echo -e "\033[1;34m  🚀 SDD INTERACTIVE FEATURE INITIALIZER\033[0m"
echo -e "\033[34m========================================================\033[0m"

read -p "📝 Enter Jira Key (e.g., PROJ-102): " JIRA_KEY
read -p "🗂️ Enter Feature Slug (e.g., payment-gateway): " FEATURE_SLUG

# Format cleanly and isolate the string variables
TARGET_DIR="specs/${JIRA_KEY}-${FEATURE_SLUG}"

# Create the folder explicitly first
mkdir -p "$TARGET_DIR"

# Generate the tracking matrix file inside the target folder
cat <<EOT > "${TARGET_DIR}/tasks.md"
# TASKS-${JIRA_KEY}: Implementation Execution Checklist

- [ ] Task 1: Scaffolding - Initialize empty file paths and interface skeletons.
- [ ] Task 2: Build out mocked unit test files inside the 'tests/' routing domain.
- [ ] Task 3: Verify local test engine executes and fails cleanly.
- [ ] Task 4: Complete functional target logic until all test suites pass.
EOT

echo -e "\n\033[32m✨ Complete! Feature stack successfully allocated.\033[0m"
echo -e "💡 Living spec files waiting inside: \033[34m${TARGET_DIR}/\033[0m\n"
