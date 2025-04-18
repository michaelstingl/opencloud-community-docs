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
};

// Contributors data is updated automatically by GitHub Actions
const topContributors: Contributor[] = [
  {
    login: 'JammingBen',
    avatar_url: 'https://avatars.githubusercontent.com/u/50302941?v=4',
    html_url: 'https://github.com/JammingBen',
    contributions: 487,
    isDocHero: false,
    docHeroBadge: null,
    docContributions: 14,
  },
  {
    login: 'TheOneRing',
    avatar_url: 'https://avatars.githubusercontent.com/u/200626?v=4',
    html_url: 'https://github.com/TheOneRing',
    contributions: 300,
    isDocHero: false,
    docHeroBadge: null,
    docContributions: 0,
  },
  {
    login: 'rhafer',
    avatar_url: 'https://avatars.githubusercontent.com/u/373399?v=4',
    html_url: 'https://github.com/rhafer',
    contributions: 155,
    isDocHero: false,
    docHeroBadge: null,
    docContributions: 30,
  },
  {
    login: 'ScharfViktor',
    avatar_url: 'https://avatars.githubusercontent.com/u/84779829?v=4',
    html_url: 'https://github.com/ScharfViktor',
    contributions: 132,
    isDocHero: true,
    docHeroBadge: "🦸",
    docContributions: 58,
  },
  {
    login: 'butonic',
    avatar_url: 'https://avatars.githubusercontent.com/u/956847?v=4',
    html_url: 'https://github.com/butonic',
    contributions: 104,
    isDocHero: false,
    docHeroBadge: null,
    docContributions: 38,
  },
  {
    login: 'aduffeck',
    avatar_url: 'https://avatars.githubusercontent.com/u/203813?v=4',
    html_url: 'https://github.com/aduffeck',
    contributions: 86,
    isDocHero: false,
    docHeroBadge: null,
    docContributions: 26,
  },
  {
    login: 'individual-it',
    avatar_url: 'https://avatars.githubusercontent.com/u/2425577?v=4',
    html_url: 'https://github.com/individual-it',
    contributions: 76,
    isDocHero: false,
    docHeroBadge: null,
    docContributions: 15,
  },
  {
    login: 'tbsbdr',
    avatar_url: 'https://avatars.githubusercontent.com/u/26610733?v=4',
    html_url: 'https://github.com/tbsbdr',
    contributions: 65,
    isDocHero: false,
    docHeroBadge: null,
    docContributions: 30,
  },
  {
    login: 'guruz',
    avatar_url: 'https://avatars.githubusercontent.com/u/959327?v=4',
    html_url: 'https://github.com/guruz',
    contributions: 45,
    isDocHero: false,
    docHeroBadge: null,
    docContributions: 0,
  },
  {
    login: 'fschade',
    avatar_url: 'https://avatars.githubusercontent.com/u/49308105?v=4',
    html_url: 'https://github.com/fschade',
    contributions: 25,
    isDocHero: false,
    docHeroBadge: null,
    docContributions: 4,
  },
  {
    login: 'dragotin',
    avatar_url: 'https://avatars.githubusercontent.com/u/1070214?v=4',
    html_url: 'https://github.com/dragotin',
    contributions: 24,
    isDocHero: false,
    docHeroBadge: null,
    docContributions: 15,
  },
  {
    login: 'felix-schwarz',
    avatar_url: 'https://avatars.githubusercontent.com/u/639669?v=4',
    html_url: 'https://github.com/felix-schwarz',
    contributions: 21,
    isDocHero: false,
    docHeroBadge: null,
    docContributions: 0,
  },
  {
    login: 'Svanvith',
    avatar_url: 'https://avatars.githubusercontent.com/u/193597294?v=4',
    html_url: 'https://github.com/Svanvith',
    contributions: 20,
    isDocHero: false,
    docHeroBadge: null,
    docContributions: 18,
  },
  {
    login: 'Heiko-Pohl',
    avatar_url: 'https://avatars.githubusercontent.com/u/194484975?v=4',
    html_url: 'https://github.com/Heiko-Pohl',
    contributions: 14,
    isDocHero: false,
    docHeroBadge: null,
    docContributions: 11,
  },
  {
    login: 'michaelstingl',
    avatar_url: 'https://avatars.githubusercontent.com/u/214010?v=4',
    html_url: 'https://github.com/michaelstingl',
    contributions: 11,
    isDocHero: false,
    docHeroBadge: null,
    docContributions: 5,
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
}