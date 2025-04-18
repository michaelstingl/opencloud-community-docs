// contribution-analyzer.mjs
import { contributionTypes } from './contribution-types.mjs';

export class ContributionAnalyzer {
  constructor(githubToken, verboseLogging = false) {
    this.githubToken = githubToken;
    this.verboseLogging = verboseLogging;
    this.apiRequestCount = 0; // Track API requests for debugging
  }
  
  // Custom logging function that respects verbose mode
  log(message, isVerbose = false) {
    if (!isVerbose || this.verboseLogging) {
      console.log(message);
    }
  }
  
  // Analyze contributions for a specific user in a repository
  async analyzeContributions(owner, repo, contributor, sinceTimestamp) {
    // Convert Unix timestamp to ISO date for GitHub API
    const sinceDate = new Date(sinceTimestamp * 1000).toISOString();
    
    // Log which repository we're analyzing
    this.log(`📂 Analyzing ${owner}/${repo} for ${contributor.login}...`, false);
    
    try {
      // Initialize contribution counts if they don't exist
      contributionTypes.forEach(type => {
        if (contributor[type.countProperty] === undefined) {
          contributor[type.countProperty] = 0;
        }
      });
      
      // OPTIMIZATION: Only make one API request to get all commits regardless of contribution type
      this.log(`🔍 Fetching commits for ${contributor.login} in ${owner}/${repo}...`, true);
      
      // Fetch commits for this user in this repo since the cutoff date
      const commitsResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/commits?author=${contributor.login}&since=${sinceDate}&per_page=100`,
        {
          headers: {
            Authorization: `token ${this.githubToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );
      
      this.apiRequestCount++;
      
      // Check for rate limiting
      const rateLimitRemaining = parseInt(commitsResponse.headers.get('x-ratelimit-remaining') || '1');
      const rateLimitReset = parseInt(commitsResponse.headers.get('x-ratelimit-reset') || '0');
      
      if (rateLimitRemaining <= 5) {
        // Rate limit nearly exceeded, skip detailed processing to conserve API calls
        const resetDate = new Date(rateLimitReset * 1000);
        console.warn(`⚠️ GitHub API rate limit nearly reached! Skipping detailed analysis to preserve remaining calls. Resets at ${resetDate.toISOString()}`);
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
      
      // For each commit, check file changes
      await this.processCommits(commits, owner, repo, contributor, rateLimitRemaining);
      
      // Log contribution counts
      this.logContributionCounts(contributor, owner, repo);
      
      // Report API usage
      this.log(`📊 Used ${this.apiRequestCount} GitHub API requests for ${contributor.login} in ${owner}/${repo}`, true);
      
    } catch (error) {
      console.error(`❌ Error analyzing contributions: ${error.message}`);
      if (error.stack) {
        console.error(`Stack trace: ${error.stack}`);
      }
    }
  }
  
  async processCommits(commits, owner, repo, contributor, rateLimitRemaining) {
    let processedCommits = 0;
    
    for (const commit of commits) {
      try {
        // Check if we're getting close to the rate limit
        if (rateLimitRemaining - processedCommits <= 10) {
          console.warn(`⚠️ Approaching API rate limit, stopping detailed commit analysis after ${processedCommits} commits`);
          break;
        }
        
        // OPTIMIZATION: Only make one API request per commit to get details, then analyze for all types
        // Get commit details
        const commitDetailResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/commits/${commit.sha}`,
          {
            headers: {
              Authorization: `token ${this.githubToken}`,
              Accept: 'application/vnd.github.v3+json',
            },
          }
        );
        
        this.apiRequestCount++;
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
        
        if (!commitDetail || !commitDetail.files) continue;
        
        // OPTIMIZATION: Check all contribution types at once for each file
        // This ensures we only loop through files once regardless of how many contribution types exist
        if (commitDetail.files && commitDetail.files.length > 0) {
          // Create a set of matched types to avoid double-counting
          const matchedTypes = new Set();
          
          // Analyze each file once
          for (const file of commitDetail.files) {
            // Enhanced debug logging for Go files
            if (this.verboseLogging && (file.filename.endsWith('.go') || file.filename === 'go.mod')) {
              console.log(`🔎 Found Go file: ${file.filename} in commit ${commit.sha.substring(0, 7)} by ${contributor.login}`);
            }
            
            // Check against all contribution types
            for (const type of contributionTypes) {
              if (type.isMatchingFile(file)) {
                if (this.verboseLogging) {
                  console.log(`✅ File ${file.filename} matched type ${type.name} for ${contributor.login}`);
                }
                matchedTypes.add(type);
              }
            }
          }
          
          // Increment counters for all matched types
          for (const type of matchedTypes) {
            contributor[type.countProperty] = (contributor[type.countProperty] || 0) + 1;
          }
        }
      } catch (error) {
        console.error(`❌ Error processing commit ${commit.sha}: ${error.message}`);
      }
    }
  }
  
  logContributionCounts(contributor, owner, repo) {
    for (const type of contributionTypes) {
      const count = contributor[type.countProperty] || 0;
      if (count > 0) {
        this.log(`${type.emoji} ${contributor.login} has ${count} ${type.name.toLowerCase()} contributions in ${owner}/${repo}`, true);
      }
    }
  }
}