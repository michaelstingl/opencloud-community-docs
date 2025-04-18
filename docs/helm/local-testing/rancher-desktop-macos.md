---
sidebar_position: 1
title: Overview
description: Overview of options for testing OpenCloud Helm charts on macOS
---

# Testing OpenCloud Helm Charts on macOS

We've prepared comprehensive guides for testing OpenCloud Helm charts on macOS using Rancher Desktop. These guides cover both development and production chart setups.

## Available Guides

### [Development Chart Guide](./macos-rancher-desktop/index.md)
This guide shows you how to set up a local Kubernetes environment on macOS using Rancher Desktop for developing and testing the OpenCloud DEV Helm chart. The DEV chart is simpler and deploys a single container with all OpenCloud services.

### [Production Chart Guide](./macos-rancher-desktop/production.md)
This guide provides instructions for setting up a more complex environment for testing the production chart, which includes Gateway API controllers, DNS configuration, and TLS setup.

## Comparison of Charts

| Feature | Development Chart | Production Chart |
|---------|-------------------|-----------------|
| Deployment Model | Single container | Microservices |
| Resource Usage | Lower | Higher |
| Configuration Options | Limited | Extensive |
| Production Similarity | Low | High |
| Startup Time | Fast | Slower |
| Best for | Quick testing | Production-like testing |

Choose the appropriate guide based on your testing needs.