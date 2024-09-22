const db = require('../db/postgresql');
const logger_config = require('../config/config').logger;
const logger = require('log4js').configure(logger_config).getLogger('out')

module.exports = (app) => {
    /**
     * @swagger
     * /indexer/status:
     *   get:
     *     summary: Get the current status of the indexer
     *     responses:
     *       200:
     *         description: Indexer status retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: boolean
     *                   description: The current status of the indexer
     *       500:
     *         description: Internal Server Error
     */
    app.get('/indexer/status', async (req, res) => {
        console.log('Getting indexer status');
        try {
            const status = await db.is_indexing();
            res.status(200).json({ status });
        } catch (error) {
            console.error('Error fetching indexer status:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    })

    /**
     * @swagger
     * /indexer/history:
     *   get:
     *     summary: Get the indexing history
     *     parameters:
     *       - in: query
     *         name: errors
     *         schema:
     *           type: string
     *         description: Filter by failed jobs
     *       - in: query
     *         name: completed
     *         schema:
     *           type: string
     *         description: Filter by completed jobs
     *       - in: query
     *         name: running
     *         schema:
     *           type: string
     *         description: Filter by running jobs
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *           default: 1
     *         description: Page number for pagination
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           default: 10
     *         description: Number of items per page
     *     responses:
     *       200:
     *         description: Indexing history retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 history:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       id:
     *                         type: integer
     *                       status:
     *                         type: string
     *                       started_at:
     *                         type: string
     *                         format: date-time
     *                       completed_at:
     *                         type: string
     *                         format: date-time
     *       500:
     *         description: Internal Server Error
     */
    app.get('/indexer/history', async (req, res) => {
        logger.info('Getting indexing history');
        try {
            const { errors, completed, running, page = 1, limit = 10 } = req.query;
            const offset = (page - 1) * limit;
            let history;
            if (errors === 'true') {
                history = await db.get_failed_jobs(limit, offset);
            } else if (completed === 'true') {
                history = await db.get_completed_jobs(limit, offset);
            } else if (running === 'true') {
                history = await db.get_running_jobs(limit, offset);
            } else {
                history = await db.get_indexing_history(limit, offset);
            }
            res.status(200).json({ history });
        } catch (error) {
            console.error('Error fetching indexing history:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    })
}