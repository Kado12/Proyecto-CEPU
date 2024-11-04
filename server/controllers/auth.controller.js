const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/database');
const emailService = require('../services/email.service');
const config = require('../config/environment');

// Registro de usuario
const register = async (req, res) => {
  const { name, email, password } = req.body;

  // Validaciones básicas
  if (!name || !email || !password) {
    return res.status(400).json({
      error: 'Todos los campos son requeridos'
    });
  }

  try {
    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Insertar usuario en la base de datos
    db.query(
      'INSERT INTO users (name, email, password, verification_token) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, verificationToken],
      async (error, results) => {
        if (error) {
          if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
              error: 'El email ya está registrado'
            });
          }
          return res.status(500).json({
            error: 'Error en el servidor'
          });
        }

        // Enviar email de verificación
        try {
          await emailService.sendVerificationEmail(email, verificationToken);
          res.json({
            message: 'Usuario registrado. Por favor verifica tu email.'
          });
        } catch (emailError) {
          // Si falla el envío del email, eliminamos el usuario creado
          db.query('DELETE FROM users WHERE email = ?', [email]);
          return res.status(500).json({
            error: 'Error al enviar el email de verificación'
          });
        }
      }
    );
  } catch (error) {
    res.status(500).json({
      error: 'Error en el servidor'
    });
  }
};

// Verificación de email
const verifyEmail = (req, res) => {
  const { token } = req.params;

  db.query(
    'UPDATE users SET verified = TRUE, verification_token = NULL WHERE verification_token = ?',
    [token],
    (error, results) => {
      if (error) {
        return res.status(500).json({
          error: 'Error en el servidor'
        });
      }

      if (results.affectedRows === 0) {
        return res.status(400).json({
          error: 'Token inválido o ya utilizado'
        });
      }

      res.json({
        message: 'Email verificado exitosamente'
      });
    }
  );
};

// Login de usuario
const login = async (req, res) => {
  const { email, password } = req.body;

  // Validaciones básicas
  if (!email || !password) {
    return res.status(400).json({
      error: 'Email y contraseña son requeridos'
    });
  }

  db.query(
    'SELECT * FROM users WHERE email = ?',
    [email],
    async (error, results) => {
      if (error) {
        return res.status(500).json({
          error: 'Error en el servidor'
        });
      }

      if (results.length === 0) {
        return res.status(401).json({
          error: 'Credenciales inválidas'
        });
      }

      const user = results[0];

      if (!user.verified) {
        return res.status(401).json({
          error: 'Por favor verifica tu email primero'
        });
      }

      // Función para verificar si la contraseña está encriptada
      const isPasswordHashed = (password) => {
        return password && password.length === 60; // Longitud esperada para un hash de bcrypt
      };

      let validPassword;

      if (isPasswordHashed(user.password)) {
        // Si la contraseña está encriptada, usar bcrypt para comparar
        validPassword = await bcrypt.compare(password, user.password);
      } else {
        // Si no está encriptada, comparar directamente
        validPassword = password === user.password;

        // Si la contraseña no coincide, devolver un error
        if (!validPassword) {
          return res.status(401).json({
            error: 'Credenciales inválidas'
          });
        }

        // Si la contraseña no está encriptada, encriptarla y actualizarla en la base de datos
        const hashedPassword = await bcrypt.hash(password, 10); // Cambia 10 por el número de rondas deseado
        db.query(
          'UPDATE users SET password = ? WHERE id = ?',
          [hashedPassword, user.id],
          (updateError) => {
            if (updateError) {
              return res.status(500).json({
                error: 'Error al actualizar la contraseña'
              });
            }
          }
        );
      }

      // Generar JWT
      const token = jwt.sign(
        { id: user.id },
        config.app.jwtSecret,
        { expiresIn: '1h' }
      );

      res.json({
        token,
        userId: user.id,
        name: user.name,
        email: user.email
      });
    }
  );
};

// Solicitud de recuperación de contraseña
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      error: 'El email es requerido'
    });
  }

  try {
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hora

    db.query(
      'UPDATE users SET reset_password_token = ?, reset_password_expires = ? WHERE email = ? AND verified = TRUE',
      [resetToken, resetExpires, email],
      async (error, results) => {
        if (error) {
          return res.status(500).json({
            error: 'Error en el servidor'
          });
        }

        if (results.affectedRows === 0) {
          return res.status(404).json({
            error: 'No se encontró una cuenta verificada con este email'
          });
        }

        try {
          await emailService.sendPasswordResetEmail(email, resetToken);
          res.json({
            message: 'Se ha enviado un email para resetear tu contraseña'
          });
        } catch (emailError) {
          return res.status(500).json({
            error: 'Error al enviar el email de recuperación'
          });
        }
      }
    );
  } catch (error) {
    res.status(500).json({
      error: 'Error en el servidor'
    });
  }
};

// Reseteo de contraseña
const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({
      error: 'La nueva contraseña es requerida'
    });
  }

  const now = new Date();

  try {
    // Verificar token y su expiración
    db.query(
      'SELECT * FROM users WHERE reset_password_token = ? AND reset_password_expires > ?',
      [token, now],
      async (error, results) => {
        if (error) {
          return res.status(500).json({
            error: 'Error en el servidor'
          });
        }

        if (results.length === 0) {
          return res.status(400).json({
            error: 'Token inválido o expirado'
          });
        }

        // Encriptar nueva contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Actualizar contraseña y limpiar tokens
        db.query(
          'UPDATE users SET password = ?, reset_password_token = NULL, reset_password_expires = NULL WHERE reset_password_token = ?',
          [hashedPassword, token],
          (error, results) => {
            if (error) {
              return res.status(500).json({
                error: 'Error en el servidor'
              });
            }

            res.json({
              message: 'Contraseña actualizada exitosamente'
            });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({
      error: 'Error en el servidor'
    });
  }
};

// Cambio de contraseña (usuario autenticado)
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      error: 'La contraseña actual y la nueva contraseña son requeridas'
    });
  }

  try {
    // Obtener usuario
    db.query(
      'SELECT * FROM users WHERE id = ?',
      [req.userId],
      async (error, results) => {
        if (error) {
          return res.status(500).json({
            error: 'Error en el servidor'
          });
        }

        const user = results[0];

        // Verificar contraseña actual
        const validPassword = await bcrypt.compare(currentPassword, user.password);
        if (!validPassword) {
          return res.status(401).json({
            error: 'Contraseña actual incorrecta'
          });
        }

        // Encriptar nueva contraseña
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Actualizar contraseña
        db.query(
          'UPDATE users SET password = ? WHERE id = ?',
          [hashedPassword, req.userId],
          (error, results) => {
            if (error) {
              return res.status(500).json({
                error: 'Error en el servidor'
              });
            }

            res.json({
              message: 'Contraseña actualizada exitosamente'
            });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({
      error: 'Error en el servidor'
    });
  }
};

module.exports = {
  register,
  verifyEmail,
  login,
  forgotPassword,
  resetPassword,
  changePassword
};