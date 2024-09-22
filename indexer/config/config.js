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
    logger: {
        appenders: {
            out: {
                type: "stdout",
                layout: {
                    type: "pattern",
                    pattern: "[%d] [%p] [%f:%l] - %m"
                }
            }
        },
        categories: {
            default: {
                appenders: ["out"],
                level: "debug",
                enableCallStack: true
            }
        },
    },
    indexer: {
        startPath: process.env.INDEXER_START_PATH || 'z:\\',
        fileTypes: process.env.INDEXER_FILE_TYPES ? process.env.INDEXER_FILE_TYPES.split(',') :
            [
                '.jpg', '.png', 'gif', '.jpeg', '.bmp',
                '.tiff', '.webp', '.svg', '.ico'
            ],
        pauseAfter: process.env.INDEXER_PAUSE_AFTER || 1000,
        pauseTimeSeconds: process.env.INDEXER_PAUSE_TIME_SECONDS || 5,
        cronSchedule: process.env.INDEXER_CRON_SCHEDULE || '0 0 * * * *'
    }
};

module.exports = config;