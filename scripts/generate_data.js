const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const outputDir = path.join(__dirname, '../sample_input');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const names = ["Alice Smith", "Bob Jones", "Charlie Brown", "David Wilson", "Eva Green"];
const fids = [1001, 1002, 1003, 1001, 1002]; // Duplicates to test grouping

console.log(`Generating sample files in ${outputDir}...`);

for (let i = 0; i < 10; i++) {
    const fid = fids[Math.floor(Math.random() * fids.length)];
    const name = names[Math.floor(Math.random() * names.length)];
    
    // Create random filename
    const filename = `random_file_${Math.floor(Math.random() * 10000)}.xlsx`;
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    const data = [
        ["FID", "Name", "Date", "Notes"],
        [fid, name, new Date().toISOString(), "Sample Data"]
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    
    XLSX.writeFile(wb, path.join(outputDir, filename));
    console.log(`Created ${filename} with FID: ${fid}, Name: ${name}`);
}

console.log("Done.");
