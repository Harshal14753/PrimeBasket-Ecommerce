import express from 'express';
import ENV from './lib/env.js';

const app = express();

app.get('/', (req, res) => {
    res.send('Hello World!');
});

const startServer = async () => {
    try {
        app.listen(ENV.PORT, () => {
            console.log(`Server is running on port ${ENV.PORT}`);
        });
    } catch (error) {
        console.error('Error starting server:', error);
    }
}

startServer();