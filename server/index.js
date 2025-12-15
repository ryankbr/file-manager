const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const XLSX = require('xlsx');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Helper to recursively get files
const getFilesRecursively = (dir, fileList = []) => {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        try {
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                getFilesRecursively(filePath, fileList);
            } else if (file.endsWith('.xlsx') || file.endsWith('.xls')) {
                fileList.push(filePath);
            }
        } catch (e) {
            // Ignore access errors
        }
    });
    return fileList;
};

// New endpoint for custom file explorer
app.post('/api/list-dirs', (req, res) => {
    let { path: dirPath } = req.body;

    // Default to home directory if no path provided
    if (!dirPath) {
        dirPath = os.homedir();
    }

    try {
        // Check if path exists
        if (!fs.existsSync(dirPath)) {
            return res.status(400).json({ error: "Path does not exist" });
        }

        const items = fs.readdirSync(dirPath, { withFileTypes: true });
        const dirs = items
            .filter(item => item.isDirectory())
            .map(item => item.name)
            .filter(name => !name.startsWith('.') && !name.startsWith('$')); // Filter hidden/system folders

        // Sort alphabetically
        dirs.sort((a, b) => a.localeCompare(b));

        res.json({
            currentPath: dirPath,
            dirs: dirs,
            parentPath: path.dirname(dirPath)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/preview', (req, res) => {
    const { folderPath, deepScan } = req.body;
    if (!folderPath || !fs.existsSync(folderPath)) {
        return res.status(400).json({ error: "Invalid folder path" });
    }

    try {
        let filePaths = [];

        if (deepScan) {
            filePaths = getFilesRecursively(folderPath);
        } else {
            // Shallow scan (root only)
            filePaths = fs.readdirSync(folderPath)
                .filter(f => f.endsWith('.xlsx') || f.endsWith('.xls'))
                .map(f => path.join(folderPath, f));
        }

        const previewData = [];

        filePaths.forEach(filePath => {
            try {
                const fileName = path.basename(filePath);
                // Skip temporary files (starting with ~$)
                if (fileName.startsWith('~$')) return;

                const workbook = XLSX.readFile(filePath);
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const data = XLSX.utils.sheet_to_json(sheet);

                if (data.length > 0) {
                    const row = data[0];
                    const keys = Object.keys(row);
                    const fidKey = keys.find(k => k.toLowerCase().includes('fid'));
                    const nameKey = keys.find(k => k.toLowerCase().includes('name'));

                    if (fidKey) {
                        const fid = String(row[fidKey]).trim();
                        // Check if already correctly placed
                        const parentDir = path.basename(path.dirname(filePath));
                        const isCorrectlyPlaced = parentDir === fid;

                        previewData.push({
                            fullPath: filePath, // Use full path for robust handling
                            relativePath: path.relative(folderPath, filePath),
                            fileName: fileName,
                            fid: fid,
                            name: nameKey ? row[nameKey] : 'Unknown',
                            status: isCorrectlyPlaced ? 'Already Sorted' : 'Ready'
                        });
                    } else {
                        previewData.push({
                            fullPath: filePath,
                            relativePath: path.relative(folderPath, filePath),
                            fileName: fileName,
                            status: 'Error: No FID found'
                        });
                    }
                }
            } catch (e) {
                previewData.push({
                    fullPath: filePath,
                    relativePath: path.relative(folderPath, filePath),
                    fileName: path.basename(filePath),
                    status: 'Error reading file'
                });
            }
        });

        res.json({ files: previewData });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/sort', (req, res) => {
    const { folderPath, files } = req.body;

    if (!folderPath || !files) return res.status(400).json({ error: "Missing data" });

    const results = [];

    files.forEach(file => {
        if (file.status !== 'Ready') {
            results.push({ file: file.relativePath, status: 'Skipped' });
            return;
        }

        try {
            const fid = String(file.fid).trim();
            const name = String(file.name).trim().replace(/[^a-zA-Z0-9 ]/g, "");
            const newFileName = `${name}_${fid}.xlsx`;

            const targetDir = path.join(folderPath, fid);
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }

            const oldPath = file.fullPath; // Use the absolute path we stored
            const newPath = path.join(targetDir, newFileName);

            // Avoid overwriting if source and dest are same (renaming case handled by OS usually, but good to check)
            if (oldPath.toLowerCase() !== newPath.toLowerCase()) {
                // Check if target exists
                if (fs.existsSync(newPath)) {
                    // Append timestamp to avoid collision
                    const timestamp = Date.now();
                    const uniqueName = `${name}_${fid}_${timestamp}.xlsx`;
                    const uniquePath = path.join(targetDir, uniqueName);
                    fs.renameSync(oldPath, uniquePath);
                    results.push({ file: file.relativePath, status: 'Success (Renamed to avoid collision)' });
                } else {
                    fs.renameSync(oldPath, newPath);
                    results.push({ file: file.relativePath, status: 'Success' });
                }
            } else {
                results.push({ file: file.relativePath, status: 'Skipped (Already correct)' });
            }
        } catch (err) {
            results.push({ file: file.relativePath, status: `Error: ${err.message}` });
        }
    });

    res.json({ results });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
