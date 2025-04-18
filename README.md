# OpenCloud Community Nexus

[![Deployment Status](https://github.com/opencloud-community/nexus/actions/workflows/deploy.yml/badge.svg)](https://github.com/opencloud-community/nexus/actions/workflows/deploy.yml)

This repository hosts the OpenCloud Community Nexus - a central hub for community-contributed resources, guides, and knowledge about OpenCloud.

## About

OpenCloud Community Nexus is a community-driven platform that serves as a central gathering point for user contributions, deployment guides, best practices, and other resources related to OpenCloud. It is **not officially maintained by OpenCloud GmbH** but is intended as a collaborative space for the community to share knowledge and experiences.

Our goal is to complement the [official OpenCloud documentation](https://docs.opencloud.eu) with practical, real-world insights from the community.

The site is built using [Docusaurus 3](https://docusaurus.io/), a modern static website generator, and is available at [nexus.opencloud.community](https://nexus.opencloud.community).

## Development

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn

### Installation

```
npm install
```

### Local Development

```
npm start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### Build

```
npm run build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

### Deployment

The site is automatically deployed to GitHub Pages using GitHub's built-in Pages integration with GitHub Actions whenever changes are pushed to the main branch.

The workflow performs the following steps:
1. Builds the Docusaurus site
2. Uploads the build artifacts
3. Deploys to GitHub Pages using the official GitHub Pages action

You can also trigger the deployment manually from the Actions tab in the GitHub repository.

#### Manual Deployment (Alternative)

If you prefer to deploy manually without GitHub Actions, you can use Docusaurus's built-in deployment command:

```
GIT_USER=<Your GitHub username> npm run deploy
```

This command builds the website and pushes to the `gh-pages` branch.

## Contributing

We welcome contributions! To contribute:

1. Fork the repository
2. Create a new branch for your changes
3. Make your changes
4. Submit a pull request

Please make sure your documentation is clear, accurate, and follows the existing structure.

## License

This project is licensed under the AGPLv3 license, the same as OpenCloud.