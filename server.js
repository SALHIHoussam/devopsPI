import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoute.js';
import announcementRoute from './routes/announcementRoute.js';
import reservationRoute from './routes/reservationRoute.js';
import notificationRoute from './routes/notificationRoute.js';
// This line is missing:
import announcementBackOfficeRoute from './routes/announcementBackOfficeRoute.js';
import reservationbackofficeRoute from './routes/reservationbackofficeRoute.js';
dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(express.json());
//app.use(cors({ origin: '*', credentials: true }));
//app.use(cookieParser());
app.use(
    cors({
        origin: ["http://localhost:5177", "http://localhost:5178","http://localhost:5173","http://192.168.31.134:5000"],
        credentials: true, // Allow cookies & headers
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
        allowedHeaders: "Content-Type, Authorization",
        exposedHeaders: ["Content-Type", "Authorization"]
    })
);


app.use(cookieParser()); 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/announcements', announcementRoute);
app.use('/api/reservations', reservationRoute);
app.use('/api/notifications', notificationRoute);
app.use('/api/announcements-backoffice', announcementBackOfficeRoute);
app.use('/api/reservationbackoffice', reservationbackofficeRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(` Server running on port ${PORT}`));
