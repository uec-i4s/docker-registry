const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

app.post('/api/push', (req, res) => {
  const { image } = req.body;
  if (!image) {
    return res.status(400).json({ error: 'image is required' });
  }
  const registry = process.env.REGISTRY_HOST || 'localhost:5000';
  const tagCmd = `docker tag ${image} ${registry}/${image}`;
  const pushCmd = `docker push ${registry}/${image}`;

  exec(`docker pull ${image}`, (err, stdout, stderr) => {
    if (err) {
      return res.status(500).json({ error: 'docker pull failed', detail: stderr });
    }
    exec(tagCmd, (err2, stdout2, stderr2) => {
      if (err2) {
        return res.status(500).json({ error: 'docker tag failed', detail: stderr2 });
      }
      exec(pushCmd, (err3, stdout3, stderr3) => {
        if (err3) {
          return res.status(500).json({ error: 'docker push failed', detail: stderr3 });
        }
        res.json({ result: 'ok', log: stdout + stdout2 + stdout3 });
      });
    });
  });
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Registry API server running on port ${port}`);
});