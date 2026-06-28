# EasyCom Web VPS Deploy

Target:

```text
Domain: easycom.vjmrtim.my.id
Internal app port: 3010
Runtime: Node.js + PM2
Reverse proxy: Nginx or Cloudflare Tunnel
HTTPS: Nginx, Certbot, or Cloudflare
Database: SQLite local server file
```

## Install Runtime

```bash
sudo apt update
sudo apt install -y nginx git curl
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

## App Setup

```bash
cd /var/www
git clone <your-repo-url> connect-colorize
cd /var/www/connect-colorize
cp .env.example .env
npm install
npm run build
pm2 start ecosystem.config.cjs
pm2 save
```

Minimum `.env`:

```env
NODE_ENV=production
PORT=3010
APP_URL=https://easycom.vjmrtim.my.id
DATABASE_PATH=./data/easycom.sqlite
PLATFORM_ADMIN_KEY=change-this-admin-key
LYNK_ID_CHECKOUT_URL=https://lynk.id/ISI-LINK-KAMU
ADMIN_WHATSAPP=0895345902896
ENABLE_STUN=false
STUN_URLS=
ENABLE_TURN=false
TURN_URL=
TURN_USERNAME=
TURN_PASSWORD=
PREFER_HOST_CANDIDATES=true
FREE_TRIAL_DAYS=7
TRIAL_MAX_USERS=2
WEB_LICENSE_MAX_USERS=50
RECOMMENDED_ACTIVE_USERS=12
PAID_MAX_ACTIVE_ROOMS=999
```

## Nginx Reverse Proxy

```nginx
server {
    server_name easycom.vjmrtim.my.id;

    location / {
        proxy_pass http://127.0.0.1:3010;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Cloudflared Ingress Example

```yaml
- hostname: easycom.vjmrtim.my.id
  service: http://localhost:3010
```

## Notes

Socket.IO/WebSocket must pass through HTTPS with the `Upgrade` and `Connection` headers above.

For MVP, EasyCom does not use TURN relay by default. Server provides website, login, license, room, QR join, and WebRTC signaling only. Audio is not stored or recorded.
