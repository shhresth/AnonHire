import dotenv from 'dotenv';
import path from 'path';

// Must be loaded before any other module reads process.env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
