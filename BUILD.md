# Building and Deploying the Healthcheck Service

## Building the Docker Image

```bash
# From the frontend directory
docker build -f Dockerfile.healthcheck -t akash-vpn-healthcheck:latest .

# Tag for your registry
docker tag akash-vpn-healthcheck:latest your-docker-registry/akash-vpn-healthcheck:latest

# Push to registry
docker push your-docker-registry/akash-vpn-healthcheck:latest

## Local Testing
# Run locally with Docker
docker run -p 3000:3000 akash-vpn-healthcheck:latest

# Test the endpoint
curl http://localhost:3000/health
## Deploying to Akash
Update the image reference in vpn/deploy.yml with your registry URL
Deploy using Akash CLI:
akash tx deployment create deploy.yml --from your-wallet --chain-id akashnet-2
Network Configuration
The healthcheck service:

Connects to softether:5555 and v2ray:1080 via internal service networking
Exposes port 3000 internally, mapped to port 80 globally
Returns HTTP 200 when all VPN services are healthy
Returns HTTP 503 when any VPN service is down

## Key Features of This Setup:

✅ **Multi-stage build** - Optimized image size by separating build and runtime dependencies  
✅ **Built-in health check** - Docker-native health monitoring  
✅ **Minimal attack surface** - Alpine base image with only production dependencies  
✅ **Proper networking** - Service-to-service communication configured in Akash deployment  
✅ **Global exposure** - Healthcheck endpoint exposed for Updown.io monitoring  
✅ **Resource optimization** - Minimal CPU/memory allocation for the lightweight service  

The healthcheck service will be able to reach `softether` and `v2ray` containers via Akash's internal service networking, and the `/health` endpoint will be publicly accessible for Updown.io monitoring.

<!-- This is an auto-generated reply by CodeRabbit -->