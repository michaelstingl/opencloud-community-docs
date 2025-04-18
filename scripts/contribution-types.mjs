// contribution-types.mjs
// Base class for all contribution types
export class ContributionType {
  constructor(name, emoji, badgeName, badgeEmoji, color) {
    this.name = name;           // Name of the contribution type (e.g., "Documentation")
    this.emoji = emoji;         // Emoji used in logs (e.g., "📚")
    this.badgeName = badgeName; // Name for badge (e.g., "Documentation Hero")
    this.badgeEmoji = badgeEmoji; // Badge emoji (e.g., "🦸")
    this.color = color;         // CSS color for badge
    
    // Property names for storing in contributor objects
    this.countProperty = `${name.toLowerCase()}Contributions`;
    this.flagProperty = `is${name}Hero`;
    this.badgeProperty = `${name.toLowerCase()}HeroBadge`;
  }
  
  // Check if a file matches this contribution type
  isMatchingFile(file) {
    return false; // Base implementation, should be overridden
  }
  
  // Find the hero for this contribution type
  findHero(contributors) {
    let hero = null;
    let maxContributions = 0;
    
    for (const contributor of contributors) {
      const contribCount = contributor[this.countProperty] || 0;
      if (contribCount > maxContributions) {
        maxContributions = contribCount;
        hero = contributor.login;
      }
    }
    
    return { hero, maxContributions };
  }
  
  // Mark the hero in the contributors array
  markHero(contributors, heroLogin) {
    if (!heroLogin) return;
    
    for (const contributor of contributors) {
      if (contributor.login === heroLogin) {
        contributor[this.flagProperty] = true;
        contributor[this.badgeProperty] = this.badgeEmoji;
        break;
      }
    }
  }
  
  // Log the hero information
  logHero(heroLogin, contributions) {
    if (heroLogin && contributions > 0) {
      console.log(`${this.emoji} ${this.badgeName} is ${heroLogin} with ${contributions} ${this.name.toLowerCase()} contributions!`);
    }
  }
}

// Documentation contribution type
export class DocumentationContributionType extends ContributionType {
  constructor() {
    super('Doc', '📚', 'Documentation Hero', '🦸', 'var(--ifm-color-primary-darker)');
  }
  
  isMatchingFile(file) {
    return file.filename.startsWith('docs/') || 
           file.filename.endsWith('.md') ||
           file.filename.endsWith('.mdx');
  }
}

// Go code contribution type
export class GoContributionType extends ContributionType {
  constructor() {
    super('Go', '🦫', 'Code Gopher', '🏆', 'var(--ifm-color-success-dark)');
  }
  
  isMatchingFile(file) {
    return file.filename.endsWith('.go') || 
           file.filename === 'go.mod' || 
           file.filename === 'go.sum' ||
           /\/(cmd|pkg|internal)\//.test(file.filename);
  }
}

// Export all contribution types
export const contributionTypes = [
  new DocumentationContributionType(),
  new GoContributionType()
];