import { useState } from 'react'
import './App.css'
import FileExplorer from './FileExplorer'

function App() {
  const [folderPath, setFolderPath] = useState(null)
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [sorting, setSorting] = useState(false)
  const [results, setResults] = useState(null)
  const [deepScan, setDeepScan] = useState(false)
  const [showExplorer, setShowExplorer] = useState(false)

  // We don't need handleBrowse to call API anymore, just open modal
  const handleBrowse = () => {
    setShowExplorer(true);
  }

  const handleFolderSelect = (path) => {
    setFolderPath(path);
    setShowExplorer(false);
    loadPreview(path, deepScan);
  }

  const loadPreview = async (path, isDeep) => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderPath: path, deepScan: isDeep })
      });
      const data = await res.json();
      setFiles(data.files || []);
      setResults(null);
    } catch (err) {
      console.error(err);
      alert("Error loading preview");
    } finally {
      setLoading(false);
    }
  }

  const toggleDeepScan = (e) => {
    const checked = e.target.checked;
    setDeepScan(checked);
    if (folderPath) {
      loadPreview(folderPath, checked);
    }
  }

  const handleSort = async () => {
    if (!folderPath || files.length === 0) return;
    setSorting(true);
    try {
      const res = await fetch('http://localhost:3001/api/sort', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderPath, files })
      });
      const data = await res.json();
      setResults(data.results);
      // Refresh preview? Or just show results
    } catch (err) {
      console.error(err);
      alert("Error sorting files");
    } finally {
      setSorting(false);
    }
  }

  const readyCount = files.filter(f => f.status === 'Ready').length;

  return (
    <div className="glass-card">
      <h1>Excel Sorter Tool</h1>
      <p style={{ marginBottom: '30px', opacity: 0.8 }}>
        Select a folder containing Excel files to automatically rename and sort them by FID.
      </p>

      {!folderPath && (
        <button className="primary-btn" onClick={handleBrowse} disabled={loading}>
          {loading ? "Opening..." : "Select Folder"}
        </button>
      )}

      {folderPath && (
        <div style={{ textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <strong>Folder: {folderPath}</strong>
            <button onClick={handleBrowse} className="secondary-btn" style={{ fontSize: '0.8em', padding: '5px 10px' }}>Change</button>
          </div>

          <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={deepScan}
                onChange={toggleDeepScan}
                style={{ marginRight: '8px', width: '18px', height: '18px' }}
              />
              <span>Check all subfolders (Correct mistakes)</span>
            </label>
          </div>

          <h3>Files Found ({files.length})</h3>
          <div className="file-list">
            {files.map((f, i) => (
              <div key={i} className="file-item">
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: '500' }}>{f.fileName}</span>
                  {f.relativePath !== f.fileName && (
                    <span style={{ fontSize: '0.8em', opacity: 0.6 }}>{f.relativePath}</span>
                  )}
                </div>

                {results ? (
                  <span className={`status-badge ${results[i]?.status.includes('Success') ? 'status-success' : 'status-error'}`}>
                    {results[i]?.status === 'Success' ? 'Sorted' : results[i]?.status}
                  </span>
                ) : (
                  <span className={`status-badge ${f.status === 'Ready' ? 'status-ready' :
                    (f.status === 'Already Sorted' ? 'status-success' : 'status-error')
                    }`}>
                    {f.status === 'Ready' ? `FID: ${f.fid}` : f.status}
                  </span>
                )}
              </div>
            ))}
          </div>

          {!results && readyCount > 0 && (
            <div style={{ marginTop: '30px', textAlign: 'center' }}>
              <button className="primary-btn" onClick={handleSort} disabled={sorting}>
                {sorting ? "Sorting..." : `Sort ${readyCount} Files`}
              </button>
            </div>
          )}

          {results && (
            <div style={{ marginTop: '30px', textAlign: 'center' }}>
              <h2 className="status-success">Sorting Complete!</h2>
              <p>Check your folder for the sorted files.</p>
              <button className="primary-btn" onClick={() => { setFolderPath(null); setFiles([]); setResults(null); setDeepScan(false); }}>
                Start Over
              </button>
            </div>
          )}
        </div>
      )}

      <FileExplorer
        isOpen={showExplorer}
        onClose={() => setShowExplorer(false)}
        onSelect={handleFolderSelect}
        initialPath={folderPath}
      />
    </div>
  )
}

export default App
