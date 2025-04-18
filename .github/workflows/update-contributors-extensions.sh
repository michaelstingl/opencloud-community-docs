#!/bin/bash

# This script handles dynamic hero extraction for different contribution types
# It generates a commit message with all hero types found in the HallOfFame component

COMPONENT_PATH="src/components/HallOfFame/index.tsx"

# Extract top community contributor (first entry in the contributors array)
TOP_CONTRIBUTOR=$(grep -o "login: '[^']*'" $COMPONENT_PATH | head -1 | sed "s/login: '//g" | sed "s/'$//g" || echo "unknown")
TOP_CONTRIBUTIONS=$(grep -A 4 "login: '${TOP_CONTRIBUTOR}'" $COMPONENT_PATH | grep -o "contributions: [0-9]*" | head -1 | sed "s/contributions: //g" || echo "unknown")

# Base commit message
COMMIT_MSG="Update community hall of fame contributors [$(date -u '+%Y-%m-%d')]\n\nUpdated by GitHub Actions workflow\n\nTop community contributor: ${TOP_CONTRIBUTOR} with ${TOP_CONTRIBUTIONS} contributions"

# Define the hero types to look for
HERO_TYPES=("Doc:Documentation Hero:docContributions" "Go:Code Gopher:goContributions")

# For each hero type, extract the hero's name and contributions
for TYPE_INFO in "${HERO_TYPES[@]}"; do
  # Split type info
  IFS=":" read -r TYPE_PREFIX TYPE_NAME TYPE_CONTRIB_PROPERTY <<< "$TYPE_INFO"
  
  # Find hero for this type
  HERO=$(grep -B 3 "is${TYPE_PREFIX}Hero: true" $COMPONENT_PATH | grep -o "login: '[^']*'" | head -1 | sed "s/login: '//g" | sed "s/'$//g" || echo "")
  
  # If hero found, add to commit message
  if [ -n "$HERO" ]; then
    CONTRIBUTIONS=$(grep -A 10 "login: '${HERO}'" $COMPONENT_PATH | grep -o "${TYPE_CONTRIB_PROPERTY}: [0-9]*" | head -1 | sed "s/${TYPE_CONTRIB_PROPERTY}: //g" || echo "0")
    COMMIT_MSG="${COMMIT_MSG}\n\n${TYPE_NAME}: ${HERO} with ${CONTRIBUTIONS} ${TYPE_PREFIX,,} contributions"
    echo "✅ Found ${TYPE_NAME}: ${HERO} with ${CONTRIBUTIONS} contributions"
  fi
done

# Output the commit message to be used by the calling script
echo -e "$COMMIT_MSG"