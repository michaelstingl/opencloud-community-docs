import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import HallOfFame from '@site/src/components/HallOfFame';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function CommunityBanner() {
  return (
    <div className="container margin-top--md">
      <div className="nexus-community-banner">
        <Heading as="h3">🔍 Community-Driven Knowledge</Heading>
        <p>
          <strong>OpenCloud Community Nexus</strong> is a central gathering point for community contributions 
          and knowledge about OpenCloud. This site is <strong>not an official OpenCloud resource</strong>.
        </p>
        <p>
          For official documentation, please visit{' '}
          <a href="https://docs.opencloud.eu" target="_blank" rel="noopener noreferrer">
            docs.opencloud.eu
          </a>
        </p>
      </div>
    </div>
  );
}

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/intro">
            Explore Community Resources →
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} - Community Knowledge Hub`}
      description="A central hub for OpenCloud community contributions, guides, tutorials, and resources">
      <HomepageHeader />
      <CommunityBanner />
      <main>
        <HomepageFeatures />
        <HallOfFame />
      </main>
    </Layout>
  );
}
