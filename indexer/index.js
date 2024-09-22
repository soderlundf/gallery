const express = require('express')
const app = express()
const consign = require('consign');
const indexer = require('./indexer/indexer');
const jobs = require('./jobs/jobs');
const app_config = require('./config/config').app;
const logger_config = require('./config/config').logger;
const logger = require('log4js').configure(logger_config).getLogger('out')

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
    logger.info('Welcome endpoint hit');
    res.status(200).json({ message: 'Welcome to the Gallery Indexer API' });
});

app.listen(app_config.port, () => {
    logger.info(`Gallery Indexer API listening on port ${app_config.port}`)
    indexer.update_indexing_status(false);
})
