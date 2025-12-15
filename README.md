# Excel Sorter Tool

A simple tool for non-technical staff to sort Excel files based on an internal FID number.

## Features
- **Simple Interface**: Just click to select a folder.
- **Automatic Sorting**: Reads the `FID` and `Name` from each Excel file.
- **Renaming**: Renames files to `Name_FID.xlsx`.
- **Organization**: Moves files into folders named after their FID.
- **Deep Scan / Correction**: Option to scan all subfolders to find and correct misplaced files.

## How to Use
1. Double-click `start.bat` to launch the Desktop Application.
2. The application window will open.
3. Click **Select Folder**.
4. Choose the folder containing your Excel files.
5. **Optional**: Check "Check all subfolders" if you want to find files hidden in subdirectories or correct files that were put in the wrong folder.
6. Review the preview list.
7. Click **Sort Files**.

## Building for Production
To create a standalone `.exe` file:
1. Run `npm run dist` in the terminal.
2. The executable will be created in the `dist` folder.

## Testing
A `sample_input` folder has been generated with random data for you to test the tool immediately.
