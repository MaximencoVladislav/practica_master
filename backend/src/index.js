require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const rolesRoutes = require('./routes/roles');
const sqlRoutes = require('./routes/sql'); // <-- ДОБАВЛЕНО

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/sql', sqlRoutes); // <-- ДОБАВЛЕНО

app.listen(3000, "0.0.0.0", () => {
  console.log(`Backend слушает http://localhost:${PORT}`);
});