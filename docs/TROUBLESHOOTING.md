# トラブルシューティング

## SSL証明書関連エラー

### エラー: "x509: certificate signed by unknown authority"

**原因**: クライアント側でinsecure registryの設定が不足

**解決方法**:
```bash
# daemon.jsonを設定
sudo tee /etc/docker/daemon.json << 'EOF'
{
  "insecure-registries": ["192.168.7.46:5000", "192.168.7.46:443", "192.168.7.46"]
}
EOF

# Dockerサービス再起動
sudo systemctl restart docker
```

### エラー: "x509: cannot validate certificate for IP because it doesn't contain any IP SANs"

**原因**: SSL証明書にIP SANが含まれていない

**解決方法**:
```bash
# IP SAN付き証明書を再生成
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/certs/domain.key \
  -out nginx/certs/domain.crt \
  -subj "/CN=YOUR_IP" \
  -addext "subjectAltName=IP:YOUR_IP"

# サービス再起動
docker compose up -d --build
```

## Docker Registry API エラー

### エラー: "http: server gave HTTP response to HTTPS client"

**原因**: HTTPポートにHTTPSでアクセスしている

**解決方法**:
- HTTPSポート（443）を使用: `docker pull 192.168.7.46/image:tag`
- HTTPポート（5000）を使用: `docker pull 192.168.7.46:5000/image:tag`

### エラー: "502 Bad Gateway"

**原因**: nginxがバックエンドサービスに接続できない

**確認方法**:
```bash
# サービス状態確認
docker compose ps

# ログ確認
docker compose logs nginx
docker compose logs ui
docker compose logs registry
```

## Web UI アクセス問題

### ページが表示されない

**確認項目**:
1. サービスが起動しているか: `docker compose ps`
2. ポート443が開いているか: `netstat -tlnp | grep 443`
3. ファイアウォール設定: `sudo ufw status`

### API呼び出しエラー

**CORS エラーの場合**:
- Registry設定でCORSヘッダーが正しく設定されているか確認
- ブラウザの開発者ツールでネットワークタブを確認

## 一般的な問題

### コンテナが起動しない

```bash
# 詳細ログ確認
docker compose logs [service-name]

# イメージ再ビルド
docker compose up -d --build --force-recreate
```

### ディスク容量不足

```bash
# Docker システムクリーンアップ
docker system prune -a

# Registry データ確認
du -sh data/
```

### ネットワーク問題

```bash
# ネットワーク確認
docker network ls
docker network inspect docker-registry_registry-net

# ポート確認
ss -tlnp | grep -E '(443|5000|3000)'
```

## ログ確認コマンド

```bash
# 全サービスのログ
docker compose logs

# 特定サービスのログ
docker compose logs nginx
docker compose logs ui
docker compose logs registry

# リアルタイムログ
docker compose logs -f