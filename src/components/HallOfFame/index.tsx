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
    login: 'aduffeck',
    avatar_url: 'https://avatars.githubusercontent.com/u/203813?v=4',
    html_url: 'https://github.com/aduffeck',
    contributions: 86,
    isDocHero: true,
    docHeroBadge: "📚",
    docContributions: 26,
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
  },
  {
    login: 'prashant-gurung899',
    avatar_url: 'https://avatars.githubusercontent.com/u/53248463?v=4',
    html_url: 'https://github.com/prashant-gurung899',
    contributions: 10,
    isDocHero: false,
    docHeroBadge: null,
    docContributions: 3,
  },
  {
    login: 'hosy',
    avatar_url: 'https://avatars.githubusercontent.com/u/736109?v=4',
    html_url: 'https://github.com/hosy',
    contributions: 6,
    isDocHero: false,
    docHeroBadge: null,
    docContributions: 0,
  },
  {
    login: 'PrajwolAmatya',
    avatar_url: 'https://avatars.githubusercontent.com/u/83579989?v=4',
    html_url: 'https://github.com/PrajwolAmatya',
    contributions: 5,
    isDocHero: false,
    docHeroBadge: null,
    docContributions: 0,
  },
  {
    login: 'dschmidt',
    avatar_url: 'https://avatars.githubusercontent.com/u/448487?v=4',
    html_url: 'https://github.com/dschmidt',
    contributions: 4,
    isDocHero: false,
    docHeroBadge: null,
    docContributions: 0,
  },
  {
    login: 'LisaHue',
    avatar_url: 'https://avatars.githubusercontent.com/u/194485717?v=4',
    html_url: 'https://github.com/LisaHue',
    contributions: 2,
    isDocHero: false,
    docHeroBadge: null,
    docContributions: 2,
  },
  {
    login: 'LukasHirt',
    avatar_url: 'https://avatars.githubusercontent.com/u/25989331?v=4',
    html_url: 'https://github.com/LukasHirt',
    contributions: 2,
    isDocHero: false,
    docHeroBadge: null,
    docContributions: 0,
  },
  {
    login: 'DeepDiver1975',
    avatar_url: 'https://avatars.githubusercontent.com/u/1005065?v=4',
    html_url: 'https://github.com/DeepDiver1975',
    contributions: 2,
    isDocHero: false,
    docHeroBadge: null,
    docContributions: 0,
  },
  {
    login: 'Tronde',
    avatar_url: 'https://avatars.githubusercontent.com/u/3941069?v=4',
    html_url: 'https://github.com/Tronde',
    contributions: 1,
    isDocHero: false,
    docHeroBadge: null,
    docContributions: 1,
  },
  {
    login: 'ferenc-hechler',
    avatar_url: 'https://avatars.githubusercontent.com/u/11094156?v=4',
    html_url: 'https://github.com/ferenc-hechler',
    contributions: 1,
    isDocHero: false,
    docHeroBadge: null,
    docContributions: 0,
  },
  {
    login: 'FelixDobler',
    avatar_url: 'https://avatars.githubusercontent.com/u/46747171?v=4',
    html_url: 'https://github.com/FelixDobler',
    contributions: 1,
    isDocHero: false,
    docHeroBadge: null,
    docContributions: 0,
  },
  {
    login: 'jochumdev',
    avatar_url: 'https://avatars.githubusercontent.com/u/358074?v=4',
    html_url: 'https://github.com/jochumdev',
    contributions: 1,
    isDocHero: false,
    docHeroBadge: null,
    docContributions: 0,
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