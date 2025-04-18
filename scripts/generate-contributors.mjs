// This script fetches contributor data from GitHub repositories
// and generates an updated HallOfFame component with real data
import { writeFileSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Check for verbose logging mode
const VERBOSE_LOGGING = process.env.VERBOSE_LOGGING === 'true';

// Custom logging function that respects verbose mode
function log(message, isVerbose = false) {
  if (!isVerbose || VERBOSE_LOGGING) {
    console.log(message);
  }
}

// Custom error logging that always shows
function logError(message) {
  console.error(message);
}

// For local testing, this can be run directly with a GitHub token
// When running in GitHub Actions, the token will be provided as an environment variable
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!GITHUB_TOKEN) {
  logError('❌ GitHub token is required. Set GITHUB_TOKEN environment variable.');
  process.exit(1);
}

// Define organization to track
const ORGANIZATION = 'opencloud-eu';

// Priority repos to analyze first (most likely to have community contributions)
const PRIORITY_REPOS = [
  'community-nexus',
  'docs',
  'awesome-apps',
  'helm'
];

// Function to fetch all public repositories of the organization
async function fetchOrgRepositories() {
  log(`🔍 Fetching public repositories for ${ORGANIZATION}...`);
  
  try {
    // Try to load from cache first to avoid fetching if we're rate limited
    try {
      const cachePath = path.resolve(__dirname, '../.repo-cache.json');
      const fs = await import('fs/promises');
      
      try {
        await fs.access(cachePath);
        const cacheContent = await fs.readFile(cachePath, 'utf8');
        const cache = JSON.parse(cacheContent);
        
        if (cache.repos && cache.timestamp) {
          const cacheAge = Date.now() - cache.timestamp;
          const oneDayMs = 24 * 60 * 60 * 1000;
          
          if (cacheAge < oneDayMs) {
            log(`🔄 Using cached repository list (${cache.repos.length} repos, cached ${Math.round(cacheAge / (60 * 60 * 1000))} hours ago)`);
            return prioritizeRepositories(cache.repos);
          }
        }
      } catch (err) {
        // Cache not available, will fetch fresh data
      }
    } catch (cacheError) {
      // Continue with API fetch if cache fails
    }
    
    // Get all public repositories in the organization (paginated)
    let allRepos = [];
    let page = 1;
    let hasMoreRepos = true;
    let rateLimitExceeded = false;
    
    while (hasMoreRepos && !rateLimitExceeded) {
      try {
        const response = await fetch(
          `https://api.github.com/orgs/${ORGANIZATION}/repos?type=public&per_page=100&page=${page}&sort=pushed`,
          {
            headers: {
              Authorization: `token ${GITHUB_TOKEN}`,
              Accept: 'application/vnd.github.v3+json',
            },
          }
        );
        
        // Enhanced rate limit handling with detailed logging
        const rateLimitRemaining = parseInt(response.headers.get('x-ratelimit-remaining') || '1');
        const rateLimitLimit = parseInt(response.headers.get('x-ratelimit-limit') || '0');
        const rateLimitReset = parseInt(response.headers.get('x-ratelimit-reset') || '0');
        const resetDate = new Date(rateLimitReset * 1000);
        
        // Log detailed rate limit info
        log(`📊 API Rate Limit Status: ${rateLimitRemaining}/${rateLimitLimit} remaining, resets at ${resetDate.toISOString()}`, true);
        
        if (rateLimitRemaining <= 20) {
          console.warn(`⚠️ GitHub API rate limit low: ${rateLimitRemaining}/${rateLimitLimit} remaining!`);
        }
        
        if (rateLimitRemaining <= 5) {
          // Critical low threshold - we need to preserve API calls for processing what we have
          logError(`🛑 Critically low API limit (${rateLimitRemaining}/${rateLimitLimit})! Stopping repository fetching to preserve remaining calls.`);
          
          // If we already have some repos, break to use what we have
          if (allRepos.length > 0) {
            log(`📝 Using ${allRepos.length} repositories fetched so far`);
            break;
          }
          
          // If we're on page 1 and have no repos yet, continue one more time to try to get at least some repos
          if (page === 1) {
            log('🔄 Attempting to fetch at least the first page of repos');
          } else {
            rateLimitExceeded = true;
            break;
          }
        }
        
        if (rateLimitRemaining <= 0) {
          // Hard rate limit exceeded
          const minutesUntilReset = Math.ceil((resetDate.getTime() - new Date().getTime()) / (1000 * 60));
          
          logError(`🛑 GitHub API rate limit exceeded! Resets in ${minutesUntilReset} minutes at ${resetDate.toISOString()}`);
          rateLimitExceeded = true;
          break;
        }
        
        if (!response.ok) {
          // Enhanced error handling with detailed logging
          if (response.status === 403) {
            console.error(`❌ Error 403: Access denied fetching repositories for ${ORGANIZATION}`);
            
            // Check if this is a rate limit issue
            if (response.headers.get('x-ratelimit-remaining') === '0') {
              console.error('Rate limit exceeded - see reset time above');
            } else {
              console.error('Please check that your token has the "repo" and "read:org" permissions');
            }
            
            try {
              const errorBody = await response.json();
              console.error(`Error details: ${JSON.stringify(errorBody)}`);
            } catch (e) {
              const errorText = await response.text();
              console.error(`Error response: ${errorText.substring(0, 500)}${errorText.length > 500 ? '...' : ''}`);
            }
            
            rateLimitExceeded = true;
            break;
          } else if (response.status === 404) {
            console.error(`❌ Error 404: Organization ${ORGANIZATION} not found or insufficient permissions`);
            break;
          } else {
            logError(`❌ Error ${response.status} fetching repositories: ${response.statusText}`);
            break;
          }
        }
        
        const repos = await response.json();
        
        if (repos.length === 0) {
          hasMoreRepos = false;
        } else {
          allRepos = [...allRepos, ...repos];
          log(`📂 Fetched page ${page}, got ${repos.length} repos (total: ${allRepos.length})`, true);
          page++;
        }
      } catch (fetchError) {
        console.error(`❌ Network error fetching repositories page ${page}: ${fetchError.message}`);
        // Continue with the repos we have rather than failing completely
        break;
      }
    }
    
    // Map to the format we need
    const repoList = allRepos.map(repo => ({ 
      owner: ORGANIZATION,
      repo: repo.name,
      isFork: repo.fork,
      stars: repo.stargazers_count || 0,
      updated_at: repo.updated_at || '',
      pushed_at: repo.pushed_at || '',
      has_issues: repo.has_issues || false,
    }));
    
    // Cache the fetched repos for future use
    try {
      const fs = await import('fs/promises');
      const cachePath = path.resolve(__dirname, '../.repo-cache.json');
      const cacheData = {
        timestamp: Date.now(),
        repos: repoList
      };
      await fs.writeFile(cachePath, JSON.stringify(cacheData, null, 2), 'utf8');
      log(`✅ Cached ${repoList.length} repositories for future runs`);
    } catch (cacheError) {
      console.error(`⚠️ Could not cache repositories: ${cacheError.message}`);
    }
    
    log(`✅ Found ${repoList.length} public repositories in ${ORGANIZATION}`);
    
    // Filter and prioritize
    return prioritizeRepositories(repoList);
  } catch (error) {
    console.error(`❌ Error fetching organization repositories: ${error.message}`);
    console.error('Stack trace:', error.stack);
    
    // Return a minimal set of important repos as fallback
    console.log('⚠️ Falling back to predefined priority repositories');
    return PRIORITY_REPOS.map(repoName => ({
      owner: ORGANIZATION,
      repo: repoName,
      isFork: false
    }));
  }
}

// Helper function to prioritize repositories for analysis
function prioritizeRepositories(repoList) {
  // Filter out forks
  const nonForkRepos = repoList.filter(repo => !repo.isFork);
  log(`📦 Found ${nonForkRepos.length} non-fork repositories (filtered out ${repoList.length - nonForkRepos.length} forks)`);
  
  if (nonForkRepos.length === 0) {
    console.warn('⚠️ No repositories found after filtering. Using predefined priority repos as fallback');
    return PRIORITY_REPOS.map(repoName => ({
      owner: ORGANIZATION,
      repo: repoName,
      isFork: false
    }));
  }
  
  // Sort repos with priority repos first, then by recency/activity
  return nonForkRepos.sort((a, b) => {
    // Priority repos first
    const aIsPriority = PRIORITY_REPOS.includes(a.repo);
    const bIsPriority = PRIORITY_REPOS.includes(b.repo);
    
    if (aIsPriority && !bIsPriority) return -1;
    if (!aIsPriority && bIsPriority) return 1;
    
    // Then sort by most recently pushed
    if (a.pushed_at && b.pushed_at) {
      return new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime();
    }
    
    // Then by stars
    return (b.stars || 0) - (a.stars || 0);
  });
}

// Load exclusion lists from private repo if available, otherwise use minimal defaults
let EXCLUDED_COMPANIES = ['opencloud', '[bot]']; // Minimal fallback to exclude OpenCloud employees
let BOT_PATTERNS = ['[bot]']; // Common suffix for bot accounts
let BIO_KEYWORDS = ['bot', 'automation'];
let EXCLUDED_USERS = [];

// Try to import configuration from private repository
try {
  // In ESM modules, need to compute __dirname dynamically
  const scriptFilename = fileURLToPath(import.meta.url);
  const scriptDir = path.dirname(scriptFilename);
  
  // Try multiple potential paths - for local development and GitHub Actions
  const potentialPaths = [
    path.resolve(scriptDir, '../../gmbh/config/contributor-exclusions.js'),       // Local dev path
    path.resolve(scriptDir, '../private-exclusions/config/contributor-exclusions.js'), // GitHub Actions path
  ];
  
  // In ES modules, we need to use dynamic imports and fs promises
  const { existsSync, readFileSync } = await import('fs');
  
  // Find the first path that exists
  const exclusionsPath = potentialPaths.find(p => existsSync(p));
  
  if (exclusionsPath) {
    log('📋 Loading contributor exclusions from private configuration');
    
    // Since we can't require() in ES modules, load the file content and parse it
    const fileContent = readFileSync(exclusionsPath, 'utf8');
    
    // Extract the arrays using regex for simple parsing
    const extractArray = (name) => {
      const regex = new RegExp(`exports\\.${name}\\s*=\\s*\\[(.*?)\\]`, 's');
      const match = fileContent.match(regex);
      if (match && match[1]) {
        // Parse the array content safely
        try {
          return JSON.parse(`[${match[1].replace(/'/g, '"')}]`);
        } catch (e) {
          log(`⚠️ Error parsing ${name} from exclusion file: ${e.message}`, true);
          return null;
        }
      }
      return null;
    };
    
    // Extract each exclusion list
    const companies = extractArray('EXCLUDED_COMPANIES');
    const bots = extractArray('BOT_PATTERNS');
    const keywords = extractArray('BIO_KEYWORDS');
    const users = extractArray('EXCLUDED_USERS');
    
    // Use the extracted lists if available
    if (companies) EXCLUDED_COMPANIES = companies;
    if (bots) BOT_PATTERNS = bots;
    if (keywords) BIO_KEYWORDS = keywords;
    if (users) EXCLUDED_USERS = users;
    
    log(`📋 Loaded exclusion lists: ${EXCLUDED_USERS.length} users, ${EXCLUDED_COMPANIES.length} companies, ${BIO_KEYWORDS.length} keywords`);
  } else {
    log('⚠️ Private exclusion configuration not found, using defaults');
  }
} catch (error) {
  log(`⚠️ Error loading private exclusions: ${error.message}`);
}

// Calculate date 90 days ago for filtering
const DAYS_TO_LOOK_BACK = 90;
const ninetyDaysAgo = new Date();
ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - DAYS_TO_LOOK_BACK);
const ninetyDaysAgoISOString = ninetyDaysAgo.toISOString();
log(`🗓️ Looking for contributions since: ${ninetyDaysAgoISOString} (${DAYS_TO_LOOK_BACK} days)`);

// Get current directory (for ES Modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if a user should be excluded (company employee or bot)
async function shouldExcludeUser(username) {
  // First check if username is in the explicit exclude list
  if (EXCLUDED_USERS.includes(username)) {
    return true;
  }
  
  // Next check if it's a bot based on username patterns
  for (const pattern of BOT_PATTERNS) {
    if (username.includes(pattern)) {
      return true;
    }
  }
  
  // Then check GitHub profile
  try {
    const response = await fetch(`https://api.github.com/users/${username}`, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      console.error(`❌ Error fetching user info for ${username}: ${response.statusText}`);
      return false; // Default to including them if we can't verify
    }

    const userData = await response.json();
    
    // Check if it's an app account by URL
    if (userData.html_url && userData.html_url.includes('/apps/')) {
      return true;
    }
    
    // Check if company matches any excluded company
    if (userData.company) {
      for (const company of EXCLUDED_COMPANIES) {
        if (userData.company.toLowerCase().includes(company.toLowerCase())) {
          return true;
        }
      }
    }
    
    // Check if bio contains excluded keywords
    if (userData.bio) {
      const bioLower = userData.bio.toLowerCase();
      for (const keyword of BIO_KEYWORDS) {
        if (bioLower.includes(keyword.toLowerCase())) {
          return true;
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error checking user ${username}:`, error);
    return false; // Default to including them if there's an error
  }
}

// Note: The functionality of fetchRecentContributions has been integrated directly into 
// the generateContributorData function for better optimization

// Fetch documentation contributions (commits that modify docs/ dir or .md files)
async function fetchDocumentationContributions(owner, repo, contributor, sinceTimestamp) {
  // Convert Unix timestamp to ISO date for GitHub API
  const sinceDate = new Date(sinceTimestamp * 1000).toISOString();
  
  try {
    // Fetch commits for this user in this repo since the cutoff date
    const commitsResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits?author=${contributor.login}&since=${sinceDate}&per_page=100`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );
    
    // Check for rate limiting
    const rateLimitRemaining = parseInt(commitsResponse.headers.get('x-ratelimit-remaining') || '1');
    const rateLimitReset = parseInt(commitsResponse.headers.get('x-ratelimit-reset') || '0');
    
    if (rateLimitRemaining <= 5) {
      // Rate limit nearly exceeded, skip detailed processing to conserve API calls
      const resetDate = new Date(rateLimitReset * 1000);
      console.warn(`⚠️ GitHub API rate limit nearly reached! Skipping detailed doc analysis to preserve remaining calls. Resets at ${resetDate.toISOString()}`);
      return;
    }
    
    if (!commitsResponse.ok) {
      if (commitsResponse.status === 403) {
        console.error(`🛑 API rate limit exceeded while fetching commits for ${contributor.login} in ${owner}/${repo}`);
        return;
      }
      
      console.error(`❌ Error fetching commits for ${contributor.login} in ${owner}/${repo}: ${commitsResponse.status} ${commitsResponse.statusText}`);
      return;
    }
    
    const commits = await commitsResponse.json();
    
    // If no commits found, exit early
    if (!commits || commits.length === 0) {
      return;
    }
    
    // For each commit, check if it modified documentation files
    let processedCommits = 0;
    for (const commit of commits) {
      try {
        // Check if we're getting close to the rate limit
        if (rateLimitRemaining - processedCommits <= 10) {
          console.warn(`⚠️ Approaching API rate limit, stopping detailed commit analysis after ${processedCommits} commits`);
          break;
        }
        
        const commitDetailResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/commits/${commit.sha}`,
          {
            headers: {
              Authorization: `token ${GITHUB_TOKEN}`,
              Accept: 'application/vnd.github.v3+json',
            },
          }
        );
        
        processedCommits++;
        
        if (!commitDetailResponse.ok) {
          if (commitDetailResponse.status === 403) {
            console.error(`🛑 API rate limit exceeded during commit detail analysis`);
            return;
          }
          console.error(`❌ Error fetching commit ${commit.sha}: ${commitDetailResponse.status} ${commitDetailResponse.statusText}`);
          continue;
        }
        
        const commitDetail = await commitDetailResponse.json();
        
        // Check if any files in the commit are documentation files
        const hasDocChanges = commitDetail.files?.some(file => 
          file.filename.startsWith('docs/') || 
          file.filename.endsWith('.md') ||
          file.filename.endsWith('.mdx')
        );
        
        if (hasDocChanges) {
          contributor.docContributions++;
        }
      } catch (error) {
        console.error(`❌ Error processing commit ${commit.sha}: ${error.message}`);
      }
    }
    
    if (contributor.docContributions > 0) {
      log(`📚 ${contributor.login} has ${contributor.docContributions} documentation contributions in ${owner}/${repo}`, true);
    }
  } catch (error) {
    console.error(`❌ Error in fetchDocumentationContributions: ${error.message}`);
    if (error.stack) {
      console.error(`Stack trace: ${error.stack}`);
    }
  }
}

// Legacy method for fetching all contributors (fallback)
async function fetchContributors(owner, repo) {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contributors?per_page=100`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    if (!response.ok) {
      console.error(`❌ Error fetching contributors for ${owner}/${repo}: ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    return data.map(contributor => ({
      login: contributor.login,
      avatar_url: contributor.avatar_url,
      html_url: contributor.html_url,
      contributions: contributor.contributions,
    }));
  } catch (error) {
    console.error(`❌ Error fetching contributors for ${owner}/${repo}:`, error);
    return [];
  }
}

async function generateContributorData() {
  log('🔍 Fetching contributor data from the last 90 days...');
  
  // Get all repositories in the organization
  const repositories = await fetchOrgRepositories();
  
  // Fetch basic contributors information first (without doc details)
  let allContributors = [];
  for (const { owner, repo } of repositories) {
    log(`📊 Fetching contributors for ${owner}/${repo}...`, true);
    try {
      // First check if the repo is empty to avoid JSON parsing errors
      const repoResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}`,
        {
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );
      
      if (!repoResponse.ok) {
        console.error(`❌ Error fetching repository info for ${owner}/${repo}: ${repoResponse.statusText}`);
        continue;
      }
      
      const repoData = await repoResponse.json();
      
      // Check if the repository is empty (size = 0 and recently created)
      if (repoData.size === 0 && repoData.created_at === repoData.updated_at) {
        console.log(`⚠️ Skipping empty repository ${owner}/${repo}`);
        continue;
      }
      
      // Using the /stats/contributors endpoint to get contributions by week
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/stats/contributors`,
        {
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );
  
      // Handle GitHub's 202 response (still computing stats)
      if (response.status === 202) {
        console.log(`⏳ GitHub is computing stats for ${owner}/${repo}, waiting 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue; // Skip for now and maybe catch in next run
      }
      
      // Handle empty repositories (HTTP 409 or similar error codes)
      if (response.status === 409) {
        console.log(`⚠️ Repository ${owner}/${repo} appears to be empty, skipping`);
        continue;
      }
  
      if (!response.ok) {
        console.error(`❌ Error fetching contributors for ${owner}/${repo}: ${response.statusText}`);
        continue;
      }
      
      // Check for empty response before parsing JSON
      const responseText = await response.text();
      if (!responseText || responseText.trim() === '') {
        console.log(`⚠️ Empty response from API for ${owner}/${repo}, skipping`);
        continue;
      }
      
      // Now parse the JSON safely
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (jsonError) {
        console.error(`❌ Error parsing JSON for ${owner}/${repo}: ${jsonError.message}`);
        console.log(`   Response was: ${responseText.substring(0, 100)}${responseText.length > 100 ? '...' : ''}`);
        continue;
      }
      
      // Calculate the week index for 90 days ago (weeks are in unix timestamp format)
      const ninetyDaysAgoUnix = Math.floor(ninetyDaysAgo.getTime() / 1000);
      
      // Process each contributor
      for (const contributor of data) {
        if (!contributor.author) continue; // Skip if author is null (deleted accounts)
        
        // Get weekly contribution counts
        const weeklyCommits = contributor.weeks;
        
        // Filter for weeks after our cutoff date
        const recentWeeklyCommits = weeklyCommits.filter(week => week.w >= ninetyDaysAgoUnix);
        
        // Sum up commits in the period
        const recentCommits = recentWeeklyCommits.reduce((sum, week) => sum + week.c, 0);
        
        if (recentCommits > 0) {
          allContributors.push({
            login: contributor.author.login,
            avatar_url: contributor.author.avatar_url,
            html_url: contributor.author.html_url,
            contributions: recentCommits,
            docContributions: 0, // We'll update this later for community members
          });
        }
      }
    } catch (error) {
      console.error(`❌ Error processing ${owner}/${repo}:`, error);
    }
  }
  
  // Merge duplicate contributors and sum their contributions
  const contributorMap = {};
  for (const contributor of allContributors) {
    const { login } = contributor;
    if (!contributorMap[login]) {
      contributorMap[login] = { ...contributor };
    } else {
      contributorMap[login].contributions += contributor.contributions;
    }
  }
  
  log(`🔍 Found ${Object.keys(contributorMap).length} unique contributors in the last ${DAYS_TO_LOOK_BACK} days`);
  
  // Filter out OpenCloud employees and bots FIRST
  log('🔎 Filtering contributors...', true);
  const communityContributors = [];
  
  for (const username in contributorMap) {
    const shouldExclude = await shouldExcludeUser(username);
    if (!shouldExclude) {
      communityContributors.push(contributorMap[username]);
    }
  }
  
  log(`🌟 Found ${communityContributors.length} community contributors`);
  
  // ONLY NOW get documentation contributions for community members
  log('📚 Analyzing documentation contributions for community members...');
  
  // Skip documentation analysis if we have no repositories 
  // (likely due to API limits or permission issues)
  if (repositories.length === 0) {
    console.warn('⚠️ Skipping documentation analysis as no repositories were found');
  } else {
    // Limit repositories analyzed per contributor to avoid excessive API calls
    const MAX_REPOS_PER_CONTRIBUTOR = 5;
    
    // Prioritize repositories most likely to have documentation
    const prioritizedRepos = [...repositories].sort((a, b) => {
      // Docs repo gets highest priority
      if (a.repo.includes('docs')) return -1;
      if (b.repo.includes('docs')) return 1;
      return 0;
    });
    
    for (const contributor of communityContributors) {
      // Take only the first N repos to avoid excessive API usage
      const reposToAnalyze = prioritizedRepos.slice(0, MAX_REPOS_PER_CONTRIBUTOR);
      
      log(`📊 Analyzing doc contributions for ${contributor.login} across ${reposToAnalyze.length} repositories...`, true);
      
      for (const { owner, repo } of reposToAnalyze) {
        const ninetyDaysAgoUnix = Math.floor(ninetyDaysAgo.getTime() / 1000);
        await fetchDocumentationContributions(owner, repo, contributor, ninetyDaysAgoUnix);
      }
    }
  }
  
  // Find the Documentation Hero among community members
  let docHero = null;
  let maxDocContributions = 0;
  
  for (const contributor of communityContributors) {
    if (contributor.docContributions > maxDocContributions) {
      maxDocContributions = contributor.docContributions;
      docHero = contributor.login;
    }
  }
  
  if (docHero && maxDocContributions > 0) {
    log(`📚 Documentation Hero is ${docHero} with ${maxDocContributions} doc contributions!`);
    // Mark the doc hero in the data
    for (const contributor of communityContributors) {
      if (contributor.login === docHero) {
        contributor.isDocHero = true;
        contributor.docHeroBadge = "🦸"; // Superhero emoji badge
        break;
      }
    }
  }
  
  // Sort contributors by number of contributions
  const sortedContributors = communityContributors
    .sort((a, b) => b.contributions - a.contributions)
    .slice(0, 15); // Show top 15 contributors
  
  if (sortedContributors.length > 0) {
    log(`🏆 Top community contributor: ${sortedContributors[0]?.login} with ${sortedContributors[0]?.contributions} contributions in the last ${DAYS_TO_LOOK_BACK} days`);
  } else {
    log('⚠️ No community contributors found in the specified time period');
  }
  
  return sortedContributors;
}

async function updateHallOfFameComponent(contributors) {
  const componentPath = path.resolve(__dirname, '../src/components/HallOfFame/index.tsx');
  
  try {
    // Create the new contributors array as a string
    const contributorsArrayString = contributors.map(contributor => `  {
    login: '${contributor.login}',
    avatar_url: '${contributor.avatar_url}',
    html_url: '${contributor.html_url}',
    contributions: ${contributor.contributions},
    isDocHero: ${contributor.isDocHero || false},
    docHeroBadge: ${contributor.docHeroBadge ? `"${contributor.docHeroBadge}"` : 'null'},
    docContributions: ${contributor.docContributions || 0},
  }`).join(',\n');
    
    // Generate the entire component file content from scratch
    const newComponentContent = `import React from 'react';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

// Type definition for contributors
type Contributor = {
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
  isDocHero?: boolean;
  docHeroBadge?: string;
  docContributions?: number;
};

// Contributors data is updated automatically by GitHub Actions
const topContributors: Contributor[] = [
${contributorsArrayString}
];

export default function HallOfFame(): React.ReactElement {
  return (
    <section className={styles.hallOfFame}>
      <div className="container">
        <div className="row">
          <div className="col">
            <Heading as="h2" className={styles.hallOfFameTitle}>
              Community Hall of Fame
            </Heading>
            <p className={styles.hallOfFameSubtitle}>
              Thanks to these community contributors for their work on OpenCloud in the last 90 days!
              <br/>
              <small>
                Contributions are commits across all public repositories in the opencloud-eu organization.
              </small>
            </p>
            <div className={styles.contributorsGrid}>
              {topContributors.map((contributor) => (
                <div key={contributor.login} className={styles.contributorCard}>
                  <a 
                    href={contributor.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.profileLink}
                  >
                    <img 
                      src={contributor.avatar_url} 
                      alt={\`GitHub avatar for \${contributor.login}\`}
                      className={styles.contributorAvatar} 
                    />
                    <div className={styles.contributorName}>
                      {contributor.login}
                    </div>
                  </a>
                  <div className={styles.contributorInfo}>
                    <a 
                      href={\`https://github.com/search?q=org%3Aopencloud-eu+author%3A\${contributor.login}&s=created&o=desc\`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.contributionsLink}
                    >
                      <div className={styles.contributorStats}>
                        {contributor.contributions} contributions
                      </div>
                    </a>
                    {contributor.isDocHero && (
                      <div className={styles.badgeLabel}>
                        <span className={styles.badgeEmoji}>📚</span>
                        Documentation Hero
                        <span className={styles.badgeEmoji}>🦸</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.viewAllLink}>
              <a href="https://github.com/search?q=org%3Aopencloud-eu+is%3Apr+is%3Amerged&s=created&type=Issues" target="_blank" rel="noopener noreferrer">
                View all merged pull requests →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}`;
    
    // Write the completely new component to the file
    writeFileSync(componentPath, newComponentContent, 'utf8');
    log('✅ HallOfFame component completely regenerated successfully!');
  } catch (error) {
    console.error('❌ Error updating HallOfFame component:', error);
  }
}

// Fallback mechanism to load previously saved contributors if available
async function loadPreviousContributors() {
  try {
    // Get path to a potential cache file
    const cachePath = path.resolve(__dirname, '../.contributors-cache.json');
    const fs = await import('fs/promises');
    
    try {
      // Check if the file exists
      await fs.access(cachePath);
      
      // Read the cache file
      const cacheContent = await fs.readFile(cachePath, 'utf8');
      
      if (cacheContent) {
        try {
          const cache = JSON.parse(cacheContent);
          if (cache.timestamp && cache.contributors && cache.contributors.length > 0) {
            // Check if cache is still valid (less than 7 days old for emergency fallback)
            const cacheAge = Date.now() - cache.timestamp;
            const oneDayMs = 24 * 60 * 60 * 1000;
            const maxCacheAgeMs = 7 * oneDayMs; // 7 days as absolute max
            
            // Check freshness level
            if (cacheAge < oneDayMs) {
              console.log(`✅ Using fresh cached contributors data from ${new Date(cache.timestamp).toISOString()}`);
              return { 
                contributors: cache.contributors, 
                isFresh: true,
                timestamp: cache.timestamp
              };
            } else if (cacheAge < maxCacheAgeMs) {
              console.log(`⚠️ Using older cached contributors data from ${new Date(cache.timestamp).toISOString()} (${Math.round(cacheAge / oneDayMs)} days old)`);
              return { 
                contributors: cache.contributors, 
                isFresh: false,
                timestamp: cache.timestamp
              };
            } else {
              console.log(`🔄 Cache exists but is too old (${Math.round(cacheAge / oneDayMs)} days), will attempt to fetch fresh data`);
              return { 
                contributors: cache.contributors, 
                isFresh: false,
                isStale: true,
                timestamp: cache.timestamp
              };
            }
          }
        } catch (e) {
          console.error(`❌ Error parsing cache file: ${e.message}`);
        }
      }
    } catch (err) {
      // File doesn't exist or can't be accessed
      console.log('📭 No cache file found, will fetch fresh data');
    }
    
    return { contributors: null, isFresh: false };
  } catch (error) {
    console.error(`❌ Error loading previous contributors: ${error.message}`);
    return { contributors: null, isFresh: false };
  }
}

// Save contributors to cache for fallback in case of future API failures
async function saveContributorsCache(contributors) {
  if (!contributors || contributors.length === 0) {
    console.warn('⚠️ Not caching empty contributors list');
    return; // Don't cache empty results
  }
  
  try {
    const cachePath = path.resolve(__dirname, '../.contributors-cache.json');
    const fs = await import('fs/promises');
    
    // Add additional metadata to the cache
    const cacheData = {
      timestamp: Date.now(),
      createdAt: new Date().toISOString(),
      count: contributors.length,
      contributors
    };
    
    // Write the updated cache file
    await fs.writeFile(cachePath, JSON.stringify(cacheData, null, 2), 'utf8');
    console.log(`✅ Saved ${contributors.length} contributors to cache for fallback (${new Date().toISOString()})`);
  } catch (error) {
    console.error(`❌ Error saving contributors cache: ${error.message}`);
    // Continue execution even if caching fails
  }
}

// Main execution
async function main() {
  let contributors = [];
  let usedCache = false;
  let apiSuccess = true;
  
  try {
    log(`🚀 Starting Community Hall of Fame contributors update (${new Date().toISOString()})`);
    
    // First try to load previous contributors as fallback
    const { contributors: cachedContributors, isFresh, timestamp } = await loadPreviousContributors();
    
    // Check if force refresh is enabled
    const forceRefresh = process.env.FORCE_REFRESH === 'true';
    
    // If we have fresh cached data and force refresh is not enabled, use cached data
    if (cachedContributors && isFresh && !forceRefresh) {
      const cacheDate = new Date(timestamp);
      console.log(`💾 Using recently cached data from ${cacheDate.toISOString()} (${cachedContributors.length} contributors)`);
      contributors = cachedContributors;
      usedCache = true;
    } else {
      // Log if we're using force refresh
      if (forceRefresh) {
        console.log('🔄 Force refresh enabled - ignoring cache and fetching fresh data from GitHub API');
      }
      // Try to generate fresh contributor data
      try {
        log('🔄 Attempting to fetch fresh contributor data from GitHub API...');
        const freshContributors = await generateContributorData();
        
        if (freshContributors && freshContributors.length > 0) {
          log(`✅ Successfully fetched ${freshContributors.length} contributors from GitHub API`);
          contributors = freshContributors;
          
          // Save fresh data to cache
          await saveContributorsCache(contributors);
        } else {
          console.error('⚠️ API fetch returned no contributors - this is likely an error');
          apiSuccess = false;
          
          // Fallback to cached data if available
          if (cachedContributors && cachedContributors.length > 0) {
            console.log(`🔄 Falling back to cached data with ${cachedContributors.length} contributors`);
            contributors = cachedContributors;
            usedCache = true;
          }
        }
      } catch (apiError) {
        console.error(`❌ Error fetching fresh contributor data: ${apiError.message}`);
        apiSuccess = false;
        
        // Fallback to cached data
        if (cachedContributors && cachedContributors.length > 0) {
          console.log(`🔄 Falling back to cached data due to API error`);
          contributors = cachedContributors;
          usedCache = true;
        }
      }
    }
    
    // If we have contributors (either from API or cache), update the component
    if (contributors && contributors.length > 0) {
      await updateHallOfFameComponent(contributors);
      log(`✅ Updated Hall of Fame component with ${contributors.length} contributors (cache: ${usedCache ? 'yes' : 'no'}, API success: ${apiSuccess ? 'yes' : 'no'})`);
    } else {
      logError('❌ No contributors available from either API or cache');
      
      // Create a minimal set of contributors to avoid breaking the component
      // This ensures the Hall of Fame always shows something
      const fallbackContributors = [
        {
          login: 'community-contributor',
          avatar_url: 'https://avatars.githubusercontent.com/u/583231?v=4',
          html_url: 'https://github.com/octocat',
          contributions: 1,
          docContributions: 1,
          isDocHero: true,
          docHeroBadge: '📚',
        }
      ];
      
      log('⚠️ Using fallback placeholder contributor to avoid breaking the component');
      await updateHallOfFameComponent(fallbackContributors);
    }
  } catch (error) {
    logError('❌ Critical error in main execution: ' + error.message);
    if (error.stack) {
      logError(`Stack trace: ${error.stack}`);
    }
    
    // Don't exit with error, so the workflow continues even with critical failures
    // process.exit(1);
  } finally {
    log(`🏁 Community Hall of Fame update process completed (${new Date().toISOString()})`);
  }
}

main();