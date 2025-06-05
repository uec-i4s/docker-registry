# Let's Encrypt SSL証明書の設定

このドキュメントでは、Docker Registry UIにLet's Encryptの無料SSL証明書を設定する方法を説明します。

## 前提条件

1. ドメイン名を取得し、DNSでサーバーのIPアドレスに向けていること
2. ポート80と443がインターネットからアクセス可能であること
3. Docker と Docker Compose がインストールされていること

## 設定手順

### 1. 設定ファイルの編集

#### init-letsencrypt.sh の編集

```bash
# ドメイン名を設定
domains=(your-domain.com)

# メールアドレスを設定（Let's Encryptからの通知用）
email="your-email@example.com"

# テスト環境の場合は1に設定（本番環境では0のまま）
staging=0
```

#### nginx.conf の編集

`nginx/nginx.conf` の以下の行を実際のドメイン名に変更：

```nginx
ssl_certificate     /etc/letsencrypt/live/your-domain.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
```

#### docker-compose.yml の編集

`docker-compose.yml` の以下の行を実際のドメイン名に変更：

```yaml
volumes:
  - ./certbot/conf/live/your-domain.com:/certs:ro
```

### 2. 証明書の初回取得

```bash
# 初回セットアップスクリプトを実行
./init-letsencrypt.sh
```

このスクリプトは以下の処理を行います：

1. 必要なTLSパラメータファイルをダウンロード
2. 一時的なダミー証明書を作成
3. nginxコンテナを起動
4. ダミー証明書を削除
5. Let's Encryptから実際の証明書を取得
6. nginxを再読み込み
7. registryサービスを再起動（SSL証明書を適用）

## アクセス方法

証明書設定完了後、以下の方法でRegistryにアクセスできます：

### Web UI（推奨）
```
https://your-domain.com/
```

### Docker Registry API

#### nginxプロキシ経由（推奨）
```bash
# イメージのpull
docker pull your-domain.com/image:tag

# イメージのpush
docker tag local-image:tag your-domain.com/image:tag
docker push your-domain.com/image:tag
```

#### Registry直接アクセス
```bash
# HTTPS（ポート5443）
docker pull your-domain.com:5443/image:tag

# HTTP（ポート5000、内部通信用）
docker pull your-domain.com:5000/image:tag
```

### 3. 自動更新の確認

証明書は12時間ごとに自動更新をチェックします。手動で更新する場合：

```bash
# 証明書の手動更新
docker compose exec certbot certbot renew
# または
docker-compose exec certbot certbot renew

# nginxの再読み込み
docker compose exec nginx nginx -s reload
# または
docker-compose exec nginx nginx -s reload
```

**注意**: 環境によって`docker compose`（スペース区切り）または`docker-compose`（ハイフン区切り）を使用してください。

## トラブルシューティング

### よくある問題

1. **ドメインの検証に失敗する**
   - DNSの設定を確認
   - ポート80がファイアウォールで開放されているか確認

2. **証明書の取得に失敗する**
   - `staging=1` に設定してテスト環境で試す
   - Let's Encryptのレート制限に引っかかっていないか確認

3. **nginxが起動しない**
   - 証明書ファイルのパスが正しいか確認
   - nginx設定ファイルの構文エラーをチェック

### ログの確認

```bash
# nginxのログ
docker compose logs nginx
# または
docker-compose logs nginx

# certbotのログ
docker compose logs certbot
# または
docker-compose logs certbot
```

## セキュリティ設定

現在の設定には以下のセキュリティ機能が含まれています：

- HTTP/2対応
- 強力なSSL暗号化設定
- HTTPからHTTPSへの自動リダイレクト
- Let's Encrypt推奨のSSL設定

## 証明書の有効期限

Let's Encryptの証明書は90日間有効です。自動更新が設定されているため、通常は手動での更新は不要です。

証明書の有効期限を確認：

```bash
# 証明書の詳細情報を表示
docker compose exec certbot certbot certificates
# または
docker-compose exec certbot certbot certificates
```