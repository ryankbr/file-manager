@echo off
echo Starting Excel Sorter Tool (Desktop App)...

:: Generate sample data first if needed
if not exist "sample_input" (
    echo Generating sample data...
    node scripts/generate_data.js
)

:: Build client if dist doesn't exist
if not exist "client\dist" (
    echo Building client...
    cd client
    call npm install
    call npm run build
    cd ..
)

:: Start Electron
echo Launching Application...
call npm run electron:dev
