const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Gallery Indexer API',
            version: '1.0.0',
            description: 'API documentation for the Gallery Indexer',
        },
    },
    apis: [
        './indexer.js',
        './routes/*.js',
    ], // Path to the API docs
};

const specs = swaggerJsdoc(options);

module.exports = (app) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
}
