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
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(CorsMiddleware);


app.use('/admin', LoginRoute);
app.use('/images', CarouselImageRoute);
app.use('/financial', FinancialRoute);
app.use('/notice', NoticeRoute);
app.use('/gallery', GalleryRoute);
app.use('/api', BasicDetails);
app.use('/teamDetail', TeamDetailRoute);
app.use('/news', NewsRoute);
app.use('/documents', DocumentRoute);
app.use('/messages', MessageRoute);

app.use('/pdf', express.static(path.join(process.cwd(), 'pdf')));

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
