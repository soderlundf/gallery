const { Client } = require('pg');
const config = require('../config/config').postgresql;

const db = new Client({
    user: config.user,
    host: config.host,
    database: config.name,
    password: config.password,
    port: config.port,
});

db.connect()
    .then(() => console.log('Connected to PostgreSQL database'))
    .catch(err => console.error('Connection error', err.stack));

const createTableQuery = `
    CREATE TABLE IF NOT EXISTS images (
        id SERIAL PRIMARY KEY,
        filename TEXT NOT NULL,
        size INTEGER,
        created TIMESTAMP,
        modified TIMESTAMP,
        accessed TIMESTAMP,
        indexed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        path TEXT,
        extension TEXT
    )
`;

db.query(createTableQuery)
    .then(() => console.log('Table "images" is ready'))
    .catch(err => console.error('Error creating table', err.stack));

const createUniqueConstraintQuery = `
    ALTER TABLE images
    ADD CONSTRAINT unique_path_filename
    UNIQUE (path, filename)
`;

db.query(createUniqueConstraintQuery)
    .then(() => console.log('Unique constraint added to "images" table'))
    .catch(err => console.error('Error adding unique constraint', err.stack));

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
        await db.query(query, values);
        console.log(`Inserted/Updated file in database: ${file_data.path + "\\" + file_data.filename}`);
    } catch (err) {
        console.error('Error inserting/updating file in database', err.stack);
    }
}

/**
 * Count the total number of rows in the 'images' table.
 */
db.count_all_images = async () => {
    const query = 'SELECT COUNT(*) FROM images';

    try {
        const res = await db.query(query);
        return res.rows[0].count;
    } catch (err) {
        console.error('Error counting images', err.stack);
        throw err;
    }
}

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
        console.error('Error searching for images by filename', err.stack);
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
        console.error('Error counting images by filename', err.stack);
        throw err;
    }
}

module.exports = db