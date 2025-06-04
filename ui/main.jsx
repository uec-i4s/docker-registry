import React, { useState, useEffect } from "react";

function RepoList({ onPull }) {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const res = await fetch("/v2/_catalog");
      const data = await res.json();
      setRepos(data.repositories || []);
    } catch {
      setRepos([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  return (
    <section>
      <h2>レジストリ一覧</h2>
      <button onClick={fetchCatalog}>一覧を更新</button>
      {loading ? (
        <div>読み込み中...</div>
      ) : repos.length === 0 ? (
        <div>リポジトリがありません</div>
      ) : (
        <ul>
          {repos.map((repo) => (
            <li key={repo}>
              <b>{repo}</b>{" "}
              <button onClick={() => onPull(repo)}>pullコマンド</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function PushForm() {
  const [src, setSrc] = useState("");
  const [status, setStatus] = useState("");
  const [cmd, setCmd] = useState("");

  const genCmd = () => {
    if (!src) {
      setCmd("");
      return;
    }
    const url = window.location.host;
    setCmd(
      `docker pull ${src}\ndocker tag ${src} ${url}/${src}\ndocker push ${url}/${src}`
    );
  };

  const doPush = async () => {
    if (!src) {
      setStatus("イメージ名を入力してください");
      return;
    }
    setStatus("追加中...");
    try {
      const res = await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: src }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("追加成功");
      } else {
        setStatus("追加失敗: " + (data.error || "不明なエラー"));
      }
    } catch {
      setStatus("API通信エラー");
    }
  };

  return (
    <section>
      <h2>docker push（レジストリに追加）</h2>
      <input
        value={src}
        onChange={(e) => setSrc(e.target.value)}
        placeholder="例: nginx:latest"
      />
      <button onClick={doPush}>レジストリに追加</button>
      <span>{status}</span>
      <button onClick={genCmd}>コマンド生成</button>
      <pre>{cmd}</pre>
    </section>
  );
}

function PullCmd({ repo }) {
  const [cmd, setCmd] = useState("");
  useEffect(() => {
    if (repo) {
      setCmd(`docker pull ${window.location.host}/${repo}:latest`);
    } else {
      setCmd("");
    }
  }, [repo]);
  return (
    <section>
      <h2>docker pull コマンド</h2>
      <pre>{cmd}</pre>
    </section>
  );
}

import { createRoot } from "react-dom/client";
export default function App() {
  const [pullRepo, setPullRepo] = useState("");
  return (
    <div style={{ fontFamily: "sans-serif", margin: "2rem" }}>
      <h1>Docker Registry UI</h1>
      <PushForm />
      <RepoList onPull={(repo) => setPullRepo(repo)} />
      <PullCmd repo={pullRepo} />
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);