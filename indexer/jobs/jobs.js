const cron = require('node-cron');
const indexer = require('../indexer/indexer');
const indexer_config = require('../config/config').indexer;
const logger_config = require('../config/config').logger;
const logger = require('log4js').configure(logger_config).getLogger('out')

const jobs = {}

jobs.start_scheduled_job = async () => {
    if (await indexer.is_indexing()) {
        logger.debug("Indexing already in progress. Skipping this run.");
        return;
    }
    logger.info("Running cron job to index files at " + new Date().toISOString());

    logger.debug("Cleaning up old indexing jobs with status 'running'.");
    await indexer.cleanupRunningJobs();
    logger.debug("Old indexing jobs cleaned up.");

    await indexer.update_indexing_status(true);
    logger.debug("Indexing status updated to 'running'.");

    const job_id = await indexer.logIndexingJob("running");
    logger.debug("Indexing job logged with ID:", job_id);

    let indexed_files, new_files;

    logger.debug("Scheduled job started indexing files.");
    try {
        let result = await indexer.indexFiles();
        indexed_files = result.indexed_files;
        new_files = result.new_files;
    } catch (err) {
        logger.error("Error during indexing:", err);
        logger.debug("Scheduled job failed indexing files for job ID:", job_id);
        const total_files = await indexer.count_all_images();
        await indexer.updateIndexingJob(job_id, "failed", new Date(Date.now()).toISOString(), err.message, 0, 0);
        await indexer.update_indexing_status(false);
        return;
    }
    logger.debug("Scheduled job finished indexing files.");

    const total_files = await indexer.count_all_images();

    await indexer.updateIndexingJob(job_id, "completed", new Date(Date.now()).toISOString(), null, total_files, new_files);
    logger.debug("Indexing job updated with successful completion status.");

    await indexer.update_indexing_status(false);
    logger.debug("Indexing status updated to 'completed'.");
}

cron.schedule(indexer_config.cronSchedule, jobs.start_scheduled_job);