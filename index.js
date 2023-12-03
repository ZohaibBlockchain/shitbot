import express from 'express';
import userRoutes from './routes.js';
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

app.use('/api', userRoutes);

app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});





