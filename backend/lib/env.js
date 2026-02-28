import dotenv from 'dotenv';

dotenv.config();

export default ENV = {
    PORT: process.env.PORT,
    MONGO_URI: process.env.MONGO_URI
}