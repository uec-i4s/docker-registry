# Docker Registry with HTTPS Web UI

HTTPS対応のDocker Registryとウェブ管理UIを提供するシステムです。

## 概要

このプロジェクトは以下のコンポーネントで構成されています：

- **Docker Registry**: イメージの保存・配信
- **Web UI**: React製の管理インターフェース
- **Nginx**: HTTPS リバースプロキシ

## アーキテクチャ

```
[Client] --HTTPS--> [Nginx:443] --HTTP--> [Registry:5000]
                         |
                         +--HTTP--> [UI:3000]
```

## 機能

- ✅ HTTPS対応のDocker Registry
- ✅ ウェブベースの管理UI
- ✅ イメージのpush/pull操作
- ✅ タグ管理と削除機能
- ✅ レポジトリ一覧表示
- ✅ Docker コマンドのコピー機能

## セットアップ

### 1. サーバー側設定（Registry ホスト）

```bash
# リポジトリをクローン
git clone <repository-url>
cd docker-registry

# SSL証明書を生成（IPアドレスを適切に変更）
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/certs/domain.key \
  -out nginx/certs/domain.crt \
  -subj "/CN=192.168.7.46" \
  -addext "subjectAltName=IP:192.168.7.46"

# サービスを起動
docker compose up -d --build
```

### 2. クライアント側設定（各Dockerクライアント）

各クライアントマシンで以下を実行：

```bash
# insecure registryとして設定
sudo tee /etc/docker/daemon.json << 'EOF'
{
  "insecure-registries": ["192.168.7.46:5000", "192.168.7.46:443", "192.168.7.46"]
}
EOF

# Dockerサービス再起動
sudo systemctl restart docker
```

## 使用方法

### Web UI アクセス

```bash
# ブラウザで以下にアクセス
https://192.168.7.46/
```

### Docker コマンド

```bash
# イメージをpull
docker pull 192.168.7.46/python:3.12-slim

# イメージをpush
docker tag python:3.12-slim 192.168.7.46/python:3.12-slim
docker push 192.168.7.46/python:3.12-slim

# HTTPポートでのアクセス（オプション）
docker pull 192.168.7.46:5000/python:3.12-slim
```

## ファイル構成

```
docker-registry/
├── docker-compose.yml          # サービス定義
├── nginx/
│   ├── Dockerfile             # Nginx コンテナ
│   ├── nginx.conf             # Nginx 設定
│   └── certs/                 # SSL証明書
│       ├── domain.crt
│       └── domain.key
├── ui/
│   ├── Dockerfile             # UI コンテナ
│   ├── server.js              # Express サーバー
│   ├── main.jsx               # React アプリ
│   ├── index.html             # HTML テンプレート
│   └── package.json           # Node.js 依存関係
├── data/                      # Registry データ（自動作成）
└── README.md                  # このファイル
```

## サービス詳細

### Registry (Port 5000)
- **イメージ**: `registry:latest`
- **機能**: Docker イメージの保存・配信
- **API**: Docker Registry HTTP API V2

### UI (Port 3000)
- **技術**: React + Vite + Express
- **機能**: ウェブ管理インターフェース
- **API**: Registry管理用REST API

### Nginx (Port 443)
- **機能**: HTTPS リバースプロキシ
- **ルーティング**:
  - `/v2/` → Registry API
  - `/api/` → UI API
  - `/` → UI Frontend

## トラブルシューティング

### SSL証明書エラー

```bash
# 証明書を再生成（IPアドレスを変更）
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/certs/domain.key \
  -out nginx/certs/domain.crt \
  -subj "/CN=YOUR_IP" \
  -addext "subjectAltName=IP:YOUR_IP"

# サービス再起動
docker compose up -d --build
```

### insecure registry エラー

```bash
# daemon.json を確認
cat /etc/docker/daemon.json

# Dockerサービス再起動
sudo systemctl restart docker
```

### サービス状態確認

```bash
# コンテナ状態確認
docker compose ps

# ログ確認
docker compose logs nginx
docker compose logs ui
docker compose logs registry
```

## セキュリティ注意事項

- 自己署名証明書を使用しているため、本番環境では適切なCA署名証明書を使用してください
- insecure registryの設定は、信頼できるネットワーク内でのみ使用してください
- 必要に応じて認証機能を追加してください

## 開発・カスタマイズ

### UI の開発

```bash
cd ui
npm install
npm run dev  # 開発サーバー起動
```

### 設定変更

- **IPアドレス変更**: SSL証明書の再生成とdaemon.jsonの更新が必要
- **ポート変更**: docker-compose.yml と nginx.conf を更新
- **認証追加**: Registry設定とUI認証ロジックを追加

## ライセンス

MIT License