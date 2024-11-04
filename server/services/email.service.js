const transporter = require('../config/email');
const config = require('../config/environment');

const sendVerificationEmail = async (email, verificationToken) => {
  const verificationUrl = `${config.app.apiUrl}verify/${verificationToken}`;

  const mailOptions = {
    from: config.email.user,
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

const sendPasswordResetEmail = async (email, resetToken) => {
  const resetUrl = `${config.app.apiUrl}reset-password/${resetToken}`;

  const mailOptions = {
    from: config.email.user,
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

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail
};