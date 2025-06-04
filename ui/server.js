const express = require("express");
const path = require("path");
const { exec } = require("child_process");

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
    if (err) return res.status(500).json({ error: "docker pull failed", detail: stderr });
    exec(tagCmd, (err2, stdout2, stderr2) => {
      if (err2) return res.status(500).json({ error: "docker tag failed", detail: stderr2 });
      exec(pushCmd, (err3, stdout3, stderr3) => {
        if (err3) return res.status(500).json({ error: "docker push failed", detail: stderr3 });
        res.json({ result: "ok", log: stdout + stdout2 + stdout3 });
      });
    });
  });
});

// 静的ファイル配信（Reactビルド成果物）
app.use(express.static(path.join(__dirname, "build")));

// SPAルーティング（API以外）
app.get(/^\/(?!api\/).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`UI+API server running on port ${port}`);
});