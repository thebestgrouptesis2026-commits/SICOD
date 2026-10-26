-- SICOD · Sistema Inteligente de Cotización y Disponibilidad
-- Esquema + vistas de indicadores + datos base (parámetros, 3 cuentas, proyecto de ejemplo).
-- Importar en phpMyAdmin sobre una base vacía "sicod" (utf8mb4_unicode_ci).
-- Las cuentas tienen la contraseña inicial sicod2026 y deben cambiarla en el primer ingreso.
-- Equivale a: php artisan migrate --seed

/*M!999999\- enable the sandbox mode */ 

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `atenciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `atenciones` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `codigo` varchar(20) NOT NULL,
  `cliente_id` bigint(20) unsigned DEFAULT NULL,
  `asesor_id` bigint(20) unsigned DEFAULT NULL,
  `proyecto_id` bigint(20) unsigned DEFAULT NULL,
  `canal` enum('whatsapp','llamada','presencial','facebook','instagram','web','referido','otro') NOT NULL DEFAULT 'web',
  `fase` enum('pretest','postest') NOT NULL DEFAULT 'postest',
  `origen` enum('manual','sistema') NOT NULL DEFAULT 'sistema',
  `inicio_at` timestamp NOT NULL,
  `fin_at` timestamp NULL DEFAULT NULL,
  `sla_minutos` smallint(5) unsigned NOT NULL DEFAULT 30,
  `duracion_seg` int(10) unsigned DEFAULT NULL,
  `duracion_min` decimal(10,2) DEFAULT NULL,
  `cumple_sla` tinyint(1) DEFAULT NULL,
  `genero_cotizacion` tinyint(1) NOT NULL DEFAULT 0,
  `agendo_visita` tinyint(1) NOT NULL DEFAULT 0,
  `session_token` varchar(64) DEFAULT NULL COMMENT 'Vincula la atencion con la sesion anonima del cliente en el cotizador publico',
  `observacion` varchar(191) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `atenciones_codigo_unique` (`codigo`),
  KEY `atenciones_cliente_id_foreign` (`cliente_id`),
  KEY `atenciones_asesor_id_foreign` (`asesor_id`),
  KEY `atenciones_proyecto_id_foreign` (`proyecto_id`),
  KEY `atenciones_fase_index` (`fase`),
  KEY `atenciones_inicio_at_index` (`inicio_at`),
  KEY `atenciones_session_token_index` (`session_token`),
  CONSTRAINT `atenciones_asesor_id_foreign` FOREIGN KEY (`asesor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `atenciones_cliente_id_foreign` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `atenciones_proyecto_id_foreign` FOREIGN KEY (`proyecto_id`) REFERENCES `proyectos` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `atenciones` DISABLE KEYS */;
/*!40000 ALTER TABLE `atenciones` ENABLE KEYS */;
DROP TABLE IF EXISTS `auditoria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `auditoria` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `evento` varchar(60) NOT NULL,
  `descripcion` varchar(191) NOT NULL,
  `entidad_tipo` varchar(60) DEFAULT NULL,
  `entidad_id` bigint(20) unsigned DEFAULT NULL,
  `datos` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`datos`)),
  `ip` varchar(45) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `auditoria_user_id_foreign` (`user_id`),
  KEY `auditoria_evento_created_at_index` (`evento`,`created_at`),
  KEY `auditoria_created_at_index` (`created_at`),
  CONSTRAINT `auditoria_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `auditoria` DISABLE KEYS */;
/*!40000 ALTER TABLE `auditoria` ENABLE KEYS */;
DROP TABLE IF EXISTS `clientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `clientes` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `nombres` varchar(191) NOT NULL,
  `apellidos` varchar(191) DEFAULT NULL,
  `tipo_documento` enum('DNI','CE','PAS','RUC') NOT NULL DEFAULT 'DNI',
  `numero_documento` varchar(20) NOT NULL,
  `telefono` varchar(25) NOT NULL,
  `email` varchar(191) DEFAULT NULL,
  `canal_origen` enum('whatsapp','llamada','presencial','facebook','instagram','web','referido','otro') NOT NULL DEFAULT 'web',
  `asesor_id` bigint(20) unsigned DEFAULT NULL,
  `consentimiento_datos` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Ley 29733 de Proteccion de Datos Personales',
  `consentimiento_at` timestamp NULL DEFAULT NULL,
  `notas` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `clientes_tipo_documento_numero_documento_unique` (`tipo_documento`,`numero_documento`),
  KEY `clientes_asesor_id_foreign` (`asesor_id`),
  KEY `clientes_telefono_index` (`telefono`),
  CONSTRAINT `clientes_asesor_id_foreign` FOREIGN KEY (`asesor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `clientes` DISABLE KEYS */;
/*!40000 ALTER TABLE `clientes` ENABLE KEYS */;
DROP TABLE IF EXISTS `cotizaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `cotizaciones` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `codigo` varchar(20) NOT NULL,
  `token_publico` char(40) NOT NULL,
  `atencion_id` bigint(20) unsigned NOT NULL,
  `lote_id` bigint(20) unsigned NOT NULL,
  `cliente_id` bigint(20) unsigned NOT NULL,
  `asesor_id` bigint(20) unsigned DEFAULT NULL,
  `cliente_nombre` varchar(240) NOT NULL,
  `cliente_documento` varchar(20) NOT NULL,
  `cliente_telefono` varchar(25) NOT NULL,
  `cliente_email` varchar(191) DEFAULT NULL,
  `canal` varchar(20) NOT NULL DEFAULT 'web',
  `modalidad_pago` enum('contado','financiado') NOT NULL DEFAULT 'financiado',
  `moneda` char(3) NOT NULL DEFAULT 'USD',
  `tipo_cambio` decimal(8,4) NOT NULL COMMENT 'Soles por dolar usado en esta cotizacion',
  `precio_m2` decimal(12,2) NOT NULL,
  `precio_lista` decimal(12,2) NOT NULL,
  `descuento_pct` decimal(5,2) NOT NULL DEFAULT 0.00,
  `descuento_monto` decimal(12,2) NOT NULL DEFAULT 0.00,
  `precio_final` decimal(12,2) NOT NULL,
  `inicial_pct` decimal(5,2) NOT NULL DEFAULT 0.00,
  `inicial_monto` decimal(12,2) NOT NULL DEFAULT 0.00,
  `saldo` decimal(12,2) NOT NULL DEFAULT 0.00,
  `plazo_meses` smallint(5) unsigned NOT NULL DEFAULT 0,
  `tasa_anual_pct` decimal(6,3) NOT NULL DEFAULT 0.000,
  `cuota_mensual` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total_financiado` decimal(12,2) NOT NULL DEFAULT 0.00,
  `estado` enum('emitida','aceptada','rechazada','vencida') NOT NULL DEFAULT 'emitida',
  `valida_hasta` date DEFAULT NULL,
  `pdf_path` varchar(191) DEFAULT NULL,
  `emitida_at` timestamp NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cotizaciones_codigo_unique` (`codigo`),
  UNIQUE KEY `cotizaciones_token_publico_unique` (`token_publico`),
  KEY `cotizaciones_atencion_id_foreign` (`atencion_id`),
  KEY `cotizaciones_lote_id_foreign` (`lote_id`),
  KEY `cotizaciones_cliente_id_foreign` (`cliente_id`),
  KEY `cotizaciones_emitida_at_index` (`emitida_at`),
  KEY `cotizaciones_asesor_id_index` (`asesor_id`),
  CONSTRAINT `cotizaciones_asesor_id_foreign` FOREIGN KEY (`asesor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `cotizaciones_atencion_id_foreign` FOREIGN KEY (`atencion_id`) REFERENCES `atenciones` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cotizaciones_cliente_id_foreign` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`),
  CONSTRAINT `cotizaciones_lote_id_foreign` FOREIGN KEY (`lote_id`) REFERENCES `lotes` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `cotizaciones` DISABLE KEYS */;
/*!40000 ALTER TABLE `cotizaciones` ENABLE KEYS */;
DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `failed_jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(191) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `failed_jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `failed_jobs` ENABLE KEYS */;
DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(191) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) unsigned NOT NULL,
  `reserved_at` int(10) unsigned DEFAULT NULL,
  `available_at` int(10) unsigned NOT NULL,
  `created_at` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `jobs` ENABLE KEYS */;
DROP TABLE IF EXISTS `lote_historial`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `lote_historial` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `lote_id` bigint(20) unsigned NOT NULL,
  `estado_anterior` varchar(20) DEFAULT NULL,
  `estado_nuevo` varchar(20) NOT NULL,
  `motivo` varchar(191) DEFAULT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `ip` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `lote_historial_user_id_foreign` (`user_id`),
  KEY `lote_historial_lote_id_created_at_index` (`lote_id`,`created_at`),
  CONSTRAINT `lote_historial_lote_id_foreign` FOREIGN KEY (`lote_id`) REFERENCES `lotes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `lote_historial_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `lote_historial` DISABLE KEYS */;
/*!40000 ALTER TABLE `lote_historial` ENABLE KEYS */;
DROP TABLE IF EXISTS `lotes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `lotes` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `manzana_id` bigint(20) unsigned NOT NULL,
  `codigo` varchar(20) NOT NULL,
  `frente_m` decimal(6,2) NOT NULL,
  `fondo_m` decimal(6,2) NOT NULL,
  `area_m2` decimal(10,2) NOT NULL,
  `precio_lista` decimal(12,2) DEFAULT NULL COMMENT 'Precio fijo en USD. Si es NULL: area_m2 x precio por m2 del proyecto (interior o esquina)',
  `estado` enum('disponible','reservado','vendido','bloqueado') NOT NULL DEFAULT 'disponible',
  `esquina` tinyint(1) NOT NULL DEFAULT 0,
  `observacion` varchar(191) DEFAULT NULL,
  `geometria` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Poligono SVG: {"points":"x1,y1 x2,y2 ..."}' CHECK (json_valid(`geometria`)),
  `orden` smallint(5) unsigned NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `lotes_manzana_id_codigo_unique` (`manzana_id`,`codigo`),
  KEY `lotes_estado_index` (`estado`),
  CONSTRAINT `lotes_manzana_id_foreign` FOREIGN KEY (`manzana_id`) REFERENCES `manzanas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=65 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `lotes` DISABLE KEYS */;
INSERT INTO `lotes` VALUES
(1,1,'A-01',9.00,16.00,144.00,NULL,'disponible',1,'Esquina · frente a Calle Los Pinos',NULL,1,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(2,1,'A-02',8.00,16.00,128.00,NULL,'disponible',0,'Interior · frente a Calle Los Pinos',NULL,2,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(3,1,'A-03',8.00,16.00,128.00,NULL,'vendido',0,'Interior · frente a Calle Los Pinos',NULL,3,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(4,1,'A-04',8.00,16.00,128.00,NULL,'vendido',0,'Interior · frente a Calle Los Pinos',NULL,4,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(5,1,'A-05',8.00,16.00,128.00,NULL,'disponible',0,'Interior · frente a Calle Los Pinos',NULL,5,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(6,1,'A-06',8.00,16.00,128.00,NULL,'disponible',0,'Interior · frente a Calle Los Pinos',NULL,6,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(7,1,'A-07',8.00,16.00,128.00,NULL,'disponible',0,'Interior · frente a Calle Los Pinos',NULL,7,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(8,1,'A-08',9.00,16.00,144.00,NULL,'disponible',1,'Esquina · frente a Calle Los Pinos',NULL,8,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(9,1,'A-09',9.00,16.00,144.00,NULL,'reservado',1,'Esquina · frente a Calle Las Lomas',NULL,9,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(10,1,'A-10',8.00,16.00,128.00,NULL,'disponible',0,'Interior · frente a Calle Las Lomas',NULL,10,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(11,1,'A-11',8.00,16.00,128.00,NULL,'disponible',0,'Interior · frente a Calle Las Lomas',NULL,11,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(12,1,'A-12',8.00,16.00,128.00,NULL,'vendido',0,'Interior · frente a Calle Las Lomas',NULL,12,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(13,1,'A-13',8.00,16.00,128.00,NULL,'disponible',0,'Interior · frente a Calle Las Lomas',NULL,13,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(14,1,'A-14',8.00,16.00,128.00,NULL,'disponible',0,'Interior · frente a Calle Las Lomas',NULL,14,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(15,1,'A-15',8.00,16.00,128.00,NULL,'disponible',0,'Interior · frente a Calle Las Lomas',NULL,15,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(16,1,'A-16',9.00,16.00,144.00,NULL,'disponible',1,'Esquina · frente a Calle Las Lomas',NULL,16,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(17,2,'B-01',9.00,16.00,144.00,NULL,'vendido',1,'Esquina · frente a Calle Los Pinos',NULL,1,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(18,2,'B-02',8.00,16.00,128.00,NULL,'disponible',0,'Interior · frente a Calle Los Pinos',NULL,2,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(19,2,'B-03',8.00,16.00,128.00,NULL,'disponible',0,'Interior · frente a Calle Los Pinos',NULL,3,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(20,2,'B-04',8.00,16.00,128.00,NULL,'disponible',0,'Interior · frente a Calle Los Pinos',NULL,4,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(21,2,'B-05',8.00,16.00,128.00,NULL,'disponible',0,'Interior · frente a Calle Los Pinos',NULL,5,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(22,2,'B-06',8.00,16.00,128.00,NULL,'vendido',0,'Interior · frente a Calle Los Pinos',NULL,6,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(23,2,'B-07',8.00,16.00,128.00,NULL,'vendido',0,'Interior · frente a Calle Los Pinos',NULL,7,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(24,2,'B-08',9.00,16.00,144.00,NULL,'disponible',1,'Esquina · frente a Calle Los Pinos',NULL,8,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(25,2,'B-09',9.00,16.00,144.00,NULL,'disponible',1,'Esquina · frente a Calle Las Lomas',NULL,9,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(26,2,'B-10',8.00,16.00,128.00,NULL,'disponible',0,'Interior · frente a Calle Las Lomas',NULL,10,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(27,2,'B-11',8.00,16.00,128.00,NULL,'reservado',0,'Interior · frente a Calle Las Lomas',NULL,11,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(28,2,'B-12',8.00,16.00,128.00,NULL,'disponible',0,'Interior · frente a Calle Las Lomas',NULL,12,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(29,2,'B-13',8.00,16.00,128.00,NULL,'disponible',0,'Interior · frente a Calle Las Lomas',NULL,13,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(30,2,'B-14',8.00,16.00,128.00,NULL,'disponible',0,'Interior · frente a Calle Las Lomas',NULL,14,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(31,2,'B-15',8.00,16.00,128.00,NULL,'disponible',0,'Interior · frente a Calle Las Lomas',NULL,15,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(32,2,'B-16',9.00,16.00,144.00,NULL,'disponible',1,'Esquina · frente a Calle Las Lomas',NULL,16,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(33,3,'C-01',9.00,17.50,157.50,NULL,'disponible',1,'Esquina · frente a Calle Los Olivos',NULL,1,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(34,3,'C-02',8.00,17.50,140.00,NULL,'vendido',0,'Interior · frente a Calle Los Olivos',NULL,2,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(35,3,'C-03',8.00,17.50,140.00,NULL,'disponible',0,'Interior · frente a Calle Los Olivos',NULL,3,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(36,3,'C-04',8.00,17.50,140.00,NULL,'disponible',0,'Interior · frente a Calle Los Olivos',NULL,4,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(37,3,'C-05',8.00,17.50,140.00,NULL,'reservado',0,'Interior · frente a Calle Los Olivos',NULL,5,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(38,3,'C-06',8.00,17.50,140.00,NULL,'disponible',0,'Interior · frente a Calle Los Olivos',NULL,6,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(39,3,'C-07',8.00,17.50,140.00,NULL,'disponible',0,'Interior · frente a Calle Los Olivos',NULL,7,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(40,3,'C-08',9.00,17.50,157.50,NULL,'disponible',1,'Esquina · frente a Calle Los Olivos',NULL,8,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(41,3,'C-09',9.00,17.50,157.50,NULL,'disponible',1,'Esquina · frente a Calle Las Retamas',NULL,9,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(42,3,'C-10',8.00,17.50,140.00,NULL,'vendido',0,'Interior · frente a Calle Las Retamas',NULL,10,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(43,3,'C-11',8.00,17.50,140.00,NULL,'vendido',0,'Interior · frente a Calle Las Retamas',NULL,11,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(44,3,'C-12',8.00,17.50,140.00,NULL,'disponible',0,'Interior · frente a Calle Las Retamas',NULL,12,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(45,3,'C-13',8.00,17.50,140.00,NULL,'disponible',0,'Interior · frente a Calle Las Retamas',NULL,13,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(46,3,'C-14',8.00,17.50,140.00,NULL,'disponible',0,'Interior · frente a Calle Las Retamas',NULL,14,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(47,3,'C-15',8.00,17.50,140.00,NULL,'disponible',0,'Interior · frente a Calle Las Retamas',NULL,15,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(48,3,'C-16',9.00,17.50,157.50,NULL,'disponible',1,'Esquina · frente a Calle Las Retamas',NULL,16,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(49,4,'D-01',9.00,17.50,157.50,NULL,'disponible',1,'Esquina · frente a Calle Los Olivos',NULL,1,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(50,4,'D-02',8.00,17.50,140.00,NULL,'reservado',0,'Interior · frente a Calle Los Olivos',NULL,2,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(51,4,'D-03',8.00,17.50,140.00,NULL,'disponible',0,'Interior · frente a Calle Los Olivos',NULL,3,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(52,4,'D-04',8.00,17.50,140.00,NULL,'disponible',0,'Interior · frente a Calle Los Olivos',NULL,4,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(53,4,'D-05',8.00,17.50,140.00,NULL,'vendido',0,'Interior · frente a Calle Los Olivos',NULL,5,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(54,4,'D-06',8.00,17.50,140.00,NULL,'disponible',0,'Interior · frente a Calle Los Olivos',NULL,6,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(55,4,'D-07',8.00,17.50,140.00,NULL,'disponible',0,'Interior · frente a Calle Los Olivos',NULL,7,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(56,4,'D-08',9.00,17.50,157.50,NULL,'reservado',1,'Esquina · frente a Calle Los Olivos',NULL,8,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(57,4,'D-09',9.00,17.50,157.50,NULL,'disponible',1,'Esquina · frente a Calle Las Retamas',NULL,9,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(58,4,'D-10',8.00,17.50,140.00,NULL,'disponible',0,'Interior · frente a Calle Las Retamas',NULL,10,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(59,4,'D-11',8.00,17.50,140.00,NULL,'disponible',0,'Interior · frente a Calle Las Retamas',NULL,11,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(60,4,'D-12',8.00,17.50,140.00,NULL,'disponible',0,'Interior · frente a Calle Las Retamas',NULL,12,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(61,4,'D-13',8.00,17.50,140.00,NULL,'disponible',0,'Interior · frente a Calle Las Retamas',NULL,13,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(62,4,'D-14',8.00,17.50,140.00,NULL,'vendido',0,'Interior · frente a Calle Las Retamas',NULL,14,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(63,4,'D-15',8.00,17.50,140.00,NULL,'disponible',0,'Interior · frente a Calle Las Retamas',NULL,15,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(64,4,'D-16',9.00,17.50,157.50,NULL,'vendido',1,'Esquina · frente a Calle Las Retamas',NULL,16,'2026-10-17 20:16:41','2026-10-17 20:16:41');
/*!40000 ALTER TABLE `lotes` ENABLE KEYS */;
DROP TABLE IF EXISTS `manzanas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `manzanas` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `proyecto_id` bigint(20) unsigned NOT NULL,
  `codigo` varchar(20) NOT NULL,
  `nombre` varchar(60) NOT NULL,
  `orden` smallint(5) unsigned NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `manzanas_proyecto_id_codigo_unique` (`proyecto_id`,`codigo`),
  CONSTRAINT `manzanas_proyecto_id_foreign` FOREIGN KEY (`proyecto_id`) REFERENCES `proyectos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `manzanas` DISABLE KEYS */;
INSERT INTO `manzanas` VALUES
(1,1,'A','Mz. A',1,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(2,1,'B','Mz. B',2,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(3,1,'C','Mz. C',3,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(4,1,'D','Mz. D',4,'2026-10-17 20:16:41','2026-10-17 20:16:41');
/*!40000 ALTER TABLE `manzanas` ENABLE KEYS */;
DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(191) NOT NULL,
  `batch` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES
(1,'0001_01_01_000000_create_users_table',1),
(2,'0001_01_01_000001_create_cache_table',1),
(3,'0001_01_01_000002_create_jobs_table',1),
(4,'2026_01_01_100000_create_parametros_table',1),
(5,'2026_01_01_100100_create_proyectos_table',1),
(6,'2026_01_01_100200_create_lotes_table',1),
(7,'2026_01_01_100300_create_clientes_table',1),
(8,'2026_01_01_100400_create_atenciones_table',1),
(9,'2026_01_01_100500_create_cotizaciones_table',1),
(10,'2026_01_01_100600_create_visitas_table',1),
(11,'2026_01_01_100650_create_auditoria_table',1),
(12,'2026_01_01_100700_create_vistas_indicadores',1);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
DROP TABLE IF EXISTS `parametros`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `parametros` (
  `clave` varchar(60) NOT NULL,
  `valor` text NOT NULL,
  `descripcion` varchar(191) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`clave`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `parametros` DISABLE KEYS */;
INSERT INTO `parametros` VALUES
('descuento_contado_pct','20','Descuento por pago al contado (%)','2026-10-17 20:16:40','2026-10-17 20:16:40'),
('dias_reserva','3','Duración de una reserva de lote, en días','2026-10-17 20:16:40','2026-10-17 20:16:40'),
('dias_validez','7','Vigencia de la proforma, en días','2026-10-17 20:16:40','2026-10-17 20:16:40'),
('plazo_defecto','150','Plazo sugerido al abrir el cotizador','2026-10-17 20:16:40','2026-10-17 20:16:40'),
('plazo_maximo','150','Plazo máximo permitido, en meses','2026-10-17 20:16:40','2026-10-17 20:16:40'),
('plazos_meses','[12,108,120,150]','Plazos que se muestran como opción, en meses','2026-10-17 20:16:40','2026-10-17 20:16:40'),
('sla_minutos','30','Umbral de cumplimiento del tiempo de atención, en minutos (Matriz de Consistencia)','2026-10-17 20:16:40','2026-10-17 20:16:40'),
('tasa_anual_default','0','Tasa efectiva anual. 0 = financiamiento directo sin interés','2026-10-17 20:16:40','2026-10-17 20:16:40'),
('tipo_cambio','3.448','Soles por dólar (venta)','2026-10-17 20:16:40','2026-10-17 20:16:40'),
('tipo_cambio_fecha','2026-10-13','Fecha del tipo de cambio','2026-10-17 20:16:40','2026-10-17 20:16:40');
/*!40000 ALTER TABLE `parametros` ENABLE KEYS */;
DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(191) NOT NULL,
  `token` varchar(191) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
DROP TABLE IF EXISTS `proyectos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `proyectos` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `codigo` varchar(30) NOT NULL,
  `nombre` varchar(191) NOT NULL,
  `ubicacion` varchar(191) DEFAULT NULL,
  `distrito` varchar(80) DEFAULT NULL,
  `provincia` varchar(80) DEFAULT NULL,
  `moneda` char(3) NOT NULL DEFAULT 'USD',
  `precio_m2_interior` decimal(12,2) NOT NULL COMMENT 'Precio por m2 de un lote interior',
  `precio_m2_esquina` decimal(12,2) NOT NULL COMMENT 'Precio por m2 de un lote en esquina',
  `telefono` varchar(25) DEFAULT NULL,
  `whatsapp` varchar(25) DEFAULT NULL,
  `amenidades` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`amenidades`)),
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `proyectos_codigo_unique` (`codigo`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `proyectos` DISABLE KEYS */;
INSERT INTO `proyectos` VALUES
(1,'TAIPE-E1','Proyecto Taipe · Etapa I','Lima, Perú','Lima','Lima','USD',320.00,330.00,'+51 987 654 321','51987654321','{\"agua\":true,\"luz\":true,\"pistas\":true,\"parque\":true}',1,'2026-10-17 20:16:41','2026-10-17 20:16:41');
/*!40000 ALTER TABLE `proyectos` ENABLE KEYS */;
DROP TABLE IF EXISTS `reservas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `reservas` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `lote_id` bigint(20) unsigned NOT NULL,
  `cliente_id` bigint(20) unsigned NOT NULL,
  `cotizacion_id` bigint(20) unsigned DEFAULT NULL,
  `asesor_id` bigint(20) unsigned DEFAULT NULL,
  `monto` decimal(12,2) NOT NULL DEFAULT 0.00,
  `vence_at` timestamp NOT NULL,
  `estado` enum('activa','vencida','liberada','concretada') NOT NULL DEFAULT 'activa',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `reservas_cliente_id_foreign` (`cliente_id`),
  KEY `reservas_cotizacion_id_foreign` (`cotizacion_id`),
  KEY `reservas_asesor_id_foreign` (`asesor_id`),
  KEY `reservas_lote_id_estado_index` (`lote_id`,`estado`),
  CONSTRAINT `reservas_asesor_id_foreign` FOREIGN KEY (`asesor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `reservas_cliente_id_foreign` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`),
  CONSTRAINT `reservas_cotizacion_id_foreign` FOREIGN KEY (`cotizacion_id`) REFERENCES `cotizaciones` (`id`) ON DELETE SET NULL,
  CONSTRAINT `reservas_lote_id_foreign` FOREIGN KEY (`lote_id`) REFERENCES `lotes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `reservas` DISABLE KEYS */;
/*!40000 ALTER TABLE `reservas` ENABLE KEYS */;
DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `nombres` varchar(191) NOT NULL,
  `apellidos` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `telefono` varchar(25) DEFAULT NULL,
  `rol` enum('admin','gerente','asesor') NOT NULL DEFAULT 'asesor',
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `debe_cambiar_password` tinyint(1) NOT NULL DEFAULT 0,
  `password_cambiado_at` timestamp NULL DEFAULT NULL,
  `ultimo_acceso_at` timestamp NULL DEFAULT NULL,
  `ultimo_acceso_ip` varchar(45) DEFAULT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(191) NOT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  KEY `users_rol_index` (`rol`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES
(1,'Marcelo Zacarias','Leguia Medina','admin@taipe.pe','987654320','admin',1,1,NULL,NULL,NULL,NULL,'$2y$12$QT2fR69XAt9RaaYwuGQ03eDgxbmL8O.n6fNReAZ2YeWthOhfrMsCW',NULL,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(2,'Jhon Walter','Mosquera Espinoza','gerencia@taipe.pe','987654321','gerente',1,1,NULL,NULL,NULL,NULL,'$2y$12$Lr7SR0qbsXsnb9iSCYJqo.wQ1xxwoQDil1GDSaVO/OiKj8PbQarHW',NULL,'2026-10-17 20:16:41','2026-10-17 20:16:41'),
(3,'Joseph Piero','Mauricio Quispe','asesor1@taipe.pe','987654322','asesor',1,1,NULL,NULL,NULL,NULL,'$2y$12$kpkselw5OgxuTvD8qrkf4OZrrsGdXjI7o4hGzNno2RDT8xN8P1dlW',NULL,'2026-10-17 20:16:41','2026-10-17 20:16:41');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
DROP TABLE IF EXISTS `v_disponibilidad`;
/*!50001 DROP VIEW IF EXISTS `v_disponibilidad`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
/*!50001 CREATE VIEW `v_disponibilidad` AS SELECT
 1 AS `proyecto_id`,
  1 AS `proyecto`,
  1 AS `total_lotes`,
  1 AS `disponibles`,
  1 AS `reservados`,
  1 AS `vendidos`,
  1 AS `bloqueados`,
  1 AS `pct_vendido`,
  1 AS `valor_inventario_disponible` */;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `v_export_spss`;
/*!50001 DROP VIEW IF EXISTS `v_export_spss`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
/*!50001 CREATE VIEW `v_export_spss` AS SELECT
 1 AS `id_registro`,
  1 AS `fase`,
  1 AS `fase_num`,
  1 AS `origen`,
  1 AS `canal`,
  1 AS `fecha`,
  1 AS `inicio_at`,
  1 AS `fin_at`,
  1 AS `duracion_min`,
  1 AS `sla_minutos`,
  1 AS `cumple_sla`,
  1 AS `agendo_visita`,
  1 AS `genero_cotizacion`,
  1 AS `asesor`,
  1 AS `proyecto`,
  1 AS `cotizacion`,
  1 AS `modalidad_pago`,
  1 AS `plazo_meses`,
  1 AS `precio_final_usd`,
  1 AS `tipo_cambio`,
  1 AS `precio_final_pen` */;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `v_ind_conversion`;
/*!50001 DROP VIEW IF EXISTS `v_ind_conversion`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
/*!50001 CREATE VIEW `v_ind_conversion` AS SELECT
 1 AS `fase`,
  1 AS `atenciones`,
  1 AS `visitas_agendadas`,
  1 AS `tasa_conversion` */;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `v_ind_cumplimiento`;
/*!50001 DROP VIEW IF EXISTS `v_ind_cumplimiento`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
/*!50001 CREATE VIEW `v_ind_cumplimiento` AS SELECT
 1 AS `fase`,
  1 AS `n`,
  1 AS `dentro_sla`,
  1 AS `fuera_sla`,
  1 AS `pct_cumplimiento`,
  1 AS `sla_minutos` */;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `v_ind_tiempo`;
/*!50001 DROP VIEW IF EXISTS `v_ind_tiempo`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
/*!50001 CREATE VIEW `v_ind_tiempo` AS SELECT
 1 AS `fase`,
  1 AS `n`,
  1 AS `media_min`,
  1 AS `desv_est`,
  1 AS `minimo_min`,
  1 AS `maximo_min` */;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `v_kpi_canales`;
/*!50001 DROP VIEW IF EXISTS `v_kpi_canales`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
/*!50001 CREATE VIEW `v_kpi_canales` AS SELECT
 1 AS `canal`,
  1 AS `atenciones`,
  1 AS `tiempo_promedio_min`,
  1 AS `tasa_conversion` */;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `v_kpi_serie_diaria`;
/*!50001 DROP VIEW IF EXISTS `v_kpi_serie_diaria`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
/*!50001 CREATE VIEW `v_kpi_serie_diaria` AS SELECT
 1 AS `fecha`,
  1 AS `fase`,
  1 AS `atenciones`,
  1 AS `tiempo_promedio_min`,
  1 AS `pct_cumplimiento` */;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `v_lotes`;
/*!50001 DROP VIEW IF EXISTS `v_lotes`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
/*!50001 CREATE VIEW `v_lotes` AS SELECT
 1 AS `id`,
  1 AS `lote`,
  1 AS `manzana_id`,
  1 AS `manzana_codigo`,
  1 AS `manzana`,
  1 AS `manzana_orden`,
  1 AS `proyecto_id`,
  1 AS `proyecto`,
  1 AS `moneda`,
  1 AS `frente_m`,
  1 AS `fondo_m`,
  1 AS `area_m2`,
  1 AS `precio_m2`,
  1 AS `precio`,
  1 AS `estado`,
  1 AS `esquina`,
  1 AS `observacion`,
  1 AS `geometria`,
  1 AS `orden`,
  1 AS `updated_at` */;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `visitas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `visitas` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `cliente_id` bigint(20) unsigned NOT NULL,
  `atencion_id` bigint(20) unsigned DEFAULT NULL,
  `cotizacion_id` bigint(20) unsigned DEFAULT NULL,
  `lote_id` bigint(20) unsigned DEFAULT NULL,
  `asesor_id` bigint(20) unsigned DEFAULT NULL,
  `programada_para` timestamp NOT NULL,
  `estado` enum('agendada','realizada','cancelada','no_asistio') NOT NULL DEFAULT 'agendada',
  `notas` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `visitas_cliente_id_foreign` (`cliente_id`),
  KEY `visitas_atencion_id_foreign` (`atencion_id`),
  KEY `visitas_cotizacion_id_foreign` (`cotizacion_id`),
  KEY `visitas_lote_id_foreign` (`lote_id`),
  KEY `visitas_asesor_id_foreign` (`asesor_id`),
  KEY `visitas_programada_para_index` (`programada_para`),
  CONSTRAINT `visitas_asesor_id_foreign` FOREIGN KEY (`asesor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `visitas_atencion_id_foreign` FOREIGN KEY (`atencion_id`) REFERENCES `atenciones` (`id`) ON DELETE SET NULL,
  CONSTRAINT `visitas_cliente_id_foreign` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `visitas_cotizacion_id_foreign` FOREIGN KEY (`cotizacion_id`) REFERENCES `cotizaciones` (`id`) ON DELETE SET NULL,
  CONSTRAINT `visitas_lote_id_foreign` FOREIGN KEY (`lote_id`) REFERENCES `lotes` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `visitas` DISABLE KEYS */;
/*!40000 ALTER TABLE `visitas` ENABLE KEYS */;
/*!50001 DROP VIEW IF EXISTS `v_disponibilidad`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 */
/*!50001 VIEW `v_disponibilidad` AS select `p`.`id` AS `proyecto_id`,`p`.`nombre` AS `proyecto`,count(0) AS `total_lotes`,sum(case when `l`.`estado` = 'disponible' then 1 else 0 end) AS `disponibles`,sum(case when `l`.`estado` = 'reservado' then 1 else 0 end) AS `reservados`,sum(case when `l`.`estado` = 'vendido' then 1 else 0 end) AS `vendidos`,sum(case when `l`.`estado` = 'bloqueado' then 1 else 0 end) AS `bloqueados`,round(100.0 * sum(case when `l`.`estado` = 'vendido' then 1 else 0 end) / count(0),2) AS `pct_vendido`,sum(case when `l`.`estado` = 'disponible' then coalesce(`l`.`precio_lista`,round(`l`.`area_m2` * case when `l`.`esquina` = 1 then `p`.`precio_m2_esquina` else `p`.`precio_m2_interior` end,2)) else 0 end) AS `valor_inventario_disponible` from ((`proyectos` `p` join `manzanas` `m` on(`m`.`proyecto_id` = `p`.`id`)) join `lotes` `l` on(`l`.`manzana_id` = `m`.`id`)) group by `p`.`id`,`p`.`nombre` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `v_export_spss`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 */
/*!50001 VIEW `v_export_spss` AS select `a`.`codigo` AS `id_registro`,`a`.`fase` AS `fase`,case `a`.`fase` when 'pretest' then 1 else 2 end AS `fase_num`,`a`.`origen` AS `origen`,`a`.`canal` AS `canal`,cast(`a`.`inicio_at` as date) AS `fecha`,`a`.`inicio_at` AS `inicio_at`,`a`.`fin_at` AS `fin_at`,`a`.`duracion_min` AS `duracion_min`,`a`.`sla_minutos` AS `sla_minutos`,case when `a`.`cumple_sla` = 1 then 1 else 0 end AS `cumple_sla`,case when `a`.`agendo_visita` = 1 then 1 else 0 end AS `agendo_visita`,case when `a`.`genero_cotizacion` = 1 then 1 else 0 end AS `genero_cotizacion`,coalesce(concat(`u`.`nombres`,' ',`u`.`apellidos`),'Autoservicio') AS `asesor`,`pr`.`nombre` AS `proyecto`,`c`.`codigo` AS `cotizacion`,`c`.`modalidad_pago` AS `modalidad_pago`,`c`.`plazo_meses` AS `plazo_meses`,`c`.`precio_final` AS `precio_final_usd`,`c`.`tipo_cambio` AS `tipo_cambio`,round(`c`.`precio_final` * `c`.`tipo_cambio`,2) AS `precio_final_pen` from (((`atenciones` `a` left join `users` `u` on(`u`.`id` = `a`.`asesor_id`)) left join `proyectos` `pr` on(`pr`.`id` = `a`.`proyecto_id`)) left join `cotizaciones` `c` on(`c`.`atencion_id` = `a`.`id`)) where `a`.`fin_at` is not null */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `v_ind_conversion`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 */
/*!50001 VIEW `v_ind_conversion` AS select `atenciones`.`fase` AS `fase`,count(0) AS `atenciones`,sum(case when `atenciones`.`agendo_visita` = 1 then 1 else 0 end) AS `visitas_agendadas`,round(100.0 * sum(case when `atenciones`.`agendo_visita` = 1 then 1 else 0 end) / count(0),2) AS `tasa_conversion` from `atenciones` where `atenciones`.`fin_at` is not null group by `atenciones`.`fase` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `v_ind_cumplimiento`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 */
/*!50001 VIEW `v_ind_cumplimiento` AS select `atenciones`.`fase` AS `fase`,count(0) AS `n`,sum(case when `atenciones`.`cumple_sla` = 1 then 1 else 0 end) AS `dentro_sla`,sum(case when `atenciones`.`cumple_sla` = 0 then 1 else 0 end) AS `fuera_sla`,round(100.0 * sum(case when `atenciones`.`cumple_sla` = 1 then 1 else 0 end) / count(0),2) AS `pct_cumplimiento`,max(`atenciones`.`sla_minutos`) AS `sla_minutos` from `atenciones` where `atenciones`.`fin_at` is not null group by `atenciones`.`fase` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `v_ind_tiempo`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 */
/*!50001 VIEW `v_ind_tiempo` AS select `atenciones`.`fase` AS `fase`,count(0) AS `n`,round(avg(`atenciones`.`duracion_min`),2) AS `media_min`,round(stddev_samp(`atenciones`.`duracion_min`),2) AS `desv_est`,round(min(`atenciones`.`duracion_min`),2) AS `minimo_min`,round(max(`atenciones`.`duracion_min`),2) AS `maximo_min` from `atenciones` where `atenciones`.`fin_at` is not null group by `atenciones`.`fase` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `v_kpi_canales`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 */
/*!50001 VIEW `v_kpi_canales` AS select `atenciones`.`canal` AS `canal`,count(0) AS `atenciones`,round(avg(`atenciones`.`duracion_min`),2) AS `tiempo_promedio_min`,round(100.0 * sum(case when `atenciones`.`agendo_visita` = 1 then 1 else 0 end) / count(0),2) AS `tasa_conversion` from `atenciones` where `atenciones`.`fin_at` is not null and `atenciones`.`fase` = 'postest' group by `atenciones`.`canal` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `v_kpi_serie_diaria`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 */
/*!50001 VIEW `v_kpi_serie_diaria` AS select cast(`atenciones`.`inicio_at` as date) AS `fecha`,`atenciones`.`fase` AS `fase`,count(0) AS `atenciones`,round(avg(`atenciones`.`duracion_min`),2) AS `tiempo_promedio_min`,round(100.0 * sum(case when `atenciones`.`cumple_sla` = 1 then 1 else 0 end) / count(0),2) AS `pct_cumplimiento` from `atenciones` where `atenciones`.`fin_at` is not null group by cast(`atenciones`.`inicio_at` as date),`atenciones`.`fase` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `v_lotes`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 */
/*!50001 VIEW `v_lotes` AS select `l`.`id` AS `id`,`l`.`codigo` AS `lote`,`m`.`id` AS `manzana_id`,`m`.`codigo` AS `manzana_codigo`,`m`.`nombre` AS `manzana`,`m`.`orden` AS `manzana_orden`,`p`.`id` AS `proyecto_id`,`p`.`nombre` AS `proyecto`,`p`.`moneda` AS `moneda`,`l`.`frente_m` AS `frente_m`,`l`.`fondo_m` AS `fondo_m`,`l`.`area_m2` AS `area_m2`,case when `l`.`esquina` = 1 then `p`.`precio_m2_esquina` else `p`.`precio_m2_interior` end AS `precio_m2`,coalesce(`l`.`precio_lista`,round(`l`.`area_m2` * case when `l`.`esquina` = 1 then `p`.`precio_m2_esquina` else `p`.`precio_m2_interior` end,2)) AS `precio`,`l`.`estado` AS `estado`,`l`.`esquina` AS `esquina`,`l`.`observacion` AS `observacion`,`l`.`geometria` AS `geometria`,`l`.`orden` AS `orden`,`l`.`updated_at` AS `updated_at` from ((`lotes` `l` join `manzanas` `m` on(`m`.`id` = `l`.`manzana_id`)) join `proyectos` `p` on(`p`.`id` = `m`.`proyecto_id`)) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

/*M!999999\- enable the sandbox mode */ 

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` varchar(191) NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

/*M!999999\- enable the sandbox mode */ 

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache` (
  `key` varchar(191) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

/*M!999999\- enable the sandbox mode */ 

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `cache_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache_locks` (
  `key` varchar(191) NOT NULL,
  `owner` varchar(191) NOT NULL,
  `expiration` int(11) NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

