const fs = require('fs');
const path = require('path');

function searchFiles(startPath, fileType, result = []) {
    if (!fs.existsSync(startPath)) {
        console.log("Directory does not exist:", startPath);
        return [];
    }

    const files = fs.readdirSync(startPath);
    for (let i = 0; i < files.length; i++) {
        const filename = path.join(startPath, files[i]);
        const stat = fs.lstatSync(filename);
        if (stat.isDirectory()) {
            searchFiles(filename, fileType, result); // Recurse into subdirectory
        } else if (filename.endsWith(fileType)) {
            console.log("Found file:", filename); // Print each file when it is found
            result.push(filename);
        }
    }
    return result;
}

// Example usage:
const startPath = 'z:\\';
const fileType = '.jpg'; // Change this to the file type you are looking for
const foundFiles = searchFiles(startPath, fileType);

console.log("Found files:", foundFiles);