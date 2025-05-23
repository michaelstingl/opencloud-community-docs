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

> **Note for Rancher Desktop Users**: Rancher Desktop comes with Traefik pre-installed. However, the default installation may not have Gateway API support enabled. Before installing a new Gateway controller, check if the existing Traefik installation can be used by following the steps in Option B.

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

First, check if your Rancher Desktop already has Traefik installed with Gateway API support:

```bash
# Check if Traefik is already installed
kubectl get deploy -n kube-system traefik

# Check if Gateway API is enabled in the existing Traefik
kubectl -n kube-system get deploy traefik -o yaml | grep -i gateway
```

**Expected output if Gateway API is enabled:**
You should see a line containing either `--experimental.kubernetesgateway` (older Traefik versions) or `--providers.kubernetesgateway` (newer Traefik versions) in the args section. For example:
```
args:
- --experimental.kubernetesgateway
```

**If no output appears:**
This means Gateway API support is not enabled in the current Traefik installation.

If Traefik is installed but doesn't have Gateway API support, you can either:

1. **Use the existing Traefik installation**: Update the existing Traefik deployment to enable Gateway API
   ```bash
   # For older Traefik versions (v2.5 and below)
   kubectl -n kube-system patch deploy traefik --type=json -p='[{"op":"add", "path":"/spec/template/spec/containers/0/args/-", "value":"--experimental.kubernetesgateway"}]'
   
   # OR for newer Traefik versions (v2.6+)
   kubectl -n kube-system patch deploy traefik --type=json -p='[{"op":"add", "path":"/spec/template/spec/containers/0/args/-", "value":"--providers.kubernetesgateway"}]'
   ```

2. **Install a new Traefik instance**: If the patch doesn't work or you prefer a fresh installation
   ```bash
   # Remove existing Traefik (optional - be careful in shared clusters)
   # kubectl -n kube-system delete deploy traefik
   
   # Add Traefik Helm repository
   helm repo add traefik https://traefik.github.io/charts
   helm repo update
   
   # Install Traefik with Gateway API support (choose the right command based on your Traefik version)
   
   # For newer Traefik versions (v2.6+)
   helm install traefik traefik/traefik \
     --namespace kube-system \
     --set providers.kubernetesGateway.enabled=true \
     --set ports.websecure.tls.enabled=true
   
   # OR for older Traefik versions (v2.5 and below)
   helm install traefik traefik/traefik \
     --namespace kube-system \
     --set experimental.kubernetesGateway.enabled=true \
     --set ports.websecure.tls.enabled=true
   ```

After ensuring Traefik is installed with Gateway API support, create the GatewayClass:

```bash
# Create GatewayClass for Traefik
cat <<EOF | kubectl apply -f -
apiVersion: gateway.networking.k8s.io/v1beta1
kind: GatewayClass
metadata:
  name: traefik
spec:
  controllerName: traefik.io/gateway-controller
EOF

# Verify the GatewayClass was created
kubectl get gatewayclass
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

## 6. Getting the OpenCloud Helm Charts

Before installing, clone the OpenCloud Helm charts repository:

```bash
# Clone the OpenCloud Helm repository
git clone https://github.com/opencloud-eu/helm.git opencloud-helm
cd opencloud-helm
```

## 7. Installing OpenCloud Production Chart

Now you can install the OpenCloud production chart. Choose the appropriate installation command based on your Gateway API controller:

### Option A: Using Cilium Gateway Controller

```bash
# Create namespace
kubectl create namespace opencloud

# Install the production chart with Cilium settings
helm install opencloud -n opencloud ./charts/opencloud \
  --set httpRoute.gateway.name=opencloud-gateway \
  --set httpRoute.gateway.namespace=kube-system \
  --set httpRoute.gateway.className=cilium \
  --set httpRoute.gateway.create=true \
  --set global.tls.enabled=true \
  --set global.tls.selfSigned=true
```

### Option B: Using Traefik Gateway Controller

```bash
# Create namespace
kubectl create namespace opencloud

# Install the production chart with Traefik settings
helm install opencloud -n opencloud ./charts/opencloud \
  --set httpRoute.gateway.name=opencloud-gateway \
  --set httpRoute.gateway.namespace=kube-system \
  --set httpRoute.gateway.className=traefik \
  --set httpRoute.gateway.create=true \
  --set global.tls.enabled=true \
  --set global.tls.selfSigned=true
```

> **Important**: Note that we're setting `httpRoute.gateway.create=true` to ensure the Gateway is correctly configured for the HTTPRoutes. If you already have a Gateway that you want to use, make sure its listener names match the expected names in the HTTPRoutes (opencloud-https, keycloak-https, etc.).
>
> **Troubleshooting Gateway Issues**:
> 
> If you encounter 404 errors or connectivity issues:
>
> 1. Check that both the Gateway and HTTPRoutes are correctly configured:
>    ```bash
>    kubectl get gateway -n kube-system
>    kubectl get httproute -n opencloud
>    ```
>
> 2. If necessary, uninstall and reinstall with the correct parameters:
>    ```bash
>    # Clean up completely
>    helm uninstall opencloud -n opencloud
>    kubectl delete namespace opencloud
>    
>    # Then reinstall using one of the commands above
>    ```
>
> **Advanced Configuration Options**:
> 
> The chart supports several advanced configuration options introduced in recent updates:
> 
> - Setting environment variables: `--set opencloud.env[0].name=MY_VAR,opencloud.env[0].value=myvalue`
> - Enabling proxy basic auth: `--set opencloud.proxy.basicAuth.enabled=true`
> - Improved namespace handling: The chart now automatically uses Helm's release namespace for all resources without requiring explicit namespace configuration

## 8. Port Forwarding

You need to set up port forwarding from your localhost to the Gateway. Since port 443 is a privileged port on macOS, we'll use a higher port (like 8443) for local forwarding:

### For Cilium:

```bash
kubectl -n kube-system port-forward deploy/cilium-gateway-opencloud-gateway 8443:443
```

### For Traefik:

```bash
kubectl -n kube-system port-forward deploy/traefik 8443:8443
```

Keep this terminal window open while you're testing.

> **Note**: We're using port 8443 instead of 443 because ports below 1024 require root privileges on macOS/Linux systems. You'll access OpenCloud at https://cloud.opencloud.test:8443 in this setup.
>
> If you need to use the standard port 443, you can update your local DNS settings or use a reverse proxy.

## 9. Accessing OpenCloud

Open your browser and navigate to:
- https://cloud.opencloud.test:8443

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

## Summary for Rancher Desktop Users

If you're using Rancher Desktop, here's a quick summary of the installation process:

1. **Gateway API is already installed** with Rancher Desktop (k3s), you don't need to install the CRDs
2. **Traefik is pre-installed** but may need Gateway API support enabled:
   - Check if Gateway API is enabled: `kubectl -n kube-system get deploy traefik -o yaml | grep -i gateway`
   - If the command returns nothing, it means Gateway API is not enabled
   - If enabled, you'll see `--experimental.kubernetesgateway` or `--providers.kubernetesgateway` in the output
   - If not enabled, apply the appropriate patch for your Traefik version or reinstall Traefik as shown in section 3
3. **Create the GatewayClass** for Traefik: This is required and not automatically created
4. **Follow all other steps as written** (cert-manager, Gateway, OpenCloud installation)

For most Rancher Desktop users, using the pre-installed Traefik with Gateway API enabled will be the simplest approach.

> **Note**: The configuration commands may vary depending on your Traefik version. Newer versions (v2.6+) use `--providers.kubernetesgateway` while older versions use `--experimental.kubernetesgateway`. Check your Traefik version with `kubectl -n kube-system get deploy traefik -o yaml | grep image` if you're unsure.