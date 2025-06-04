import React, { useState, useEffect } from "react";

function RepoList({ onPull, refreshTrigger }) {
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
  }, [refreshTrigger]);

  const handleSelect = (repo, tag) => {
    setSelected((prev) => ({ ...prev, [repo]: tag }));
    onPull(repo, tag);
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
                      handleSelect(repo, tag);
                    }}
                  >
                    コマンド表示
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

function PushForm({ onPushComplete }) {
  const [src, setSrc] = useState("");
  const [status, setStatus] = useState("");
  const [cmd, setCmd] = useState("");
  const [logs, setLogs] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const doPush = async () => {
    if (!src) {
      setStatus("イメージ名を入力してください");
      setCmd("");
      setLogs([]);
      return;
    }
    
    setIsRunning(true);
    setStatus("追加中...");
    setCmd("");
    setLogs([]);
    
    // セッションIDを生成
    const sessionId = Date.now().toString();
    
    // SSE接続を開始
    const eventSource = new EventSource(`/api/push-stream/${sessionId}`);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'log') {
          setLogs(prev => [...prev, data.message]);
        } else if (data.type === 'status') {
          if (data.status === 'completed') {
            setStatus("追加成功");
            setIsRunning(false);
            if (onPushComplete) onPushComplete();
          } else if (data.status === 'error') {
            setStatus("追加失敗");
            setIsRunning(false);
          }
        } else if (data.type === 'close') {
          eventSource.close();
        }
      } catch (e) {
        console.error('SSE JSON parse error:', e, 'Data:', event.data);
        setLogs(prev => [...prev, `[ERROR] SSE parse error: ${event.data}`]);
      }
    };
    
    eventSource.onerror = () => {
      setStatus("ストリーム接続エラー");
      setIsRunning(false);
      eventSource.close();
    };
    
    try {
      const res = await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: src, sessionId }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        setStatus("追加失敗: " + (data.error || "不明なエラー"));
        setCmd(data.detail || "");
        setIsRunning(false);
        eventSource.close();
      } else {
        setCmd(data.log || "");
      }
    } catch (e) {
      setStatus("API通信エラー: " + e.message);
      setCmd("");
      setIsRunning(false);
      eventSource.close();
    }
  };

  return (
    <section>
      <h2>docker push（レジストリに追加）</h2>
      <input
        value={src}
        onChange={(e) => setSrc(e.target.value)}
        placeholder="例: nginx:latest"
        disabled={isRunning}
      />
      <button onClick={doPush} disabled={isRunning}>
        {isRunning ? "実行中..." : "レジストリに追加"}
      </button>
      <span style={{marginLeft: "10px", fontWeight: "bold"}}>{status}</span>
      
      {logs.length > 0 && (
        <div>
          <h3>リアルタイムログ:</h3>
          <pre style={{
            background:"#f5f5f5",
            padding:"1em",
            fontSize:"0.8em",
            overflowX:"auto",
            maxHeight:"300px",
            overflowY:"auto",
            border:"1px solid #ddd",
            borderRadius:"4px",
            whiteSpace: "pre-wrap"
          }}>
            {logs.join('\n')}
          </pre>
        </div>
      )}
      
      {cmd && (
        <div>
          <h3>Docker出力:</h3>
          <pre style={{
            background:"#eee",
            padding:"0.5em",
            fontSize:"0.9em",
            overflowX:"auto",
            maxHeight:"200px",
            overflowY:"auto"
          }}>
            {cmd}
          </pre>
        </div>
      )}
    </section>
  );
}

function PullCmd({ repo, tag }) {
  const [cmd, setCmd] = useState("");
  const [fromCmd, setFromCmd] = useState("");
  
  useEffect(() => {
    if (repo && tag) {
      const fullImage = `${window.location.host}/${repo}:${tag}`;
      setCmd(`docker pull ${fullImage}`);
      setFromCmd(`FROM ${fullImage}`);
    } else if (repo) {
      const fullImage = `${window.location.host}/${repo}`;
      setCmd(`docker pull ${fullImage}`);
      setFromCmd(`FROM ${fullImage}`);
    } else {
      setCmd("");
      setFromCmd("");
    }
  }, [repo, tag]);
  
  return (
    <section>
      <h2>Docker コマンド</h2>
      {cmd && (
        <div style={{marginBottom:"1em"}}>
          <h3>Pull コマンド:</h3>
          <pre style={{background:"#f0f0f0", padding:"0.5em", borderRadius:"4px"}}>{cmd}</pre>
          <button onClick={() => navigator.clipboard.writeText(cmd)}>コピー</button>
        </div>
      )}
      {fromCmd && (
        <div>
          <h3>Dockerfile FROM文:</h3>
          <pre style={{background:"#f0f0f0", padding:"0.5em", borderRadius:"4px"}}>{fromCmd}</pre>
          <button onClick={() => navigator.clipboard.writeText(fromCmd)}>コピー</button>
        </div>
      )}
    </section>
  );
}

import { createRoot } from "react-dom/client";
export default function App() {
  const [pullRepo, setPullRepo] = useState("");
  const [pullTag, setPullTag] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const handlePushComplete = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  const handlePull = (repo, tag) => {
    setPullRepo(repo);
    setPullTag(tag);
  };
  
  return (
    <div style={{ fontFamily: "sans-serif", margin: "2rem" }}>
      <h1>Docker Registry UI</h1>
      <PushForm onPushComplete={handlePushComplete} />
      <RepoList onPull={handlePull} refreshTrigger={refreshTrigger} />
      <PullCmd repo={pullRepo} tag={pullTag} />
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);