const express = require('express')
const app = express()
const consign = require('consign');
const fs = require('fs');
const path = require('path');
const db = require('./db/postgresql');

const app_config = require('./config/config').app;
const indexer_config = require('./config/config').indexer;

consign()
  .include('models')
  .include('routes')
  .include('./swagger.js')
  .into(app);

/**
 * @swagger
 * /:
 *   get:
 *     summary: Welcome endpoint
 *     description: Returns a welcome message.
 *     responses:
 *       200:
 *         description: A JSON object containing a welcome message.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Welcome to the Gallery Indexer API
 */
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Welcome to the Gallery Indexer API' });
});

app.listen(app_config.port, () => {
  console.log(`Gallery Indexer API listening on port ${app_config.port}`)
  indexFiles().then(() => {
    console.log("Started indexing files.");
  });
})

/**
 * Asynchronously indexes files starting from a specified path.
 * Logs the indexing process to the console.
 * 
 * @async
 * @function indexFiles
 * @returns {Promise<void>} A promise that resolves when the indexing is complete.
 */
async function indexFiles() {
    console.log("Indexing files...");
    searchFiles(
        indexer_config.startPath, 
        indexer_config.fileTypes, 
        indexer_config.pauseAfter, 
        indexer_config.pauseTimeSeconds);
}


/**
 * Recursively searches for files in a directory and processes them based on specified file types.
 * 
 * @param {string} startPath - The starting directory path to begin the search.
 * @param {string[]} fileTypes - An array of file extensions to search for.
 * @param {number} [pauseAfter=100] - The number of files to process before pausing.
 * @param {number} [pauseTimeSeconds=5] - The duration in seconds to pause after processing a batch of files.
 * @returns {Promise<void>} - A promise that resolves when the search is complete.
 */
async function searchFiles(startPath, fileTypes, pauseAfter = 100, pauseTimeSeconds = 5) {
    let files = fs.readdirSync(startPath);
    let fileCount = 0;

    for (let i = 0; i < files.length; i++) {
        let filePath = path.join(startPath, files[i]);
        let stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            console.log("Scanning directory:", filePath);
            await searchFiles(filePath, fileTypes, pauseAfter);
        } else if (fileTypes.some(ext => filePath.toLowerCase().endsWith(ext))) {
            let file_data = {
                filename: path.basename(filePath),
                size: stat.size,
                created: stat.birthtime.toISOString(),
                modified: stat.mtime.toISOString(),
                accessed: stat.atime.toISOString(),
                path: path.dirname(filePath),
                extension: path.extname(filePath)
            }

            await db.insert_file_data(file_data);

            fileCount++;
        }

        if (fileCount >= pauseAfter) {
            console.log(`Pausing for ${pauseTimeSeconds} seconds after scanning ${fileCount} files...`);
            console.log("Scanned files:", fileCount);
            await new Promise(resolve => setTimeout(resolve, pauseTimeSeconds * 1000));
            console.log("Resuming scan...");
            fileCount = 0;
        }
    }

    return;
}