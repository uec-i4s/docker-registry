const express = require("express");
const path = require("path");
const { exec } = require("child_process");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// ログ出力を強化
function log(...args) {
  console.log("[API]", ...args);
}

const app = express();
app.use(express.json());

// SSE用のクライアント管理
const sseClients = new Map();

// SSE エンドポイント
app.get("/api/push-stream/:sessionId", (req, res) => {
  const sessionId = req.params.sessionId;
  
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  sseClients.set(sessionId, res);

  req.on('close', () => {
    sseClients.delete(sessionId);
  });
});

// API: docker pull/tag/push
app.post("/api/push", (req, res) => {
  const { image, sessionId } = req.body;
  if (!image) return res.status(400).json({ error: "image is required" });
  const registry = process.env.REGISTRY_HOST || "localhost:5000";
  const tagCmd = `docker tag ${image} ${registry}/${image}`;
  const pushCmd = `docker push ${registry}/${image}`;

  // タイムアウトを10分に設定
  req.setTimeout(600000);
  res.setTimeout(600000);

  let logs = [];
  function addLog(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    logs.push(logEntry);
    log(message);
    
    // SSEでリアルタイム送信
    if (sessionId && sseClients.has(sessionId)) {
      const sseRes = sseClients.get(sessionId);
      sseRes.write(`data: ${JSON.stringify({ type: 'log', message: logEntry })}\n\n`);
    }
  }

  function sendStatus(status) {
    if (sessionId && sseClients.has(sessionId)) {
      const sseRes = sseClients.get(sessionId);
      sseRes.write(`data: ${JSON.stringify({ type: 'status', status })}\n\n`);
    }
  }

  sendStatus('starting');
  addLog(`Starting docker pull for image: ${image}`);
  
  exec(`docker pull ${image}`, { timeout: 300000 }, (err, stdout, stderr) => {
    if (stdout) addLog(`Docker pull stdout: ${stdout}`);
    if (stderr) addLog(`Docker pull stderr: ${stderr}`);
    if (err) {
      addLog(`Docker pull error: ${err.message}`);
      sendStatus('error');
      return res.status(500).json({
        error: "docker pull failed",
        detail: stderr,
        stdout: stdout,
        logs: logs
      });
    }
    
    addLog(`Starting docker tag: ${tagCmd}`);
    exec(tagCmd, { timeout: 60000 }, (err2, stdout2, stderr2) => {
      if (stdout2) addLog(`Docker tag stdout: ${stdout2}`);
      if (stderr2) addLog(`Docker tag stderr: ${stderr2}`);
      if (err2) {
        addLog(`Docker tag error: ${err2.message}`);
        sendStatus('error');
        return res.status(500).json({
          error: "docker tag failed",
          detail: stderr2,
          stdout: stdout2,
          logs: logs
        });
      }
      
      addLog(`Starting docker push: ${pushCmd}`);
      exec(pushCmd, { timeout: 300000 }, (err3, stdout3, stderr3) => {
        if (stdout3) addLog(`Docker push stdout: ${stdout3}`);
        if (stderr3) addLog(`Docker push stderr: ${stderr3}`);
        if (err3) {
          addLog(`Docker push error: ${err3.message}`);
          sendStatus('error');
          return res.status(500).json({
            error: "docker push failed",
            detail: stderr3,
            stdout: stdout3,
            logs: logs
          });
        }
        addLog("Docker operations completed successfully");
        sendStatus('completed');
        
        // SSE接続を閉じる
        if (sessionId && sseClients.has(sessionId)) {
          const sseRes = sseClients.get(sessionId);
          sseRes.write(`data: ${JSON.stringify({ type: 'close' })}\n\n`);
          sseRes.end();
          sseClients.delete(sessionId);
        }
        
        res.json({
          result: "ok",
          log: stdout + stdout2 + stdout3,
          logs: logs
        });
      });
    });
  });
});

// 静的ファイル配信（Reactビルド成果物）
app.use(express.static(path.join(__dirname, "build")));

// /v2/ などAPIリバースプロキシ
const { createProxyMiddleware } = require("http-proxy-middleware");
app.use("/v2", createProxyMiddleware({
  target: "http://registry:5000",
  changeOrigin: true,
  pathRewrite: { "^/v2": "/v2" }
}));

// SPAルーティング（API以外）
app.get(/^\/(?!api\/).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.delete("/api/delete", async (req, res) => {
  const { repo, tag } = req.body;
  if (!repo || !tag) return res.status(400).json({ error: "repo and tag required" });
  try {
    // 1. HEAD/GETでmanifest digest取得
    const url = `http://registry:5000/v2/${repo}/manifests/${tag}`;
    log("DELETE req", { repo, tag, url });
    const resp = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/vnd.docker.distribution.manifest.v2+json" }
    });
    log("manifest fetch status", resp.status, "headers", Object.fromEntries(resp.headers.entries()));
    if (!resp.ok) {
      log("manifest fetch failed", resp.status, await resp.text());
      return res.status(500).json({ error: "manifest fetch failed", status: resp.status });
    }
    const digest = resp.headers.get("docker-content-digest");
    if (!digest) {
      log("digest not found", Object.fromEntries(resp.headers.entries()));
      return res.status(500).json({ error: "digest not found" });
    }

    // 2. DELETEでmanifest削除
    const delUrl = `http://registry:5000/v2/${repo}/manifests/${digest}`;
    log("DELETE", delUrl);
    const delResp = await fetch(delUrl, { method: "DELETE" });
    log("delete status", delResp.status, await delResp.text());
    if (delResp.status === 202) {
      res.json({ result: "deleted", digest });
    } else {
      res.status(500).json({ error: "delete failed", status: delResp.status });
    }
  } catch (e) {
    log("delete error", e);
    res.status(500).json({ error: "delete error", detail: e.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`UI+API server running on port ${port}`);
});