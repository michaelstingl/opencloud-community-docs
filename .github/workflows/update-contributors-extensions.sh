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

# Enhanced debugging - check for ALL contribution counts first
echo "Checking ALL contribution counts:"
for TYPE_INFO in "${HERO_TYPES[@]}"; do
  # Split type info
  IFS=":" read -r TYPE_PREFIX TYPE_NAME TYPE_CONTRIB_PROPERTY <<< "$TYPE_INFO"
  
  # Count how many users have any contributions of this type
  CONTRIBUTORS_WITH_TYPE=$(grep -o "${TYPE_CONTRIB_PROPERTY}: [^0][0-9]*" $COMPONENT_PATH || echo "")
  COUNT=$(echo "$CONTRIBUTORS_WITH_TYPE" | wc -l)
  
  echo "Found $COUNT contributors with ${TYPE_PREFIX} contributions:"
  echo "$CONTRIBUTORS_WITH_TYPE"
  
  # Show detailed list of contributors with this type
  echo "Detailed ${TYPE_PREFIX} contributors:"
  grep -A 5 -B 5 "${TYPE_CONTRIB_PROPERTY}: [^0][0-9]*" $COMPONENT_PATH | grep -A 1 -B 1 "login: "
done

# For each hero type, extract the hero's name and contributions
for TYPE_INFO in "${HERO_TYPES[@]}"; do
  # Split type info
  IFS=":" read -r TYPE_PREFIX TYPE_NAME TYPE_CONTRIB_PROPERTY <<< "$TYPE_INFO"
  
  # Find hero for this type - search with more detailed context and debugging
  echo "Searching for ${TYPE_PREFIX} hero..."
  grep -n -B 5 -A 5 "is${TYPE_PREFIX}Hero: true" $COMPONENT_PATH || echo "No match found for ${TYPE_PREFIX} hero"
  
  # Try different grep approaches for more robust matching
  HERO=$(grep -B 3 "is${TYPE_PREFIX}Hero: true" $COMPONENT_PATH | grep -o "login: '[^']*'" | head -1 | sed "s/login: '//g" | sed "s/'$//g" || echo "")
  
  # If that didn't work, try a more lenient approach
  if [ -z "$HERO" ]; then
    echo "First approach failed, trying alternative method..."
    HERO=$(grep "${TYPE_PREFIX}Hero" $COMPONENT_PATH -A 5 -B 5 | grep -o "login: '[^']*'" | head -1 | sed "s/login: '//g" | sed "s/'$//g" || echo "")
  fi
  
  # If hero found, add to commit message
  if [ -n "$HERO" ]; then
    CONTRIBUTIONS=$(grep -A 10 "login: '${HERO}'" $COMPONENT_PATH | grep -o "${TYPE_CONTRIB_PROPERTY}: [0-9]*" | head -1 | sed "s/${TYPE_CONTRIB_PROPERTY}: //g" || echo "0")
    COMMIT_MSG="${COMMIT_MSG}\n\n${TYPE_NAME}: ${HERO} with ${CONTRIBUTIONS} ${TYPE_PREFIX,,} contributions"
    echo "✅ Found ${TYPE_NAME}: ${HERO} with ${CONTRIBUTIONS} contributions"
  else
    echo "❌ No ${TYPE_NAME} found in component"
    
    # Debug - find maximum contributor for this type
    MAX_CONTRIBUTOR=""
    MAX_CONTRIBUTIONS=0
    
    while read -r LINE; do
      if [[ "$LINE" =~ ${TYPE_CONTRIB_PROPERTY}:\ ([0-9]+) ]]; then
        CONTRIBUTIONS="${BASH_REMATCH[1]}"
        if [[ "$CONTRIBUTIONS" -gt "$MAX_CONTRIBUTIONS" ]]; then
          # Get the login name by searching backward
          LOGIN=$(grep -B 10 "$LINE" $COMPONENT_PATH | grep -o "login: '[^']*'" | tail -1 | sed "s/login: '//g" | sed "s/'$//g" || echo "")
          if [[ -n "$LOGIN" ]]; then
            MAX_CONTRIBUTOR="$LOGIN"
            MAX_CONTRIBUTIONS="$CONTRIBUTIONS"
          fi
        fi
      fi
    done < <(grep -o "${TYPE_CONTRIB_PROPERTY}: [0-9]*" $COMPONENT_PATH)
    
    if [[ "$MAX_CONTRIBUTIONS" -gt "0" ]]; then
      echo "💡 Potential ${TYPE_NAME} candidate: ${MAX_CONTRIBUTOR} with ${MAX_CONTRIBUTIONS} contributions"
      
      # Check if this contributor has a flag
      IS_HERO_FLAG=$(grep -A 10 "login: '${MAX_CONTRIBUTOR}'" $COMPONENT_PATH | grep "is${TYPE_PREFIX}Hero:" | head -1 || echo "")
      echo "Hero flag status: $IS_HERO_FLAG"
    else
      echo "No contributors found with ${TYPE_PREFIX} contributions > 0"
    fi
  fi
done

# Debug final output
echo "Final Commit Message:"
echo -e "$COMMIT_MSG"

# Also dump component content for debugging
echo "Component content (first 50 lines):"
head -n 50 $COMPONENT_PATH

# Output the commit message to be used by the calling script
echo -e "$COMMIT_MSG"