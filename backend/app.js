import express from 'express';
import morgan from 'morgan';
import connect from './db/db.js';
import userRoutes from './routes/user.routes.js';
import projectRoutes from './routes/project.routes.js';
import aiRoutes from './routes/ai.routes.js';
import messageRoutes from './routes/message.routes.js';  // ← ADD THIS
import cookieParser from 'cookie-parser';
import cors from 'cors';

connect();
const app = express();

app.use(cors({
  origin: [
    'https://brainboxchat.vercel.app',
    'https://brainboxchat-mfez.onrender.com',
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/users', userRoutes);
app.use('/projects', projectRoutes);
app.use('/ai', aiRoutes);
app.use('/messages', messageRoutes);  // ← ADD THIS

app.get('/', (req, res) => {
    res.send('Hello World!');
});

export default app;