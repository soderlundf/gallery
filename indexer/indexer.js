const fs = require('fs');
const path = require('path');

function searchFiles(startPath, fileTypes, result = []) {
    if (!fs.existsSync(startPath)) {
        console.log("Directory does not exist:", startPath);
        return [];
    }

    const files = fs.readdirSync(startPath);
    for (let i = 0; i < files.length; i++) {
        const filename = path.join(startPath, files[i]);
        const stat = fs.lstatSync(filename);
        if (stat.isDirectory()) {
            searchFiles(filename, fileTypes, result); // Recurse into subdirectory
        } else if (fileTypes.some(fileType => filename.endsWith(fileType))) {
            console.log("Found file:", filename); // Print each file when it is found
            result.push(filename);
        }
    }
    return result;
}

// Example usage:
const startPath = 'z:\\';
const fileTypes = ['.jpg', '.png']; // Change this to the file types you are looking for
const foundFiles = searchFiles(startPath, fileTypes);

console.log("Found files:", foundFiles);