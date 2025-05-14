import React from 'react';
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
  isGoHero?: boolean;
  goHeroBadge?: string;
  goContributions?: number;
};

// Contributors data is updated automatically by GitHub Actions
const topContributors: Contributor[] = [
  {
    login: 'anon-pradip',
    avatar_url: 'https://avatars.githubusercontent.com/u/27019402?v=4',
    html_url: 'https://github.com/anon-pradip',
    contributions: 13,
    isDocHero: false,
    docHeroBadge: null,
    docContributions: 0,
    isGoHero: false,
    goHeroBadge: null,
    goContributions: 0
  },
  {
    login: 'michaelstingl',
    avatar_url: 'https://avatars.githubusercontent.com/u/214010?v=4',
    html_url: 'https://github.com/michaelstingl',
    contributions: 4,
    isDocHero: true,
    docHeroBadge: "🦸",
    docContributions: 9,
    isGoHero: false,
    goHeroBadge: null,
    goContributions: 0
  },
  {
    login: 'FelixDobler',
    avatar_url: 'https://avatars.githubusercontent.com/u/46747171?v=4',
    html_url: 'https://github.com/FelixDobler',
    contributions: 1,
    isDocHero: false,
    docHeroBadge: null,
    docContributions: 0,
    isGoHero: false,
    goHeroBadge: null,
    goContributions: 0
  },
  {
    login: 'jochumdev',
    avatar_url: 'https://avatars.githubusercontent.com/u/358074?v=4',
    html_url: 'https://github.com/jochumdev',
    contributions: 1,
    isDocHero: false,
    docHeroBadge: null,
    docContributions: 0,
    isGoHero: false,
    goHeroBadge: null,
    goContributions: 0
  },
  {
    login: 'skatsubo',
    avatar_url: 'https://avatars.githubusercontent.com/u/16467385?v=4',
    html_url: 'https://github.com/skatsubo',
    contributions: 1,
    isDocHero: false,
    docHeroBadge: null,
    docContributions: 0,
    isGoHero: false,
    goHeroBadge: null,
    goContributions: 0
  },
  {
    login: 'LukasHirt',
    avatar_url: 'https://avatars.githubusercontent.com/u/25989331?v=4',
    html_url: 'https://github.com/LukasHirt',
    contributions: 1,
    isDocHero: false,
    docHeroBadge: null,
    docContributions: 0,
    isGoHero: false,
    goHeroBadge: null,
    goContributions: 0
  },
  {
    login: 'erikjv',
    avatar_url: 'https://avatars.githubusercontent.com/u/151956?v=4',
    html_url: 'https://github.com/erikjv',
    contributions: 1,
    isDocHero: false,
    docHeroBadge: null,
    docContributions: 0,
    isGoHero: false,
    goHeroBadge: null,
    goContributions: 0
  }
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
                      alt={`GitHub avatar for ${contributor.login}`}
                      className={styles.contributorAvatar} 
                    />
                    <div className={styles.contributorName}>
                      {contributor.login}
                    </div>
                  </a>
                  <div className={styles.contributorInfo}>
                    <a 
                      href={`https://github.com/search?q=org%3Aopencloud-eu+author%3A${contributor.login}&s=created&o=desc`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.contributionsLink}
                    >
                      <div className={styles.contributorStats}>
                        {contributor.contributions} contributions
                      </div>
                    </a>

                    {contributor.isDocHero && (
                      <div className={styles.badgeLabel} style={{backgroundColor: 'var(--ifm-color-primary-darker)'}}>
                        <span className={styles.badgeEmoji}>📚</span>
                        Documentation Hero
                        <span className={styles.badgeEmoji}>🦸</span>
                      </div>
                    )}
                    {contributor.isGoHero && (
                      <div className={styles.badgeLabel} style={{backgroundColor: 'var(--ifm-color-success-dark)'}}>
                        <span className={styles.badgeEmoji}>🦫</span>
                        Code Gopher
                        <span className={styles.badgeEmoji}>🏆</span>
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
}