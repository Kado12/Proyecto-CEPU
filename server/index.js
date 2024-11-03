// Configuración de variables de entorno
const dotenv = require('dotenv')
dotenv.config()

// Configuración del servidor y dependencias
const express = require('express')
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express()

// Middleware
app.use(cors());
app.use(express.json());

// Configuración de la base de datos para Railway
const db = mysql.createConnection({
  database: process.env.MYSQL_DATABASE,
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  port: process.env.MYSQL_PORT
});

// Conexión a la base de datos
db.connect((err) => {
  if (err) {
    console.error('Error conectando a la base de datos:', err);
    return;
  }
  console.log('Conectado a MySQL en Railway');
});

// Middleware para verificar JWT
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ error: 'Token no proporcionado' });

  try {
    const decoded = jwt.verify(token.split(' ')[1], 'tu_secreto_jwt');
    req.userId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

// Ruta de registro
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar usuario
    db.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword],
      (error, results) => {
        if (error) {
          if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'El email ya está registrado' });
          }
          return res.status(500).json({ error: 'Error en el servidor' });
        }

        res.json({ message: 'Usuario registrado exitosamente' });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Ruta de login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  db.query(
    'SELECT * FROM users WHERE email = ?',
    [email],
    async (error, results) => {
      if (error) {
        return res.status(500).json({ error: 'Error en el servidor' });
      }

      if (results.length === 0) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      const user = results[0];

      // Verificar contraseña
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      // Generar JWT
      const token = jwt.sign({ id: user.id }, 'tu_secreto_jwt', { expiresIn: '1h' });

      res.json({ token, userId: user.id });
    }
  );
});

// Ruta protegida de ejemplo
app.get('/api/profile', verifyToken, (req, res) => {
  db.query(
    'SELECT id, email, created_at FROM users WHERE id = ?',
    [req.userId],
    (error, results) => {
      if (error) {
        return res.status(500).json({ error: 'Error en el servidor' });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      res.json(results[0]);
    }
  );
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});