#!/bin/bash

# ドメイン設定ヘルパースクリプト

echo "### Docker Registry Let's Encrypt Domain Configuration ###"
echo

# 現在の設定を確認
current_domain=$(grep -o 'domains=([^)]*)' init-letsencrypt.sh | sed 's/domains=(\([^)]*\))/\1/')
echo "Current domain in init-letsencrypt.sh: $current_domain"

# 新しいドメイン名の入力
read -p "Enter your domain name (e.g., registry.example.com): " new_domain

if [ -z "$new_domain" ]; then
    echo "Error: Domain name cannot be empty"
    exit 1
fi

echo "Configuring domain: $new_domain"
echo

# init-letsencrypt.sh の更新
echo "### Updating init-letsencrypt.sh..."
sed -i.bak "s/domains=(your-domain.com)/domains=($new_domain)/" init-letsencrypt.sh
echo "✓ Updated init-letsencrypt.sh"

# nginx.conf の更新
echo "### Updating nginx/nginx.conf..."
sed -i.bak "s|/etc/letsencrypt/live/your-domain.com/|/etc/letsencrypt/live/$new_domain/|g" nginx/nginx.conf
echo "✓ Updated nginx/nginx.conf"

# docker-compose.yml の更新
echo "### Updating docker-compose.yml..."
sed -i.bak "s|./certbot/conf/live/your-domain.com:|./certbot/conf/live/$new_domain:|" docker-compose.yml
echo "✓ Updated docker-compose.yml"

echo
echo "### Configuration completed! ###"
echo "Domain: $new_domain"
echo
echo "Next steps:"
echo "1. Ensure DNS points $new_domain to this server's IP"
echo "2. Ensure ports 80 and 443 are open"
echo "3. Run: ./init-letsencrypt.sh"
echo
echo "To verify DNS: nslookup $new_domain"
echo "To test webroot: curl http://$new_domain/.well-known/acme-challenge/test"