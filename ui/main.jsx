import React, { useState, useEffect } from "react";
import "./style.css";

// ロゴ表示コンポーネント
const ContainerLogo = ({ repoName, className = "w-10 h-10" }) => {
  const [logoUrl, setLogoUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    const fetchLogo = async () => {
      setIsLoading(true);
      setHasError(false);
      
      try {
        const response = await fetch(`/api/logo/${repoName}`);
        const data = await response.json();
        
        if (data.logoUrl) {
          setLogoUrl(data.logoUrl);
        } else {
          setHasError(true);
        }
      } catch (error) {
        console.error('Failed to fetch logo:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (repoName) {
      fetchLogo();
    }
  }, [repoName]);
  
  const handleImageError = () => {
    setHasError(true);
  };
  
  if (isLoading) {
    // ローディング状態
    return (
      <div className={`${className} bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center border border-gray-200`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (hasError || !logoUrl) {
    // フォールバック: SVGアイコン
    return (
      <div className={`${className} bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center border border-blue-200`}>
        <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M13.5 3a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 3a3 3 0 11-6 0 3 3 0 016 0zm6 4.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm1.5 0a3 3 0 11-6 0 3 3 0 016 0zm-9 6a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm1.5 0a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
      </div>
    );
  }
  
  return (
    <div className={`${className} bg-white rounded-lg flex items-center justify-center border border-gray-200 overflow-hidden`}>
      <img
        src={logoUrl}
        alt={`${repoName} logo`}
        className="w-full h-full object-contain p-1"
        onError={handleImageError}
        loading="lazy"
      />
    </div>
  );
};

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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
      <div className="p-6">
        <div className="flex items-center mb-6">
          <svg className="w-6 h-6 text-blue-600 mr-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M13.5 3a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 3a3 3 0 11-6 0 3 3 0 016 0zm6 4.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm1.5 0a3 3 0 11-6 0 3 3 0 016 0zm-9 6a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm1.5 0a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          <h2 className="text-2xl font-semibold text-gray-900">Repositories</h2>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading repositories...</span>
          </div>
        ) : repos.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No repositories</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by pushing your first image.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {repos.map((repo) => (
              <div key={repo} className="border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <ContainerLogo repoName={repo} className="w-12 h-12" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">{repo}</h3>
                          {tags[repo] && tags[repo].length > 0 && (
                            <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1 rounded-full border">
                              <code className="text-sm font-mono text-gray-700">
                                {`${repo}:${selected[repo] || tags[repo][0]}`}
                              </code>
                              <button
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                                onClick={() => {
                                  const tag = selected[repo] || tags[repo][0];
                                  navigator.clipboard.writeText(`${repo}:${tag}`);
                                }}
                                title="Copy image name"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {tags[repo] ? `${tags[repo].length} tag${tags[repo].length !== 1 ? 's' : ''}` : 'No tags'}
                        </p>
                      </div>
                    </div>
                    
                    {tags[repo] && tags[repo].length > 0 && (
                      <div className="flex items-center space-x-3">
                        <select 
                          className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={selected[repo] || tags[repo][0]}
                          onChange={e => handleSelect(repo, e.target.value)}
                        >
                          {tags[repo].map(tag => (
                            <option key={tag} value={tag}>{tag}</option>
                          ))}
                        </select>
                        
                        <button
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-md text-sm font-medium transition-colors"
                          onClick={() => {
                            const tag = selected[repo] || tags[repo][0];
                            handleSelect(repo, tag);
                          }}
                        >
                          View Commands
                        </button>
                        
                        <button
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded-md text-sm font-medium transition-colors"
                          onClick={() => {
                            const tag = selected[repo] || tags[repo][0];
                            handleDelete(repo, tag);
                          }}
                        >
                          Delete
                        </button>
                      </div>
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
      setStatus("Please enter an image name");
      setCmd("");
      setLogs([]);
      return;
    }
    
    setIsRunning(true);
    setStatus("Pushing image...");
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
            setStatus("Successfully pushed!");
            setIsRunning(false);
            if (onPushComplete) onPushComplete();
          } else if (data.status === 'error') {
            setStatus("Push failed");
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
      setStatus("Connection error");
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
        setStatus("Push failed: " + (data.error || "Unknown error"));
        setCmd(data.detail || "");
        setIsRunning(false);
        eventSource.close();
      } else {
        setCmd(data.log || "");
      }
    } catch (e) {
      setStatus("API communication error: " + e.message);
      setCmd("");
      setIsRunning(false);
      eventSource.close();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
      <div className="p-6">
        <div className="flex items-center mb-6">
          <svg className="w-6 h-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <h2 className="text-2xl font-semibold text-gray-900">Push Image</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image Name
            </label>
            <div className="flex space-x-3">
              <input
                type="text"
                placeholder="e.g., nginx:latest"
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={src}
                onChange={(e) => setSrc(e.target.value)}
                disabled={isRunning}
              />
              <button 
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  isRunning 
                    ? 'bg-gray-400 cursor-not-allowed text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
                onClick={doPush} 
                disabled={isRunning}
              >
                {isRunning ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Pushing...
                  </div>
                ) : (
                  'Push to Registry'
                )}
              </button>
            </div>
          </div>
          
          {status && (
            <div className={`p-3 rounded-md ${
              status.includes('Successfully') 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : status.includes('failed') || status.includes('error') 
                ? 'bg-red-50 text-red-800 border border-red-200' 
                : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}>
              {status}
            </div>
          )}
          
          {logs.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Live Logs:</h3>
              <div
                className="bg-gray-900 text-green-400 p-4 rounded-md max-h-80 overflow-y-auto font-mono text-sm"
                ref={(el) => {
                  if (el) {
                    el.scrollTop = el.scrollHeight;
                  }
                }}
              >
                {logs.map((log, index) => (
                  <div key={index} className="mb-1">{log}</div>
                ))}
              </div>
            </div>
          )}
          
          {cmd && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Docker Output:</h3>
              <div className="bg-gray-50 p-4 rounded-md max-h-60 overflow-y-auto">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap">{cmd}</pre>
              </div>
            </div>
          )}
        </div>
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6">
        <div className="flex items-center mb-6">
          <svg className="w-6 h-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          <h2 className="text-2xl font-semibold text-gray-900">Docker Commands</h2>
        </div>
        
        {cmd && fromCmd ? (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-gray-900">Pull Command</h3>
                <button 
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  onClick={() => navigator.clipboard.writeText(cmd)}
                >
                  Copy
                </button>
              </div>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-md font-mono text-sm">
                <span className="text-green-400">$</span> {cmd}
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-gray-900">Dockerfile FROM</h3>
                <button 
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  onClick={() => navigator.clipboard.writeText(fromCmd)}
                >
                  Copy
                </button>
              </div>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-md font-mono text-sm">
                {fromCmd}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No image selected</h3>
            <p className="mt-1 text-sm text-gray-500">Select an image from the repository list to view commands.</p>
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <svg className="w-8 h-8 text-blue-600 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13.5 3a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 3a3 3 0 11-6 0 3 3 0 016 0zm6 4.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm1.5 0a3 3 0 11-6 0 3 3 0 016 0zm-9 6a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm1.5 0a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              <h1 className="text-xl font-semibold text-gray-900">Docker Registry</h1>
            </div>
            <div className="text-sm text-gray-500">
              Private Registry
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PushForm onPushComplete={handlePushComplete} />
        <RepoList onPull={handlePull} refreshTrigger={refreshTrigger} />
        <PullCmd repo={pullRepo} tag={pullTag} />
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);