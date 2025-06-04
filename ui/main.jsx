import React, { useState, useEffect } from "react";
import "./style.css";

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
    <div className="card bg-base-100 shadow-xl mb-6">
      <div className="card-body">
        <h2 className="card-title text-2xl mb-4">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          レジストリ一覧
        </h2>
        
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <span className="loading loading-spinner loading-lg"></span>
            <span className="ml-2">読み込み中...</span>
          </div>
        ) : repos.length === 0 ? (
          <div className="alert alert-info">
            <svg className="stroke-current shrink-0 w-6 h-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>リポジトリがありません</span>
          </div>
        ) : (
          <div className="space-y-4">
            {repos.map((repo) => (
              <div key={repo} className="card bg-base-200 shadow-sm">
                <div className="card-body p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{repo}</h3>
                    </div>
                    
                    {tags[repo] && tags[repo].length > 0 ? (
                      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                        <select 
                          className="select select-bordered select-sm w-full sm:w-auto"
                          value={selected[repo] || tags[repo][0]}
                          onChange={e => handleSelect(repo, e.target.value)}
                        >
                          {tags[repo].map(tag => (
                            <option key={tag} value={tag}>{tag}</option>
                          ))}
                        </select>
                        
                        <div className="flex gap-2">
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                              const tag = selected[repo] || tags[repo][0];
                              handleSelect(repo, tag);
                            }}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            コマンド表示
                          </button>
                          
                          <button
                            className="btn btn-error btn-sm"
                            onClick={() => {
                              const tag = selected[repo] || tags[repo][0];
                              handleDelete(repo, tag);
                            }}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            削除
                          </button>
                          
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => {
                              const tag = selected[repo] || tags[repo][0];
                              const imageTag = `${repo}:${tag}`;
                              navigator.clipboard.writeText(imageTag);
                            }}
                            title={`${repo}:${selected[repo] || tags[repo][0]} をコピー`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            {`${repo}:${selected[repo] || tags[repo][0]}`}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="badge badge-warning">タグなし</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
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
    <div className="card bg-base-100 shadow-xl mb-6">
      <div className="card-body">
        <h2 className="card-title text-2xl mb-4">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Docker Push（レジストリに追加）
        </h2>
        
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text">イメージ名</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="例: nginx:latest"
              className="input input-bordered flex-1"
              value={src}
              onChange={(e) => setSrc(e.target.value)}
              disabled={isRunning}
            />
            <button 
              className={`btn ${isRunning ? 'btn-disabled' : 'btn-primary'}`}
              onClick={doPush} 
              disabled={isRunning}
            >
              {isRunning ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  実行中...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  レジストリに追加
                </>
              )}
            </button>
          </div>
        </div>
        
        {status && (
          <div className={`alert ${status.includes('成功') ? 'alert-success' : status.includes('失敗') || status.includes('エラー') ? 'alert-error' : 'alert-info'} mt-4`}>
            <span>{status}</span>
          </div>
        )}
        
        {logs.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">リアルタイムログ:</h3>
            <div className="mockup-code max-h-80 overflow-y-auto">
              <pre className="text-sm">
                {logs.join('\n')}
              </pre>
            </div>
          </div>
        )}
        
        {cmd && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Docker出力:</h3>
            <div className="mockup-code max-h-60 overflow-y-auto">
              <pre className="text-sm">
                {cmd}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
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
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title text-2xl mb-4">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          Docker コマンド
        </h2>
        
        {cmd && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Pull コマンド:</h3>
            <div className="mockup-code">
              <pre data-prefix="$"><code>{cmd}</code></pre>
            </div>
            <button 
              className="btn btn-outline btn-sm mt-2"
              onClick={() => navigator.clipboard.writeText(cmd)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              コピー
            </button>
          </div>
        )}
        
        {fromCmd && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Dockerfile FROM文:</h3>
            <div className="mockup-code">
              <pre><code>{fromCmd}</code></pre>
            </div>
            <button 
              className="btn btn-outline btn-sm mt-2"
              onClick={() => navigator.clipboard.writeText(fromCmd)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              コピー
            </button>
          </div>
        )}
        
        {!cmd && !fromCmd && (
          <div className="alert alert-info">
            <svg className="stroke-current shrink-0 w-6 h-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>レジストリからイメージを選択してください</span>
          </div>
        )}
      </div>
    </div>
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
    <div className="min-h-screen bg-base-200">
      <div className="navbar bg-base-100 shadow-lg">
        <div className="flex-1">
          <h1 className="text-xl font-bold">
            <svg className="w-8 h-8 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Docker Registry UI
          </h1>
        </div>
      </div>
      
      <div className="container mx-auto p-6">
        <PushForm onPushComplete={handlePushComplete} />
        <RepoList onPull={handlePull} refreshTrigger={refreshTrigger} />
        <PullCmd repo={pullRepo} tag={pullTag} />
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);