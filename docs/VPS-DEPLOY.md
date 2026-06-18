# EasyCom Web VPS Deploy

Target:

```text
Domain: connect.colorizevisual.com
Internal app port: 3010
Runtime: Node.js + PM2
Reverse proxy: Nginx
HTTPS: Nginx or Cloudflare
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
cd /opt
sudo git clone <your-repo-url> easycom
sudo chown -R $USER:$USER /opt/easycom
cd /opt/easycom
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
APP_URL=https://connect.colorizevisual.com
DATABASE_PATH=./data/easycom.sqlite
PLATFORM_ADMIN_KEY=change-this-admin-key
ENABLE_STUN=false
ENABLE_TURN=false
FREE_TRIAL_DAYS=7
TRIAL_MAX_USERS=2
WEB_LICENSE_MAX_USERS=50
RECOMMENDED_ACTIVE_USERS=12
```

## Nginx Reverse Proxy

```nginx
server {
    server_name connect.colorizevisual.com;

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

Enable site and reload:

```bash
sudo ln -s /etc/nginx/sites-available/easycom /etc/nginx/sites-enabled/easycom
sudo nginx -t
sudo systemctl reload nginx
```

## HTTPS Notes

Use Cloudflare SSL or Certbot on the VPS. Socket.IO/WebSocket must pass through HTTPS with the `Upgrade` and `Connection` headers above.

For MVP, EasyCom does not use TURN relay. Server provides website, login, room, QR join, and WebRTC signaling only. Audio is designed for peer-to-peer connection when all crew are on the same Wi-Fi/hotspot.
