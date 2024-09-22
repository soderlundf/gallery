const { Client } = require('pg');
const config = require('../config/config').postgresql;
const logger_config = require('../config/config').logger;
const logger = require('log4js').configure(logger_config).getLogger('out')

const db = new Client({
    user: config.user,
    host: config.host,
    database: config.name,
    password: config.password,
    port: config.port,
});

db.connect()
    .then(() => logger.debug('Connected to PostgreSQL database'))
    .catch(err => logger.error('Connection error', err.stack));

const createIndexerTableQuery = `
    CREATE TABLE IF NOT EXISTS indexer (
        id SERIAL PRIMARY KEY,
        is_indexing BOOLEAN DEFAULT FALSE,
        last_indexed TIMESTAMP
    )
`;

const createIndexingJobsTableQuery = `
    CREATE TABLE IF NOT EXISTS history_indexing_jobs (
        id SERIAL PRIMARY KEY,
        status TEXT NOT NULL,
        error TEXT,
        start_time TIMESTAMP DEFAULT (timezone('utc', now())),
        end_time TIMESTAMP DEFAULT (timezone('utc', now())),
        total_files INTEGER,
        new_files INTEGER
    )
`;

/**
 * Insert a new indexing job into the database.
 * @param {string} status - The status of the indexing job ('running', 'completed', or 'failed').
 * @param {Date} end_time - The end time of the indexing job.
 * @param {string} error - Any error message if the job failed.
 * @param {number} total_files - The total number of files processed.
 * @param {number} new_files - The number of new files indexed.
 * @returns 
 */
db.insert_indexing_job = async (status, end_time = null, error = null, total_files = 0, new_files = 0) => {
    const query = `
        INSERT INTO history_indexing_jobs (status, end_time, error, total_files, new_files)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
    `;

    const values = [status, end_time, error, total_files, new_files];

    try {
        const res = await db.query(query, values);
        return res.rows[0].id;
    } catch (err) {
        logger.error('Error inserting indexing job', err.stack);
        throw err;
    }
}


/**
 * Update an indexing job in the database.
 * @param {number} id - The ID of the indexing job to update.
 * @param {string} status - The status of the indexing job.
 * @param {Date} end_time - The end time of the indexing job.
 * @param {string} error - Any error message if the job failed.
 * @param {number} total_files - The total number of files processed.
 * @param {number} new_files - The number of new files indexed.
 */
db.update_indexing_job = async (id, status, end_time = null, error = null, total_files = 0, new_files = 0) => {
    const query = `
        UPDATE history_indexing_jobs
        SET status = $2,
            end_time = $3,
            error = $4,
            total_files = $5,
            new_files = $6
        WHERE id = $1
    `;

    const values = [id, status, end_time, error, total_files, new_files];

    try {
        await db.query(query, values);
        logger.debug(`Indexing job ${id} updated`);
    } catch (err) {
        logger.error('Error updating indexing job', err.stack);
        throw err;
    }
}

/**
 * Ensure the 'history_indexing_jobs' table exists.
 */
db.query(createIndexingJobsTableQuery)
    .then(() => logger.debug('Table "history_indexing_jobs" is ready'))
    .catch(err => logger.error('Error creating indexing_jobs table', err.stack));

/**
 * Ensure the 'indexer' table exists.
 */
db.query(createIndexerTableQuery)
    .then(() => logger.debug('Table "indexer" is ready'))
    .catch(err => logger.error('Error creating indexer table', err.stack));

/**
 * Update the indexing status in the database.
 * @param {boolean} is_indexing - The new indexing status.
 */
db.update_indexing_status = async (is_indexing) => {
    const query = `
        UPDATE indexer
        SET is_indexing = $1,
            last_indexed = CURRENT_TIMESTAMP
        WHERE id = 1
    `;

    try {
        await db.query(query, [is_indexing]);
        logger.debug(`Indexer status updated to: ${is_indexing}`);
    } catch (err) {
        logger.error('Error updating indexer status', err.stack);
        throw err;
    }
}

/**
 * Get failed indexing jobs.
 * @param {number} limit - The maximum number of jobs to return.
 * @param {number} offset - The number of jobs to skip.
 * @returns 
 */
db.get_failed_jobs = async (limit = 10, offset = 0) => {
    const query = `
        SELECT * FROM history_indexing_jobs
        WHERE status = 'failed'
        ORDER BY start_time DESC
        LIMIT $1 OFFSET $2
    `;

    try {
        const res = await db.query(query, [limit, offset]);
        return res.rows;
    } catch (err) {
        logger.error('Error retrieving failed runs', err.stack);
        throw err;
    }
}

/**
 * Get completed indexing jobs.
 * @param {number} limit - The maximum number of jobs to return.
 * @param {number} offset - The number of jobs to skip.
 * @returns 
 */
db.get_completed_jobs = async (limit = 10, offset = 0) => {
    const query = `
        SELECT * FROM history_indexing_jobs
        WHERE status = 'completed'
        ORDER BY start_time DESC
        LIMIT $1 OFFSET $2
    `;

    try {
        const res = await db.query(query, [limit, offset]);
        return res.rows;
    } catch (err) {
        logger.error('Error retrieving completed runs', err.stack);
        throw err;
    }
}

/**
 * Get running indexing jobs.
 * @param {number} limit - The maximum number of jobs to return.
 * @param {number} offset - The number of jobs to skip.
 * @returns 
 */
db.get_running_jobs = async (limit = 10, offset = 0) => {
    const query = `
        SELECT * FROM history_indexing_jobs
        WHERE status = 'running'
        ORDER BY start_time DESC
        LIMIT $1 OFFSET $2
    `;

    try {
        const res = await db.query(query, [limit, offset]);
        return res.rows;
    } catch (err) {
        logger.error('Error retrieving running jobs', err.stack);
        throw err;
    }
}

/**
 * Delete all running indexing jobs.
  */
db.delete_running_jobs = async () => {
    const query = `
        DELETE FROM history_indexing_jobs
        WHERE status = 'running'
    `;

    try {
        await db.query(query);
        logger.debug('Deleted all running jobs from history');
    } catch (err) {
        logger.error('Error deleting running jobs', err.stack);
        throw err;
    }
}

/**
 * Clean up old indexing jobs with status 'running'.
 * @param {number} limit 
 * @param {number} offset 
 * @returns 
 */
db.get_indexing_history = async (limit = 10, offset = 0) => {
    const query = `
        SELECT * FROM history_indexing_jobs
        ORDER BY start_time DESC
        LIMIT $1 OFFSET $2
    `;

    try {
        const res = await db.query(query, [limit, offset]);
        return res.rows;
    } catch (err) {
        logger.error('Error retrieving indexing history', err.stack);
        throw err;
    }
}

/**
 * Check if indexing is in progress.
 * @returns {Promise<boolean>} - A promise that resolves to true if indexing is in progress, false otherwise.
 */
db.is_indexing = async () => {
    logger.debug('Checking indexing status...');
    const query = `
        SELECT is_indexing
        FROM indexer
        WHERE id = 1
    `;

    try {
        const res = await db.query(query);
        return res.rows[0].is_indexing;
    } catch (err) {
        logger.error('Error checking indexing status', err.stack);
        throw err;
    }
}

/**
 * Ensure the indexer table has a row with id = 1 
 */
const ensureIndexerRowQuery = `
        INSERT INTO indexer (id, is_indexing, last_indexed)
        VALUES (1, FALSE, (timezone('utc', now())))
        ON CONFLICT (id) DO NOTHING
    `;

/**
 * Ensure the 'indexer' table has a row with id = 1.
 */
db.query(ensureIndexerRowQuery)
    .then(() => logger.info('Ensured indexer row exists'))
    .catch(err => console.error('Error ensuring indexer row', err.stack));

const createTableQuery = `
    CREATE TABLE IF NOT EXISTS images (
        id SERIAL PRIMARY KEY,
        filename TEXT NOT NULL,
        size INTEGER,
        created TIMESTAMP,
        modified TIMESTAMP,
        accessed TIMESTAMP,
        indexed TIMESTAMP DEFAULT (timezone('utc', now())),
        path TEXT,
        extension TEXT
    )
`;

/**
 * Create the 'images' table if it does not exist.
  * @returns {Promise<void>} - A promise that resolves when the table is created.
 */
db.query(createTableQuery)
    .then(() => logger.debug('Table "images" is ready'))
    .catch(err => console.error('Error creating table', err.stack));

const createUniqueConstraintQuery = `
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conname = 'unique_path_filename'
        ) THEN
            ALTER TABLE images
            ADD CONSTRAINT unique_path_filename
            UNIQUE (path, filename);
        END IF;
    END $$;
`;

/**
 * Add a unique constraint to the 'images' table on the 'path' and 'filename' columns.
 * @returns {Promise<void>} - A promise that resolves when the constraint is added.
 */
db.query(createUniqueConstraintQuery)
    .then(() => logger.info('Unique constraint added to "images" table'))
    .catch(err => logger.error('Error adding unique constraint', err.stack));

/**
 * Insert or update file data in the 'images' table.
 * @param {object} file_data - The file data to insert or update in the database.
 * @returns 
 */
db.insert_file_data = async (file_data) => {
    const query = `
        INSERT INTO images (filename, size, created, modified, accessed, path, extension)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (path, filename)
        DO UPDATE SET
            size = EXCLUDED.size,
            created = EXCLUDED.created,
            modified = EXCLUDED.modified,
            accessed = EXCLUDED.accessed,
            extension = EXCLUDED.extension
        RETURNING (xmax = 0) AS inserted
    `;

    const values = [
        file_data.filename,
        file_data.size,
        file_data.created,
        file_data.modified,
        file_data.accessed,
        file_data.path,
        file_data.extension
    ];

    try {
        const res = await db.query(query, values);
        const inserted = res.rows[0].inserted;
        return inserted ? 0 : 1; // 0 if inserted, 1 if updated
    } catch (err) {
        logger.error('Error inserting/updating file in database', err.stack);
        throw err;
    }
}

/**
 * Count the total number of rows in the 'images' table.
 * @returns {Promise<number>} - A promise that resolves to the total number of rows.
 */
db.count_all_images = async () => {
    const query = 'SELECT COUNT(*) FROM images';

    try {
        const res = await db.query(query);
        return res.rows[0].count;
    } catch (err) {
        logger.error('Error counting images', err.stack);
        throw err;
    }
}

/**
 * Search for images by filename (case insensitive).
 * @param {string} filename - The filename to search for.
 * @param {number} limit - The maximum number of images to return.
 * @param {number} offset - The number of images to skip.
 * @param {string} order  - The order to sort the results by ('asc' or 'desc').
 * @returns 
 */
db.search_files_by_name = async (filename, limit = 10, offset = 0, order = 'asc') => {
    const query = `
        SELECT * FROM images
        WHERE LOWER(filename) LIKE LOWER($1)
        ORDER BY filename ${order === 'desc' ? 'desc' : 'asc'}
        LIMIT $2 OFFSET $3
    `;

    try {
        const res = await db.query(query, [`%${filename}%`, limit, offset]);
        return res.rows;
    } catch (err) {
        logger.error('Error searching for images by filename', err.stack);
        throw err;
    }
}

/**
 * Count the number of images with a given filename (case insensitive).
 * @param {string} filename - The filename to search for.
 * @returns {Promise<number>} - A promise that resolves to the number of matching images.
 */
db.count_files_by_name = async (filename) => {
    const query = `
        SELECT COUNT(*) FROM images
        WHERE LOWER(filename) like LOWER($1)
    `;

    try {
        const res = await db.query(query, [`%${filename}%`]);
        return res.rows[0].count;
    } catch (err) {
        logger.error('Error counting images by filename', err.stack);
        throw err;
    }
}

module.exports = db