const db = require('../db/postgresql');
const logger_config = require('../config/config').logger;
const logger = require('log4js').configure(logger_config).getLogger('out')


module.exports = (app) => {
    /**
     * @swagger
     * /file/count:
     *   get:
     *     summary: Get image count
     *     description: Returns the count of images in the database.
     *     responses:
     *       200:
     *         description: A JSON object containing the image count.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 count:
     *                   type: integer
     *                   example: 100
     */
    app.get('/file/count', async (req, res) => {
        logger.info('Getting image count');
        try {
            const count = await db.count_all_images();
            res.status(200).json({ count });
        } catch (error) {
            console.error('Error fetching image count:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    /**
     * @swagger
     * /file/search:
     *   get:
     *     summary: Search files by name
     *     description: Returns a list of files that match the search query.
     *     parameters:
     *       - in: query
     *         name: query
     *         schema:
     *           type: string
     *         required: true
     *         description: The search query string.
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *           default: 1
     *         required: false
     *         description: The page number for pagination.
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           default: 10
     *         required: false
     *         description: The number of results per page.
     *       - in: query
     *         name: sort
     *         schema:
     *           type: string
     *           enum: [asc, desc]
     *           default: asc
     *         required: false
     *         description: The sort order of the results.
     *     responses:
     *       200:
     *         description: A JSON object containing the search results.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 results:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       id:
     *                         type: integer
     *                         example: 1
     *                       name:
     *                         type: string
     *                         example: "example.jpg"
     *                       path:
     *                         type: string
     *                         example: "/images/example.jpg"
     *                 total:
     *                   type: integer
     *                   example: 100
     *                 page:
     *                   type: integer
     *                   example: 1
     *                 limit:
     *                   type: integer
     *                   example: 10
     *       400:
     *         description: Bad request. Query parameter "query" is required.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: string
     *                   example: "Query parameter 'query' is required"
     *       500:
     *         description: Internal Server Error.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: string
     *                   example: "Internal Server Error"
     */
    app.get('/file/search', async (req, res) => {
        logger.info('Searching files by name');
        const { query, page = 1, limit = 10, sort = 'asc' } = req.query;
        if (!query) {
            return res.status(400).json({ error: 'Query parameter "query" is required' });
        }

        try {
            const offset = (page - 1) * limit;
            const results = await db.search_files_by_name(query, limit, offset, sort);
            const total = await db.count_files_by_name(query);

            res.status(200).json({
                results,
                total,
                page: parseInt(page, 10),
                limit: parseInt(limit, 10)
            });
        } catch (error) {
            console.error('Error searching files:', error);
            res.status(500).json({ error: 'Internal Server Error ' + error });
        }
    });
}