import { useState, useEffect } from 'react';

function FileExplorer({ isOpen, onClose, onSelect, initialPath }) {
    const [currentPath, setCurrentPath] = useState(initialPath || null);
    const [dirs, setDirs] = useState([]);
    const [parentPath, setParentPath] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            loadDirs(currentPath);
        }
    }, [isOpen, currentPath]);

    const loadDirs = async (path) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('http://localhost:3001/api/list-dirs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            setCurrentPath(data.currentPath);
            setDirs(data.dirs);
            setParentPath(data.parentPath);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDirClick = (dirName) => {
        // Construct new path. 
        // Note: This simple concatenation might fail on Windows if not handled carefully, 
        // but the backend returns absolute paths so we should rely on backend to resolve?
        // Actually, we need to send the new path to backend.
        // Let's assume standard separator.
        const separator = currentPath.includes('\\') ? '\\' : '/';
        const newPath = currentPath.endsWith(separator)
            ? currentPath + dirName
            : currentPath + separator + dirName;

        // Better: Just send the new path to loadDirs, let backend handle normalization if needed?
        // But we need to construct it here to send it.
        loadDirs(newPath);
    };

    const handleUp = () => {
        if (parentPath) {
            loadDirs(parentPath);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content glass-card" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Select Folder</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="explorer-nav">
                    <button onClick={handleUp} disabled={!parentPath} className="nav-btn">
                        ↑ Up
                    </button>
                    <div className="path-display">
                        {currentPath || "Loading..."}
                    </div>
                </div>

                <div className="explorer-list">
                    {loading && <div className="loading-spinner">Loading...</div>}
                    {error && <div className="error-msg">{error}</div>}

                    {!loading && !error && dirs.map(dir => (
                        <div key={dir} className="explorer-item" onDoubleClick={() => handleDirClick(dir)}>
                            <span className="folder-icon">📁</span>
                            <span className="folder-name">{dir}</span>
                        </div>
                    ))}

                    {!loading && !error && dirs.length === 0 && (
                        <div className="empty-msg">No subfolders found</div>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="secondary-btn" onClick={onClose}>Cancel</button>
                    <button className="primary-btn" onClick={() => onSelect(currentPath)}>
                        Select This Folder
                    </button>
                </div>
            </div>
        </div>
    );
}

export default FileExplorer;
