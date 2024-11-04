const express = require('express');
const cors = require('cors');
const config = require('./config/environment');
const authRoutes = require('./routes/auth.routes.js');
const userRoutes = require('./routes/user.routes.js');
const studentsRoutes = require('./routes/students.routes.js');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', studentsRoutes);

app.listen(config.app.port, () => {
  console.log(`Server listening on port ${config.app.port}`);
});