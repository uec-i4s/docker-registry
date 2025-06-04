import React, { useState, useEffect } from "react";

function RepoList({ onPull }) {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tags, setTags] = useState({});
  const [selected, setSelected] = useState({});

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const res = await fetch("/v2/_catalog");
      const data = await res.json();
      setRepos(data.repositories || []);
      // 各リポジトリのタグ一覧も取得
      for (const repo of data.repositories || []) {
        const tagRes = await fetch(`/v2/${repo}/tags/list`);
        const tagData = await tagRes.json();
        setTags((prev) => ({ ...prev, [repo]: tagData.tags || [] }));
      }
    } catch {
      setRepos([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const handleSelect = (repo, tag) => {
    setSelected((prev) => ({ ...prev, [repo]: tag }));
  };

  const handleDelete = async (repo, tag) => {
    if (!window.confirm(`${repo}:${tag} を本当に削除しますか？`)) return;
    try {
      const res = await fetch("/api/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo, tag })
      });
      const data = await res.json();
      if (res.ok) {
        alert("削除成功");
        fetchCatalog();
      } else {
        alert("削除失敗: " + (data.error || "不明なエラー"));
      }
    } catch (e) {
      alert("API通信エラー");
    }
  };

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
              <b>{repo}</b>
              {tags[repo] && tags[repo].length > 0 ? (
                <>
                  <select
                    value={selected[repo] || tags[repo][0]}
                    onChange={e => handleSelect(repo, e.target.value)}
                  >
                    {tags[repo].map(tag => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      const tag = selected[repo] || tags[repo][0];
                      onPull(`${repo}:${tag}`);
                    }}
                  >
                    pullコマンド
                  </button>
                  <button
                    style={{marginLeft:"0.5em"}}
                    onClick={() => {
                      const tag = selected[repo] || tags[repo][0];
                      handleDelete(repo, tag);
                    }}
                  >
                    削除
                  </button>
                  <button
                    style={{marginLeft:"0.5em"}}
                    onClick={() => {
                      const tag = selected[repo] || tags[repo][0];
                      navigator.clipboard.writeText(`${window.location.host}/${repo}:${tag}`);
                    }}
                  >
                    コピー
                  </button>
                </>
              ) : (
                <span>タグなし</span>
              )}
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

  const doPush = async () => {
    if (!src) {
      setStatus("イメージ名を入力してください");
      setCmd("");
      return;
    }
    setStatus("追加中...");
    setCmd("");
    try {
      const res = await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: src }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("追加成功");
        setCmd(data.log || "");
      } else {
        setStatus("追加失敗: " + (data.error || "不明なエラー"));
        setCmd(data.detail || "");
      }
    } catch {
      setStatus("API通信エラー");
      setCmd("");
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
      <pre style={{background:"#eee",padding:"0.5em",fontSize:"0.9em",overflowX:"auto"}}>{cmd}</pre>
    </section>
  );
}

function PullCmd({ repo }) {
  const [cmd, setCmd] = useState("");
  useEffect(() => {
    if (repo) {
      setCmd(`docker pull ${window.location.host}/${repo}`);
    } else {
      setCmd("");
    }
  }, [repo]);
  return (
    <section>
      <h2>docker pull コマンド</h2>
      <pre>{cmd}</pre>
      <button onClick={() => navigator.clipboard.writeText(cmd)}>コピー</button>
      <div style={{marginTop:"0.5em",fontSize:"0.95em"}}>
        <b>FROMで使う:</b>
        <input
          style={{width:"80%"}}
          value={`${window.location.host}/${repo || ""}`}
          readOnly
          onFocus={e => e.target.select()}
        />
        <button onClick={() => navigator.clipboard.writeText(`${window.location.host}/${repo || ""}`)}>コピー</button>
      </div>
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