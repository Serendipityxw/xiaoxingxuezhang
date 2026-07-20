# Deployment

This project is a static Vite app.

## Build

```bash
npm.cmd install
npm.cmd run build
```

Output folder: `dist/`

## VPS / Linux server with Nginx

1. Build and zip the site locally:

```bash
npm.cmd run pack:web
```

2. Upload `xiaocampus-web.zip` to the server:

```bash
scp xiaocampus-web.zip root@YOUR_SERVER_IP:/tmp/
```

3. Install Nginx and deploy the files:

```bash
sudo apt update
sudo apt install -y nginx unzip
sudo mkdir -p /var/www/xiaocampus
sudo unzip -o /tmp/xiaocampus-web.zip -d /var/www/xiaocampus
sudo chown -R www-data:www-data /var/www/xiaocampus
```

4. Copy `nginx-xiaocampus.conf` to Nginx:

```bash
sudo cp nginx-xiaocampus.conf /etc/nginx/sites-available/xiaocampus
sudo ln -sf /etc/nginx/sites-available/xiaocampus /etc/nginx/sites-enabled/xiaocampus
sudo nginx -t
sudo systemctl reload nginx
```

5. Open:

```text
http://YOUR_SERVER_IP/
```

If you have a domain, point an A record to the server IP, then replace
`server_name _;` in `nginx-xiaocampus.conf` with your domain.

## Cloudflare Pages

1. Build the project
2. Open Cloudflare Pages
3. Create a new Pages project
4. Deploy the `dist/` folder

## GitHub Pages

This project includes a GitHub Actions workflow at
`.github/workflows/deploy-github-pages.yml`.

1. Push the repository to GitHub.
2. In the GitHub repository, open `Settings` > `Pages`.
3. Set `Build and deployment` source to `GitHub Actions`.
4. Push to the `main` branch, or run the workflow manually from `Actions`.

The app uses relative asset paths, so it can run under a GitHub Pages project
URL such as `https://YOUR_USER.github.io/YOUR_REPO/`.

## Settings

- Build command: `npm run build`
- Build output directory: `dist`

## Command deploy

```bash
npm.cmd run deploy:cloudflare
```

## 522 host error

If Cloudflare shows `522`, the source server is unreachable or timing out.
For this app, prefer Pages direct deployment instead of proxying Cloudflare to a VPS origin.

For local testing, run `open-built.cmd`. Do not open `dist/index.html` directly
with `file://`.
