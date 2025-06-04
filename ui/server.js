const express = require("express");
const path = require("path");
const { exec } = require("child_process");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
app.use(express.json());

// API: docker pull/tag/push
app.post("/api/push", (req, res) => {
  const { image } = req.body;
  if (!image) return res.status(400).json({ error: "image is required" });
  const registry = process.env.REGISTRY_HOST || "localhost:5000";
  const tagCmd = `docker tag ${image} ${registry}/${image}`;
  const pushCmd = `docker push ${registry}/${image}`;

  exec(`docker pull ${image}`, (err, stdout, stderr) => {
    if (err) {
      console.error("docker pull failed:", stderr);
      return res.status(500).json({ error: "docker pull failed", detail: stderr });
    }
    exec(tagCmd, (err2, stdout2, stderr2) => {
      if (err2) {
        console.error("docker tag failed:", stderr2);
        return res.status(500).json({ error: "docker tag failed", detail: stderr2 });
      }
      exec(pushCmd, (err3, stdout3, stderr3) => {
        if (err3) {
          console.error("docker push failed:", stderr3);
          return res.status(500).json({ error: "docker push failed", detail: stderr3 });
        }
        res.json({ result: "ok", log: stdout + stdout2 + stdout3 });
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
    const resp = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/vnd.docker.distribution.manifest.v2+json" }
    });
    if (!resp.ok) {
      return res.status(500).json({ error: "manifest fetch failed", status: resp.status });
    }
    const digest = resp.headers.get("docker-content-digest");
    if (!digest) return res.status(500).json({ error: "digest not found" });

    // 2. DELETEでmanifest削除
    const delUrl = `http://registry:5000/v2/${repo}/manifests/${digest}`;
    const delResp = await fetch(delUrl, { method: "DELETE" });
    if (delResp.status === 202) {
      res.json({ result: "deleted", digest });
    } else {
      res.status(500).json({ error: "delete failed", status: delResp.status });
    }
  } catch (e) {
    res.status(500).json({ error: "delete error", detail: e.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`UI+API server running on port ${port}`);
});