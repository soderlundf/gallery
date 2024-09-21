const config = {
    app: {
        port: process.env.PORT || 3000,
        env: process.env.NODE_ENV || 'development'
    },
    postgresql: {
        host: process.env.DB_HOST || '192.168.75.149',
        port: process.env.DB_PORT || 5432,
        name: process.env.DB_NAME || 'gallery_index',
        user: process.env.DB_USER || 'gallery_indexer',
        password: process.env.DB_PASSWORD || 'gallery_indexer'
    },
    logging: {
        level: process.env.LOG_LEVEL || 'info'
    },
    indexer: {
        startPath: process.env.INDEXER_START_PATH || 'z:\\',
        fileTypes: process.env.INDEXER_FILE_TYPES ? process.env.INDEXER_FILE_TYPES.split(',') : ['.jpg', '.png'],
        pauseAfter: process.env.INDEXER_PAUSE_AFTER || 1000,
        pauseTimeSeconds: process.env.INDEXER_PAUSE_TIME_SECONDS || 5
    }
};

module.exports = config;