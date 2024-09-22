const fs = require('fs');
const path = require('path');
const db = require('../db/postgresql');
const indexer_config = require('../config/config').indexer;
const logger_config = require('../config/config').logger;
const logger = require('log4js').configure(logger_config).getLogger('out')


const indexer = {}

/**
 * Logs the indexing job to the database.
 * @returns {Promise<void>} - A promise that resolves when the logging is complete.
 */
indexer.logIndexingJob = async (status, end_time = null, error = null, total_files = 0, new_files = 0) => {
    try {
        let job_id = await db.insert_indexing_job(status, end_time, error, total_files, new_files);
        logger.info("Indexing job start logged successfully.");
        return job_id;
    } catch (error) {
        logger.err("Error logging indexing job:", error);
    }
}

/**
 * Updates the indexing job status in the database.
 * 
 * @param {number} job_id - The ID of the indexing job to update.
 * @param {string} status - The status of the indexing job.
 * @param {Date|null} end_time - The end time of the indexing job. Defaults to NULL if not provided.
 * @param {string|null} error - Any error message if the job failed.
 * @param {number} total_files - The total number of files processed.
 * @param {number} new_files - The number of new files indexed.
 * @returns {Promise<void>} - A promise that resolves when the update is complete.
 */
indexer.updateIndexingJob = async (job_id, status, end_time = null, error = null, total_files = 0, new_files = 0) => {
    try {
        await db.update_indexing_job(job_id, status, end_time, error, total_files, new_files);
        logger.info("Indexing job status updated successfully.");
    } catch (error) {
        logger.err("Error updating indexing job status:", error);
    }
}

// Call the logIndexingJob function after indexing is complete
indexer.indexFiles = async () => {
    logger.info("Indexing files...");

    await db.update_indexing_status(true);

    let indexed_files = 0;
    let new_files = 0;

    await indexer.searchFiles(
        indexer_config.startPath,
        indexer_config.fileTypes,
        indexer_config.pauseAfter,
        indexer_config.pauseTimeSeconds
    ).then((result) => {
        indexed_files = result.fileCount;
        new_files = result.new_files;
    })

    await db.update_indexing_status(false);
    return { indexed_files, new_files };
}

/**
 * Checks the current indexing status in the database.
 * @returns {Promise<boolean>} - A promise that resolves with the current indexing status.
 */
indexer.is_indexing = async () => {
    return await db.is_indexing();
}

/**
 * Updates the indexing status in the database.
 * @param {boolean} status to update the indexing status to.
 * @returns 
 */
indexer.update_indexing_status = async (status) => {
    return await db.update_indexing_status(status);
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
indexer.searchFiles = async (startPath, fileTypes, pauseAfter = 100, pauseTimeSeconds = 5) => {
    let files = fs.readdirSync(startPath);
    let fileCount = 0;
    let new_files = 0;

    for (let i = 0; i < files.length; i++) {
        let filePath = path.join(startPath, files[i]);
        let stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            logger.debug("Scanning directory: " + filePath);
            await indexer.searchFiles(filePath, fileTypes, pauseAfter);
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

            let inserted_files = await db.insert_file_data(file_data);
            new_files += inserted_files;

            fileCount++;
        }

        if (fileCount >= pauseAfter) {
            await new Promise(resolve => setTimeout(resolve, pauseTimeSeconds * 1000));
            fileCount = 0;
        }
    }

    return { fileCount, new_files };
}

indexer.cleanupRunningJobs = async () => {
    try {
        await db.delete_running_jobs();
    } catch (error) {
        logger.error("Error cleaning up old indexing jobs: " + error);
    }
}

indexer.count_all_images = async () => {
    return await db.count_all_images();
}

module.exports = indexer;