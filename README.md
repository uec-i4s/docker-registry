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

詳細なセットアップ手順は [`docs/SETUP.md`](docs/SETUP.md) を参照してください。

### Let's Encrypt SSL証明書（推奨）

本番環境では無料のLet's Encrypt証明書を使用することを推奨します。
詳細は [`docs/LETSENCRYPT.md`](docs/LETSENCRYPT.md) を参照してください。

```bash
# 1. 設定ファイルを編集
# init-letsencrypt.sh でドメイン名とメールアドレスを設定
# nginx/nginx.conf でドメイン名を設定

# 2. Let's Encrypt証明書を取得
./init-letsencrypt.sh

# 3. サービス起動（証明書取得後は自動で起動済み）
```

### クイックスタート（自己署名証明書）

開発環境やテスト用途では自己署名証明書を使用できます：

```bash
# 1. SSL証明書を生成（IPアドレスを変更）
mkdir -p nginx/certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/certs/domain.key \
  -out nginx/certs/domain.crt \
  -subj "/CN=192.168.7.46" \
  -addext "subjectAltName=IP:192.168.7.46"

# 2. nginx設定を自己署名証明書用に変更
# nginx/nginx.conf の証明書パスを以下に変更：
# ssl_certificate     /etc/nginx/certs/domain.crt;
# ssl_certificate_key /etc/nginx/certs/domain.key;

# 3. サービス起動
docker compose up -d --build

# 4. クライアント設定（各Dockerクライアント）
sudo cp docs/examples/client-daemon.json /etc/docker/daemon.json
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
├── README.md                   # プロジェクト概要
├── .gitignore                  # Git除外設定
├── docs/                       # ドキュメント
│   ├── SETUP.md               # セットアップガイド
│   ├── TROUBLESHOOTING.md     # トラブルシューティング
│   └── examples/              # 設定例
│       ├── daemon.json        # サーバー用daemon.json
│       └── client-daemon.json # クライアント用daemon.json
├── nginx/                      # Nginx リバースプロキシ
│   ├── Dockerfile             # Nginx コンテナ
│   ├── nginx.conf             # Nginx 設定
│   └── certs/                 # SSL証明書
│       ├── domain.crt         # SSL証明書
│       └── domain.key         # SSL秘密鍵
├── ui/                         # Web UI
│   ├── Dockerfile             # UI コンテナ
│   ├── server.js              # Express サーバー
│   ├── main.jsx               # React アプリ
│   ├── index.html             # HTML テンプレート
│   ├── package.json           # Node.js 依存関係
│   ├── vite.config.js         # Vite 設定
│   └── .npmrc                 # npm 設定
└── data/                       # Registry データ（自動作成）
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

問題が発生した場合は [`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md) を参照してください。

### よくある問題

- **SSL証明書エラー**: IP SANの設定とinsecure registryの設定を確認
- **502 Bad Gateway**: サービスの起動状態を確認
- **CORS エラー**: Registry設定とブラウザの開発者ツールを確認

### ログ確認

```bash
# 全サービスのログ
docker compose logs

# リアルタイムログ
docker compose logs -f
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