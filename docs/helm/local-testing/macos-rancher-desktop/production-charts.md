---
sidebar_position: 2
title: Using Production Charts with Rancher Desktop
description: Set up a local environment for testing OpenCloud production Helm charts on macOS with Rancher Desktop
slug: /helm/local-testing/macos-rancher-desktop/production
---

# Testing OpenCloud Production Helm Charts on macOS

This guide provides instructions for setting up a local environment for OpenCloud production Helm charts on macOS using Rancher Desktop.

## Prerequisites

- macOS with [Homebrew](https://brew.sh/) installed
- [Rancher Desktop](https://rancherdesktop.io/) installed
- [Helm](https://helm.sh/) installed (`brew install helm`)
- [kubectl](https://kubernetes.io/docs/tasks/tools/) installed (`brew install kubectl`)
- Basic familiarity with Kubernetes concepts

## 1. Setting Up Rancher Desktop

1. Launch Rancher Desktop
2. Go to Preferences:
   - Select Kubernetes as the container runtime
   - Enable Kubernetes (version 1.19+ recommended)
   - Allocate sufficient resources (recommended: 4GB RAM, 2 CPUs)
   - Wait for Kubernetes to start completely

## 2. Configuring DNS with dnsmasq

Using dnsmasq provides a clean way to route all `.opencloud.test` domains to your local machine:

```bash
# Install dnsmasq
brew install dnsmasq

# Configure dnsmasq to route .opencloud.test to localhost
echo 'address=/.opencloud.test/127.0.0.1' | sudo tee -a /opt/homebrew/etc/dnsmasq.conf

# Start dnsmasq service
sudo brew services start dnsmasq

# Configure macOS resolver
sudo mkdir -p /etc/resolver
echo "nameserver 127.0.0.1" | sudo tee /etc/resolver/opencloud.test
```

You can verify that the DNS resolution works with:

```bash
ping cloud.opencloud.test
# Should resolve to 127.0.0.1
```

## 3. Setting Up a Gateway API Controller

You can choose between different Gateway API controllers. Here are installation instructions for the two most popular options:

### Option A: Cilium (Full-featured, Production-grade)

```bash
# Add Cilium Helm repository
helm repo add cilium https://helm.cilium.io
helm repo update

# Install Cilium with Gateway API support
helm install cilium cilium/cilium \
  --namespace kube-system \
  --set gatewayAPI.enabled=true \
  --set k8sServiceHost=host.docker.internal \
  --set k8sServicePort=6443
```

### Option B: Traefik (Lightweight, Developer-friendly)

```bash
# Add Traefik Helm repository
helm repo add traefik https://traefik.github.io/charts
helm repo update

# Install Traefik with Gateway API support
helm install traefik traefik/traefik \
  --namespace kube-system \
  --set experimental.kubernetesGateway.enabled=true \
  --set ports.websecure.tls.enabled=true

# Create GatewayClass for Traefik
cat <<EOF | kubectl apply -f -
apiVersion: gateway.networking.k8s.io/v1beta1
kind: GatewayClass
metadata:
  name: traefik
spec:
  controllerName: traefik.io/gateway-controller
EOF
```

## 4. Setting Up TLS with cert-manager

Install cert-manager and create a self-signed certificate for your development domains:

```bash
# Add jetstack Helm repository
helm repo add jetstack https://charts.jetstack.io
helm repo update

# Install cert-manager
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --set crds.enabled=true

# Wait for cert-manager to be ready
kubectl -n cert-manager wait --for=condition=Ready pods --all --timeout=60s

# Create a self-signed issuer and wildcard certificate
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: selfsigned-issuer
spec:
  selfSigned: {}
---
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: opencloud-wildcard-tls
  namespace: kube-system
spec:
  secretName: opencloud-wildcard-tls
  dnsNames:
    - "opencloud.test"
    - "*.opencloud.test"
  issuerRef:
    name: selfsigned-issuer
    kind: ClusterIssuer
EOF
```

## 5. Creating a Gateway

Create a Gateway resource for your chosen controller:

### For Cilium:

```bash
cat <<EOF | kubectl apply -f -
apiVersion: gateway.networking.k8s.io/v1beta1
kind: Gateway
metadata:
  name: opencloud-gateway
  namespace: kube-system
spec:
  gatewayClassName: cilium
  listeners:
    - name: https
      protocol: HTTPS
      port: 443
      hostname: "*.opencloud.test"
      tls:
        mode: Terminate
        certificateRefs:
          - name: opencloud-wildcard-tls
EOF
```

### For Traefik:

```bash
cat <<EOF | kubectl apply -f -
apiVersion: gateway.networking.k8s.io/v1beta1
kind: Gateway
metadata:
  name: opencloud-gateway
  namespace: kube-system
spec:
  gatewayClassName: traefik
  listeners:
    - name: https
      protocol: HTTPS
      port: 443
      hostname: "*.opencloud.test"
      tls:
        mode: Terminate
        certificateRefs:
          - name: opencloud-wildcard-tls
EOF
```

## 6. Installing OpenCloud Production Chart

Now you can install the OpenCloud production chart:

```bash
# Create namespace
kubectl create namespace opencloud

# Install the production chart
helm install opencloud -n opencloud ./charts/opencloud \
  --set httpRoute.gateway.name=opencloud-gateway \
  --set httpRoute.gateway.namespace=kube-system \
  --set httpRoute.gateway.className=cilium \
  --set global.tls.enabled=true \
  --set global.tls.selfSigned=true
```

> **Note**: If you're using Traefik instead of Cilium, change the className parameter:
> `--set httpRoute.gateway.className=traefik`

## 7. Port Forwarding

You need to set up port forwarding from your localhost to the Gateway:

### For Cilium:

```bash
kubectl -n kube-system port-forward deploy/cilium-gateway-opencloud-gateway 443:443
```

### For Traefik:

```bash
kubectl -n kube-system port-forward deploy/traefik 443:443
```

Keep this terminal window open while you're testing.

## 8. Accessing OpenCloud

Open your browser and navigate to:
- https://cloud.opencloud.test

**Default credentials:**
- Username: admin
- Password: admin

Since we're using self-signed certificates, you'll need to accept the security warning in your browser.

## Troubleshooting

### DNS Issues

If DNS resolution is not working:
```bash
# Check if dnsmasq is running
sudo brew services list | grep dnsmasq

# Verify resolver configuration
cat /etc/resolver/opencloud.test

# Test DNS resolution
dig cloud.opencloud.test @127.0.0.1
```

### Certificate Issues

If you're having TLS certificate issues:
```bash
# Check certificate status
kubectl get certificates -n kube-system
kubectl get certificaterequests -n kube-system

# Check cert-manager logs
kubectl logs -n cert-manager -l app=cert-manager
```

### Gateway Issues

If the Gateway is not working:
```bash
# Check Gateway status
kubectl get gateway -n kube-system
kubectl describe gateway opencloud-gateway -n kube-system

# Check HTTPRoute status
kubectl get httproute -n opencloud
kubectl describe httproute -n opencloud
```

### Pod Issues

If OpenCloud pods are not starting:
```bash
# Check pod status
kubectl get pods -n opencloud
kubectl describe pod -n opencloud -l app.kubernetes.io/name=opencloud

# Check logs
kubectl logs -n opencloud -l app.kubernetes.io/name=opencloud
```

## Cleaning Up

To uninstall everything when you're done:

```bash
# Uninstall OpenCloud
helm uninstall -n opencloud opencloud

# Uninstall Gateway Controller (depending on which one you installed)
helm uninstall -n kube-system cilium
# OR
helm uninstall -n kube-system traefik

# Uninstall cert-manager
helm uninstall -n cert-manager cert-manager

# Delete namespaces
kubectl delete namespace opencloud
kubectl delete namespace cert-manager

# Stop dnsmasq
sudo brew services stop dnsmasq
```

## Controller Comparison

| Feature | Cilium | Traefik |
|---------|--------|---------|
| Resource Usage | Higher | Lower |
| UI Dashboard | No (requires Hubble) | Yes (built-in) |
| Security Features | Extensive | Basic |
| Ease of Configuration | More complex | Simpler |
| Performance | Excellent | Good |
| Best for | Production-like testing | Development/quick testing |