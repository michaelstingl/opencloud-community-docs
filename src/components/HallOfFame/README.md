# Community Hall of Fame

This component displays a Hall of Fame for OpenCloud community contributors based on GitHub contributions across all organizational repositories.

## How it works

1. The component displays contributor cards with GitHub avatars, usernames, and contribution counts
2. Data is updated daily via a GitHub Action that runs at 3:00 UTC (5:00 CET)
3. A special "Documentation Hero" badge is awarded to the contributor with the most documentation changes
4. The script automatically prioritizes repositories and filters out employees and bots

## Features

### Automatic Repository Discovery
- The script automatically discovers all public repositories in the opencloud-eu organization
- Repositories are prioritized with most active/important ones first
- A repository cache avoids repeated API calls when rate limits are approached

### Smart Contributor Filtering
- OpenCloud employees and contractors are filtered out automatically
- Bots and automated accounts are excluded
- Filtering logic checks GitHub profile information including company, bio, and username patterns
- Exclusion lists are stored in a private repository for privacy

### Hero Badges
Contributors can earn multiple badges simultaneously if they excel in different contribution areas. For example, someone could be both a Documentation Hero and a Code Gopher if they made the most contributions in both categories.

#### Documentation Hero Feature
- The contributor with the most documentation changes receives a special "Documentation Hero" badge (📚🦸)
- Documentation changes are identified by:
  - Commits to docs/ directories
  - Changes to .md and .mdx files
  - Documentation-specific repositories
  - Repositories with at least 10% Markdown content (lower threshold for better detection)
  - Repositories with more than 100KB of Markdown content (absolute size threshold)

#### Code Gopher Feature
- The contributor with the most Go code changes receives a special "Code Gopher" badge (🦫🧙)
- Go code changes are identified by:
  - Changes to .go files
  - Changes to go.mod and go.sum files
  - Changes in Go project directories like cmd/, pkg/, and internal/

### Logging Controls & Privacy
- Detailed logging is available in verbose mode only
- Employee names and exclusion details are not logged in standard mode
- Verbose mode can be enabled via workflow dispatch parameter when needed

### Rate Limit Handling & Caching
- The script intelligently respects GitHub API rate limits
- Cached data is used as fallback when API limits are reached
- Multi-tier cache fallback system ensures the component always displays data
- Detailed logging provides visibility into API usage and limits

## Priority Repositories

The script prioritizes these repositories for faster analysis:
- `community-nexus`
- `docs`
- `awesome-apps`
- `helm`

To modify these priorities, edit the `PRIORITY_REPOS` array in `scripts/generate-contributors.mjs`.

## Manual Updates

You can manually trigger the GitHub Action to update contributors:
1. Go to the repository on GitHub
2. Navigate to Actions → "Update Contributor Stats"
3. Click "Run workflow"
4. (Optional) Enable "Force refresh" to ignore cache and fetch fresh data
5. (Optional) Enable "Verbose logging" if you need detailed diagnostic information

## Exclusion List Management

Contributor exclusion lists are stored in a private repository:
- Employees and contractors lists
- Company/organization patterns
- Bio keywords to check
- Other excluded users

For access to the exclusion list repository, contact the repository administrators.

### Private Repository Format

The exclusions file must follow this format in the private repository:

```javascript
// Configuration for excluding certain contributors
// This file is maintained in a private repository for privacy reasons

// Organizations and companies to exclude
exports.EXCLUDED_COMPANIES = [
  'Company Name 1', 
  'Company Name 2'
];

// Bot account patterns to exclude
exports.BOT_PATTERNS = ['[bot]']; 

// Keywords to check in user bio
exports.BIO_KEYWORDS = [
  'keyword1', 
  'keyword2'
];

// Specific users to exclude
exports.EXCLUDED_USERS = [
  // Group 1
  'username1',
  'username2',
  
  // Group 2
  'username3'
];
```

The file must be located at `/config/contributor-exclusions.js` in the private repository.

### Required Secrets

The workflow requires the following repository secrets to be set:

- `PRIVATE_REPO_TOKEN`: A GitHub token with access to the private exclusion list repository

Without this token, the workflow will not be able to access the private exclusion lists and will fall back to basic filtering only.

## Local Testing

If you want to test the contributor script locally:

```bash
# Clone both repositories
git clone https://github.com/opencloud-community/nexus.git
cd nexus

# Clone the private exclusions repository (if you have access)
git clone https://github.com/opencloud-community/gmbh.git ../gmbh

# Set your GitHub token (create one at https://github.com/settings/tokens)
# Token needs repo and read:org permissions
export GITHUB_TOKEN=your_github_token_here

# Optional: Enable verbose logging for detailed output
export VERBOSE_LOGGING=true

# Optional: Force refresh to bypass caching
export FORCE_REFRESH=true

# Run the script
node scripts/generate-contributors.mjs
```

The script will automatically look for exclusion lists in the following locations:
1. `../../gmbh/config/contributor-exclusions.js` (if you cloned as shown above)
2. `../private-exclusions/config/contributor-exclusions.js` (GitHub Actions path)

## Customization

- To change the number of contributors shown, modify the `slice(0, 15)` in the script
- Style changes can be made in `styles.module.css`
- Default fallback exclusion rules are defined in the script but are minimal

### Performance & API Usage

The system is optimized to minimize GitHub API requests:

- API data is cached where possible to reduce request count
- When analyzing contribution types, files are only scanned once, regardless of how many contribution types exist
- Adding new contribution types doesn't increase API request volume
- The system tracks and logs API usage to help monitor rate limits

### Adding New Hero Types

The system is designed to be modular and easily extensible. To add a new hero type (e.g., "UI Hero" for UI/CSS contributions):

1. Add a new class to `scripts/contribution-types.mjs`:
   ```javascript
   export class UiContributionType extends ContributionType {
     constructor() {
       super('Ui', '🎨', 'UI Hero', '✨', 'var(--ifm-color-primary-light)');
     }
     
     isMatchingFile(file) {
       return file.filename.endsWith('.css') || 
              file.filename.endsWith('.scss') ||
              /\/(components|ui)\//.test(file.filename);
     }
   }
   ```

2. Add your new type to the exported array:
   ```javascript
   export const contributionTypes = [
     new DocumentationContributionType(),
     new GoContributionType(),
     new UiContributionType()  // New type
   ];
   ```

3. Update the GitHub Actions workflow:
   ```bash
   # In .github/workflows/update-contributors-extensions.sh:
   HERO_TYPES=("Doc:Documentation Hero:docContributions" "Go:Code Gopher:goContributions" "Ui:UI Hero:uiContributions")
   
   # In .github/workflows/update-contributors.yml:
   HERO_MARKERS=("Doc:Documentation Hero" "Go:Code Gopher" "Ui:UI Hero")
   ```

No further changes are needed - the system will automatically detect the new hero type, analyze contributions, and display the appropriate badges.

## Troubleshooting

If the component is not updating:

1. Check GitHub Actions logs for any errors or rate limit issues
2. Try running with "Force refresh" and "Verbose logging" options enabled
3. Verify your GitHub token has sufficient permissions
4. Check if the private exclusion list repository is accessible
5. Look for `.contributors-cache.json` and `.repo-cache.json` in the repository
6. Try running the script locally with your own token
7. Ensure both the update-contributors and deploy workflows have access to the exclusion repository

### Common Issues

- **Missing exclusions**: Make sure the format in `contributor-exclusions.js` follows the exact format shown above
- **ES Module errors**: The script uses ESM format (`.mjs`), so CommonJS syntax like `require()` won't work
- **Rate limiting**: GitHub API has rate limits, especially for unauthenticated requests
- **Parsing errors**: Comments in the exclusion lists can sometimes cause parsing issues in the arrays
- **Empty arrays**: If an exclusion list is empty, it may be logged as "0 users" but this shouldn't affect functionality
- **Node.js fetch compatibility**: The script uses the built-in `fetch` API available in Node.js v18+. No external fetch library is needed. If you see errors related to `fetch`, make sure you're using Node.js v18.0.0 or higher.
- **"goRepos is not defined" errors**: These occur when the script tries to use variables before they're defined or across module boundaries. Fixed by using global variables and proper async function structure.
- **Missing exclusion repository**: The private repository with exclusion lists must be checked out in both workflows. Both the `update-contributors.yml` and `deploy.yml` workflows need the `checkout` step for the private repository.

### Node.js Version Requirements

This component uses the following Node.js features:
- **ES Modules**: Scripts use the `.mjs` extension and ES module syntax
- **Top-level await**: For API calls and file operations (now properly wrapped in async functions)
- **Built-in fetch API**: Available in Node.js v18+ (no need for `node-fetch` package)
- **Global variables**: Used across module functions for tracking repository types

GitHub Actions workflows are configured to use Node.js v18, which supports all these features. If running locally, ensure you're using at least Node.js v18.0.0.

#### Important Implementation Notes

To avoid "goRepos is not defined" and similar errors:
- Repository type arrays (`goRepos` and `markdownRepos`) are defined as global variables
- All async functions properly use `async` keyword and `await` for calls
- Helper functions like `prioritizeRepositories` are defined as async functions
- The script avoids top-level await at module scope, which can cause issues in some environments

Both the direct contributor update (via `update-contributors.yml`) and the pre-build process (via `deploy.yml`) run the same script with the same requirements.