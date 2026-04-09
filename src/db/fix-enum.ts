import { AppDataSource } from './data-source';

async function fixEnum() {
    console.log('Connecting to database...');
    await AppDataSource.initialize();
    console.log('Connected.');

    const queryRunner = AppDataSource.createQueryRunner();

    try {
        console.log('Adding "WORKING" to machines_status_enum...');
        // Postgres does not allow ALTER TYPE inside a transaction block in some versions
        // and ADD VALUE cannot be rolled back easily.
        await queryRunner.query(`ALTER TYPE machines_status_enum ADD VALUE IF NOT EXISTS 'WORKING'`);
        
        console.log('Updating existing "PRINTING" records to "WORKING"...');
        await queryRunner.query(`UPDATE machines SET status = 'WORKING' WHERE status = 'PRINTING'`);
        
        console.log('Fix completed successfully.');
    } catch (error) {
        console.error('Error during fix:', error);
    } finally {
        await queryRunner.release();
        await AppDataSource.destroy();
    }
}

fixEnum();
