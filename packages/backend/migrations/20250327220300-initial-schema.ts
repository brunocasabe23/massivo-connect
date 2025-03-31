import { MigrationBuilder } from 'node-pg-migrate';

// Eliminamos la línea de shorthands ya que no la usamos y podría causar problemas
// export const shorthands: ColumnDefinitions | undefined = undefined; 

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Extension para UUID si se necesita (opcional, pero bueno para PKs)
  // pgm.createExtension('uuid-ossp', { ifNotExists: true });

  // Tabla Roles
  pgm.createTable('roles', {
    id: 'id', // Serial PK
    nombre: { type: 'varchar(50)', notNull: true, unique: true }, // 'Administrador', 'Compras', 'Usuario'
    fecha_creacion: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  // Tabla Permisos
  pgm.createTable('permisos', {
    id: 'id',
    clave: { type: 'varchar(100)', notNull: true, unique: true }, // 'crear_oc', 'gestionar_cp'
    descripcion: { type: 'text' },
    fecha_creacion: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  // Tabla Usuarios
  pgm.createTable('usuarios', {
    id: 'id',
    nombre: { type: 'varchar(255)', notNull: true },
    email: { type: 'varchar(255)', notNull: true, unique: true },
    password_hash: { type: 'varchar(255)', notNull: true },
    estado: { type: 'varchar(50)', notNull: true, default: 'activo' }, // 'pendiente', 'activo', 'inactivo'
    avatar_url: { type: 'varchar(512)' },
    preferencias_notificaciones: { type: 'jsonb' },
    reset_password_token: { type: 'varchar(255)' },
    reset_password_expires: { type: 'timestamp' },
    fecha_creacion: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    fecha_actualizacion: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });
  // Trigger para actualizar fecha_actualizacion (opcional pero recomendado)
  pgm.sql(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
       NEW.fecha_actualizacion = now(); 
       RETURN NEW;
    END;
    $$ language 'plpgsql';
  `);
  pgm.sql(`
    CREATE TRIGGER update_usuarios_updated_at
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
  `);

  // Tabla Usuario_Roles (Many-to-Many)
  pgm.createTable('usuario_roles', {
    usuario_id: {
      type: 'integer',
      notNull: true,
      references: 'usuarios(id)',
      onDelete: 'CASCADE', // Si se borra usuario, se borra la relación
    },
    rol_id: {
      type: 'integer',
      notNull: true,
      references: 'roles(id)',
      onDelete: 'CASCADE', // Si se borra rol, se borra la relación
    },
    fecha_asignacion: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });
  // Clave primaria compuesta
  pgm.addConstraint('usuario_roles', 'usuario_roles_pkey', {
    primaryKey: ['usuario_id', 'rol_id'],
  });

  // Tabla Rol_Permisos (Many-to-Many, con flexibilidad)
  pgm.createTable('rol_permisos', {
    rol_id: {
      type: 'integer',
      notNull: true,
      references: 'roles(id)',
      onDelete: 'CASCADE',
    },
    permiso_id: {
      type: 'integer',
      notNull: true,
      references: 'permisos(id)',
      onDelete: 'CASCADE',
    },
    asignado: { type: 'boolean', notNull: true, default: true }, // Permite desactivar permisos sin borrar la fila
  });
  pgm.addConstraint('rol_permisos', 'rol_permisos_pkey', {
    primaryKey: ['rol_id', 'permiso_id'],
  });

  // Tabla Codigos_Presupuestales
  pgm.createTable('codigos_presupuestales', {
    id: 'id',
    nombre: { type: 'varchar(100)', notNull: true, unique: true },
    descripcion: { type: 'text' },
    monto_presupuesto: { type: 'decimal(15, 2)', notNull: true, default: 0.00 },
    fecha_inicio_vigencia: { type: 'date' },
    fecha_fin_vigencia: { type: 'date' },
    fecha_creacion: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    fecha_actualizacion: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });
   pgm.sql(`
    CREATE TRIGGER update_codigos_presupuestales_updated_at
    BEFORE UPDATE ON codigos_presupuestales
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
  `);

  // Tabla Usuario_Codigos_Presupuestales (Many-to-Many)
  pgm.createTable('usuario_codigos_presupuestales', {
     usuario_id: {
      type: 'integer',
      notNull: true,
      references: 'usuarios(id)',
      onDelete: 'CASCADE',
    },
    cp_id: { // cp = codigo presupuestal
      type: 'integer',
      notNull: true,
      references: 'codigos_presupuestales(id)',
      onDelete: 'CASCADE',
    },
     fecha_asignacion: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });
   pgm.addConstraint('usuario_codigos_presupuestales', 'usuario_codigos_presupuestales_pkey', {
    primaryKey: ['usuario_id', 'cp_id'],
  });

  // Tabla Ordenes_Compra
  pgm.createTable('ordenes_compra', {
    id: 'id',
    usuario_id: { // Solicitante
      type: 'integer',
      notNull: true,
      references: 'usuarios(id)',
      // onDelete: 'SET NULL' o 'RESTRICT' podría ser mejor que CASCADE aquí
    },
    cp_id: { // Código presupuestal
      type: 'integer',
      notNull: true,
      references: 'codigos_presupuestales(id)',
      // onDelete: 'RESTRICT' para evitar borrar CP si tiene OCs asociadas
    },
    fecha_creacion: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    descripcion: { type: 'text', notNull: true },
    monto: { type: 'decimal(15, 2)', notNull: true },
    proveedor: { type: 'varchar(255)' },
    estado: { type: 'varchar(50)', notNull: true, default: 'Nueva' }, // 'Nueva', 'EnRevision', 'Aprobada', 'Rechazada', 'Cerrada', 'CierreSolicitado'
    fecha_actualizacion: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    usuario_actualizacion_id: { // Quién hizo el último cambio de estado, etc.
       type: 'integer',
       references: 'usuarios(id)',
       onDelete: 'SET NULL',
    }
  });
   pgm.sql(`
    CREATE TRIGGER update_ordenes_compra_updated_at
    BEFORE UPDATE ON ordenes_compra
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
  `);

  // Tabla Notificaciones
  pgm.createTable('notificaciones', {
    id: 'id',
    usuario_id: { // Destinatario
      type: 'integer',
      notNull: true,
      references: 'usuarios(id)',
      onDelete: 'CASCADE',
    },
    tipo_evento: { type: 'varchar(100)', notNull: true },
    mensaje: { type: 'text', notNull: true },
    leida: { type: 'boolean', notNull: true, default: false },
    fecha_creacion: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    url_relacionada: { type: 'varchar(512)' }, // ej: /ordenes/123
  });
  // Index para buscar notificaciones no leídas por usuario
  pgm.createIndex('notificaciones', ['usuario_id', 'leida']);

}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // Borrar en orden inverso a la creación para respetar dependencias FK

  pgm.dropIndex('notificaciones', ['usuario_id', 'leida']);
  pgm.dropTable('notificaciones');

  pgm.dropTable('ordenes_compra'); // Borra trigger asociado automáticamente? Verificar doc de PG

  pgm.dropTable('usuario_codigos_presupuestales');

  pgm.dropTable('codigos_presupuestales');

  pgm.dropTable('rol_permisos');

  pgm.dropTable('usuario_roles');

  pgm.dropTable('usuarios'); // Borra trigger asociado automáticamente?

  pgm.dropTable('permisos');

  pgm.dropTable('roles');

  // Borrar función de trigger
  pgm.sql('DROP FUNCTION IF EXISTS update_updated_at_column();');

  // Borrar extensión si se creó
  // pgm.dropExtension('uuid-ossp');
}