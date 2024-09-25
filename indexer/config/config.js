const config = {
    app: {
        port: process.env.PORT || 3000,
        env: process.env.NODE_ENV || 'development'
    },
    postgresql: {
        host: process.env.DB_HOST || '192.168.75.149',
        port: process.env.DB_PORT || 5432,
        name: process.env.DB_NAME || 'gallery_index',
        user: process.env.DB_USER || '',
        password: process.env.DB_PASSWORD || ''
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
        startPath: process.env.INDEXER_START_PATH || '/source_files',
        fileTypes: process.env.INDEXER_FILE_TYPES ? process.env.INDEXER_FILE_TYPES.split(',') :
            [
                "ase", "art", "bmp",
                "blp", "cd5", "cit", "cpt", "cr2", "cut",
                "dds", "dib", "djvu", "egt", "exif", "gif",
                "gpl", "grf", "icns", "ico", "iff", "jng",
                "jpeg", "jpg", "jfif", "jp2", "jps", "lbm",
                "max", "miff", "mng", "msp", "nef", "nitf",
                "ota", "pbm", "pc1", "pc2", "pc3", "pcf",
                "pcx", "pdn", "pgm", "PI1", "PI2", "PI3",
                "pict", "pct", "pnm", "pns", "ppm", "psb",
                "psd", "pdd", "psp", "px", "pxm", "pxr",
                "qfx", "raw", "rle", "sct", "sgi", "rgb",
                "int", "bw", "tga", "tiff", "tif", "vtf",
                "xbm", "xcf", "xpm", "3dv", "amf", "ai",
                "awg", "cgm", "cdr", "cmx", "dxf", "e2d",
                "egt", "eps", "fs", "gbr", "odg", "svg",
                "stl", "vrml", "x3d", "sxd", "v2d", "vnd",
                "wmf", "emf", "art", "xar", "png", "webp",
                "jxr", "hdp", "wdp", "cur", "ecw", "iff",
                "lbm", "liff", "nrrd", "pam", "pcx", "pgf",
                "sgi", "rgb", "rgba", "bw", "int", "inta",
                "sid", "ras", "sun", "tga", "heic", "heif"
            ],
        pauseAfter: process.env.INDEXER_PAUSE_AFTER || 1000,
        pauseTimeSeconds: process.env.INDEXER_PAUSE_TIME_SECONDS || 5,
        cronSchedule: process.env.INDEXER_CRON_SCHEDULE || '0 0 * * * *'
    }
};

module.exports = config;