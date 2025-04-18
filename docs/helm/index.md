---
sidebar_position: 1
description: Community documentation for Helm charts and deployment options for OpenCloud
---

# Deploying OpenCloud with Helm

This section contains community-contributed documentation related to deploying OpenCloud using Helm charts.

:::info Community Contributions
These guides are created by community members based on their experiences. While we strive for accuracy, these are not official guides and may need to be adapted to your specific environment.
:::

Helm charts provide a way to package, configure, and deploy applications on Kubernetes. The OpenCloud community maintains several Helm charts for different deployment scenarios, which can be found in the [opencloud-eu/helm](https://github.com/opencloud-eu/helm) repository.

## Available Guides

### Local Testing

- [Testing on macOS with Rancher Desktop](./local-testing/rancher-desktop-macos.md) - A comprehensive guide for setting up OpenCloud Helm charts on macOS using Rancher Desktop.

## Chart Versions

The following charts are available:

### Production Chart

The `/charts/opencloud` chart is intended for production deployments and provides a complete OpenCloud stack with all components:

- OpenCloud Core
- Keycloak for authentication
- PostgreSQL database
- MinIO object storage
- Document collaboration options (OnlyOffice, Collabora)

### Development Chart

The `/charts/opencloud-dev` chart is a simplified version intended for development and testing. It deploys a single container with the OpenCloud application.

## Repository

The Helm charts are maintained in the [opencloud-eu/helm](https://github.com/opencloud-eu/helm) repository.

## Contributing

If you'd like to contribute to the Helm charts, please see the [contribution guidelines](https://github.com/opencloud-eu/helm/blob/main/CONTRIBUTING.md) in the repository.