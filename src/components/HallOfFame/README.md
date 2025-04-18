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

### Documentation Hero Feature
- The contributor with the most documentation changes receives a special badge
- Documentation changes are identified by:
  - Commits to docs/ directories
  - Changes to .md and .mdx files
  - Documentation-specific repositories

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

## Local Testing

If you want to test the contributor script locally:

```bash
# Clone the repository
git clone https://github.com/opencloud-community/nexus.git
cd nexus

# Set your GitHub token (create one at https://github.com/settings/tokens)
# Token needs repo and read:org permissions
export GITHUB_TOKEN=your_github_token_here

# Optional: Enable verbose logging
export VERBOSE_LOGGING=true

# Run the script
node scripts/generate-contributors.mjs
```

## Customization

- To change the number of contributors shown, modify the `slice(0, 15)` in the script
- Style changes can be made in `styles.module.css`
- Default fallback exclusion rules are defined in the script but are minimal

## Troubleshooting

If the component is not updating:

1. Check GitHub Actions logs for any errors or rate limit issues
2. Try running with "Force refresh" and "Verbose logging" options enabled
3. Verify your GitHub token has sufficient permissions
4. Check if the private exclusion list repository is accessible
5. Look for `.contributors-cache.json` and `.repo-cache.json` in the repository
6. Try running the script locally with your own token