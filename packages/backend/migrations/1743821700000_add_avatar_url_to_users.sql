-- Migration to add avatar_url to usuarios table
-- Timestamp: 1743821700000 (aproximado)

ALTER TABLE usuarios
ADD COLUMN avatar_url VARCHAR(255) NULL;

COMMENT ON COLUMN usuarios.avatar_url IS 'URL o ruta del archivo del avatar del usuario.';