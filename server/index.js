// Configuración de variables de entorno
const dotenv = require('dotenv')
dotenv.config()

// Configuración del servidor y dependencias
const express = require('express')
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
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

// Configuración de nodemailer
const transporter = nodemailer.createTransport({
  service: process.env.SERVICE,
  auth: {
    user: process.env.EMAIL_APP,
    pass: process.env.PASSWORD_APP
  }
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

// Función para enviar email de verificación
const sendVerificationEmail = async (email, verificationToken) => {
  const verificationUrl = `${process.env.API_URL}verify/${verificationToken}`;

  const mailOptions = {
    from: process.env.EMAIL_APP,
    to: email,
    subject: 'Verifica tu cuenta',
    html: `
      <h1>Verifica tu cuenta</h1>
      <p>Click en el siguiente enlace para verificar tu cuenta:</p>
      <a href="${verificationUrl}">${verificationUrl}</a>
    `
  };

  await transporter.sendMail(mailOptions);
};

// Función para enviar email de reseteo de contraseña
const sendPasswordResetEmail = async (email, resetToken) => {
  const resetUrl = `${process.env.API_URL}reset-password/${resetToken}`;

  const mailOptions = {
    from: process.env.EMAIL_APP,
    to: email,
    subject: 'Reseteo de contraseña',
    html: `
      <h1>Reseteo de contraseña</h1>
      <p>Click en el siguiente enlace para resetear tu contraseña:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>Este enlace expirará en 1 hora.</p>
    `
  };

  await transporter.sendMail(mailOptions);
};

// Ruta de registro
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Insertar usuario
    db.query(
      'INSERT INTO users (name, email, password, verification_token) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, verificationToken],
      async (error, results) => {
        if (error) {
          if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'El email ya está registrado' });
          }
          return res.status(500).json({ error: 'Error en el servidor' });
        }
        await sendVerificationEmail(email, verificationToken)
        res.json({ message: 'Usuario registrado. Por favor verifica tu email.' });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Ruta de verificación de email
app.get('/api/verify/:token', (req, res) => {
  const { token } = req.params;

  db.query(
    'UPDATE users SET verified = TRUE WHERE verification_token = ?',
    [token],
    (error, results) => {
      if (error) {
        return res.status(500).json({ error: 'Error en el servidor' });
      }

      if (results.affectedRows === 0) {
        return res.status(400).json({ error: 'Token inválido' });
      }

      res.json({ message: 'Email verificado exitosamente' });
    }
  );
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

      if (!user.verified) {
        return res.status(401).json({ error: 'Por favor verifica tu email primero' });
      }

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

// Ruta para solicitar cambio de contraseña
app.post('/api/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hora

    db.query(
      'UPDATE users SET reset_password_token = ?, reset_password_expires = ? WHERE email = ?',
      [resetToken, resetExpires, email],
      async (error, results) => {
        if (error) {
          return res.status(500).json({ error: 'Error en el servidor' });
        }

        if (results.affectedRows === 0) {
          return res.status(404).json({ error: 'Email no encontrado' });
        }

        await sendPasswordResetEmail(email, resetToken);
        res.json({ message: 'Se ha enviado un email para resetear tu contraseña' });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Ruta para resetear contraseña
app.post('/api/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  const now = new Date()

  try {
    db.query(
      'SELECT * FROM users WHERE reset_password_token = ? AND reset_password_expires > ?',
      [token, now],
      async (error, results) => {
        if (error) {
          return res.status(500).json({ error: 'Error en el servidor' });
        }
        if (results.length === 0) {
          return res.status(400).json({ error: 'Token inválido o expirado' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        db.query(
          'UPDATE users SET password = ?, reset_password_token = NULL, reset_password_expires = NULL WHERE reset_password_token = ?',
          [hashedPassword, token],
          (error, results) => {
            if (error) {
              return res.status(500).json({ error: 'Error en el servidor' });
            }

            res.json({ message: 'Contraseña actualizada exitosamente' });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Ruta para cambiar contraseña (usuario autenticado)
app.post('/api/change-password', verifyToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    db.query(
      'SELECT * FROM users WHERE id = ?',
      [req.userId],
      async (error, results) => {
        if (error) {
          return res.status(500).json({ error: 'Error en el servidor' });
        }

        const user = results[0];
        const validPassword = await bcrypt.compare(currentPassword, user.password);

        if (!validPassword) {
          return res.status(401).json({ error: 'Contraseña actual incorrecta' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        db.query(
          'UPDATE users SET password = ? WHERE id = ?',
          [hashedPassword, req.userId],
          (error, results) => {
            if (error) {
              return res.status(500).json({ error: 'Error en el servidor' });
            }

            res.json({ message: 'Contraseña actualizada exitosamente' });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
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