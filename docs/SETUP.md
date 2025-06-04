# セットアップガイド

## 1. サーバー側設定（Registry ホスト）

### SSL証明書の生成

IPアドレスを適切に変更してください：

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/certs/domain.key \
  -out nginx/certs/domain.crt \
  -subj "/CN=192.168.7.46" \
  -addext "subjectAltName=IP:192.168.7.46"
```

### サービス起動

```bash
docker compose up -d --build
```

## 2. クライアント側設定

### daemon.json設定

`docs/examples/client-daemon.json` の内容を使用：

```bash
sudo cp docs/examples/client-daemon.json /etc/docker/daemon.json
sudo systemctl restart docker
```

### 手動設定

```bash
sudo tee /etc/docker/daemon.json << 'EOF'
{
  "insecure-registries": ["192.168.7.46:5000", "192.168.7.46:443", "192.168.7.46"]
}
EOF

sudo systemctl restart docker
```

## 3. 動作確認

```bash
# Registry API確認
curl -k https://192.168.7.46/v2/_catalog

# Web UI確認
curl -k https://192.168.7.46/

# Docker pull/push テスト
docker pull python:3.12-slim
docker tag python:3.12-slim 192.168.7.46/python:3.12-slim
docker push 192.168.7.46/python:3.12-slim