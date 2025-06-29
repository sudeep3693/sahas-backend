import express from 'express';
import LoginRoute from './Routes/LoginRoute.js';
import CorsMiddleware from './MiddleWare/CorsMiddleware.js';
import CarouselImageRoute from './Routes/CarouselImageRoute.js';
import FinancialRoute from './Routes/FinancialRoute.js';
import NoticeRoute from './Routes/NoticeRoute.js';
import GalleryRoute from './Routes/GalleryRoute.js';
import TeamDetailRoute from './Routes/TeamDetailsRoute.js';
import BasicDetails from './Routes/BasicDetails.js';
import NewsRoute from './Routes/NewsRoute.js';
import DocumentRoute from './Routes/DocumentRoute.js';
import MessageRoute from './Routes/MessageRoute.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(CorsMiddleware);

// Static file routes

app.use('/uploads/carousel', express.static('uploads/carousel'));
app.use('/uploads/gallery', express.static('uploads/gallery'));
app.use('/uploads/notice', express.static('uploads/notice'));
app.use('/uploads/team', express.static('uploads/teamDetails'));
app.use('/uploads/news', express.static('uploads/news'));
app.use('/uploads/documents', express.static('uploads/documents'));
app.use('/uploads/messages', express.static('uploads/messages'));


// API Routes
app.use('/admin', LoginRoute);
app.use('/images', CarouselImageRoute);
app.use('/financial', FinancialRoute);
app.use('/notice', NoticeRoute);
app.use('/gallery', GalleryRoute);
app.use('/api', BasicDetails);
app.use('/teamDetail', TeamDetailRoute);
app.use('/news', NewsRoute)
app.use('/documents', DocumentRoute)
app.use('/messages', MessageRoute);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
