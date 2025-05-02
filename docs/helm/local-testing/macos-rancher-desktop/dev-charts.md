---
sidebar_position: 1
title: Using Dev Charts with Rancher Desktop
description: Set up a local development environment for OpenCloud DEV Helm charts on macOS using Rancher Desktop
slug: /helm/local-testing/macos-rancher-desktop
---

# Using OpenCloud DEV Helm Charts with Rancher Desktop on macOS

This guide shows you how to set up a local Kubernetes environment on macOS using Rancher Desktop for developing and testing the OpenCloud DEV Helm chart.

## Prerequisites

1. A macOS system (tested on macOS Sequoia 15.4)
2. Homebrew package manager
3. Helm (installed via Homebrew)

```bash
# Install Helm using Homebrew
brew install helm
```

4. kubectl command-line tool

```bash
# Install kubectl using Homebrew
brew install kubectl
```

## Setting Up Rancher Desktop

```bash
# Install Rancher Desktop using Homebrew
brew install --cask rancher
```

1. Launch Rancher Desktop
2. In Preferences:
   - Choose Kubernetes version (tested with 1.32.3)
   - Set Container Engine to "moby" (Docker API compatible)
   - Enable Kubernetes
   - Allow Kubernetes to start completely

## Getting the OpenCloud Helm Charts

First, clone the OpenCloud Helm charts repository:

```bash
# Clone the OpenCloud Helm repository
git clone https://github.com/opencloud-eu/helm.git opencloud-helm
cd opencloud-helm
```

## Installing OpenCloud DEV Chart

```bash
# Create namespace for OpenCloud
kubectl create namespace opencloud

# Install the OpenCloud DEV chart
helm install opencloud -n opencloud ./charts/opencloud-dev

# Watch the pod status until it's ready
kubectl get pods -n opencloud -w
```

## Accessing OpenCloud

Set up port forwarding to access the OpenCloud instance:

```bash
kubectl port-forward -n opencloud svc/opencloud-service 9200:443
```

Now access OpenCloud at [https://localhost:9200](https://localhost:9200) in your browser.
You'll need to accept the security risk from the self-signed certificate.

> **Note**: We're using port 9200 here to avoid conflicts with the privileged port 443, which would require root privileges on macOS/Linux systems.

Login with:
- Username: `admin`
- Password: `admin`

## Monitoring and Debugging

```bash
# View logs from the OpenCloud pod
kubectl logs -n opencloud -l app=opencloud -f

# See the pod details
kubectl describe pod -n opencloud -l app=opencloud

# Access Kubernetes dashboard through Rancher Desktop UI
# (Click Dashboard button in Rancher Desktop)
```

## Clean Up

```bash
# Uninstall OpenCloud
helm uninstall -n opencloud opencloud

# Delete namespace (optional - PVCs with keep policy will survive)
kubectl delete namespace opencloud
```

## Tested Configuration

This guide has been tested with:
- macOS Sequoia 15.4
- Rancher Desktop 1.18.2
- Kubernetes 1.32.3
- Container Engine: moby
- OpenCloud DEV chart version 0.1.0
- OpenCloud version 2.0.0

## Troubleshooting

- **TLS/Certificate Issues**: The self-signed certificates will show warnings in browsers. This is expected in development environments.
- **Port Conflicts**: If port 9200 is already in use, change the port-forward command to use a different local port.
- **Performance**: For better performance, consider adjusting the resources allocated to Rancher Desktop in its preferences.
- **Dashboard Access**: Rancher Desktop provides a built-in Kubernetes dashboard for easier debugging.
- **Log Collection**: If you encounter issues, collect logs with `kubectl logs -n opencloud -l app=opencloud > opencloud.log`

## Next Steps

Now that you have successfully set up OpenCloud DEV charts with Rancher Desktop, you can:

1. Explore the OpenCloud web interface at https://localhost:9200
2. Learn more about [OpenCloud features](https://docs.opencloud.eu/)
3. Read about [Helm chart customization options](../../)

For a comparison of Rancher Desktop with other Kubernetes options for macOS, see our [Kubernetes Options Comparison](./kubernetes-options.md) guide.