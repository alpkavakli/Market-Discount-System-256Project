-- Discount Marketplace - Database Schema
-- Users tables (Market & Consumer)

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `discount_marketplace`
--

-- --------------------------------------------------------

--
-- Table structure for `market_user`
-- Example: Email: "Tok-Market@gmail.com", Name: "Tok Market",
--          Password: "1234", City: "Ankara", District: "Bilkent"
--

DROP TABLE IF EXISTS `market_user`;
CREATE TABLE `market_user` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(100) COLLATE utf8mb4_turkish_ci NOT NULL,
  `market_name` VARCHAR(50) COLLATE utf8mb4_turkish_ci NOT NULL,
  `password_hash` CHAR(60) COLLATE utf8mb4_turkish_ci NOT NULL,
  `city` VARCHAR(50) COLLATE utf8mb4_turkish_ci NOT NULL,
  `district` VARCHAR(50) COLLATE utf8mb4_turkish_ci NOT NULL,
  `is_verified` BOOLEAN NOT NULL DEFAULT FALSE,
  `verification_code` VARCHAR(6) DEFAULT NULL,
  `verification_expires` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_market_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- --------------------------------------------------------

--
-- Table structure for `consumer_user`
-- Example: Email: "ali@gmail.com", Full Name: "Ali Yılmaz",
--          Password: "1234", City: "Ankara", District: "Bilkent"
--

DROP TABLE IF EXISTS `consumer_user`;
CREATE TABLE `consumer_user` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(100) COLLATE utf8mb4_turkish_ci NOT NULL,
  `full_name` VARCHAR(100) COLLATE utf8mb4_turkish_ci NOT NULL,
  `password_hash` CHAR(60) COLLATE utf8mb4_turkish_ci NOT NULL,
  `city` VARCHAR(50) COLLATE utf8mb4_turkish_ci NOT NULL,
  `district` VARCHAR(50) COLLATE utf8mb4_turkish_ci NOT NULL,
  `is_verified` BOOLEAN NOT NULL DEFAULT FALSE,
  `verification_code` VARCHAR(6) DEFAULT NULL,
  `verification_expires` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_consumer_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci; --we ain't using myisam cuz we will make it relational.

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;