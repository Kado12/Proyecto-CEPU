-- CREATE TABLE IF NOT EXISTS users (
--   id INT AUTO_INCREMENT PRIMARY KEY,
--   email VARCHAR(255) UNIQUE NOT NULL,
--   password VARCHAR(255) NOT NULL,
--   nombre VARCHAR(255) NOT NULL,
--   fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- )
INSERT INTO users (name, email, password)
VALUES ('Admin', 'admin@gmail.com', 'Admin1234')