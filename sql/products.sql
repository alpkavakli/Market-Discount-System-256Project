-- Discount Marketplace - Products Schema
-- Depends on: users.sql (references market_user)

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

-- --------------------------------------------------------

--
-- Table structure for `product`
-- Example: title="Toblerone 100gr", stock=25, normal_price=200.00,
--          discounted_price=120.00, expiration_date='2026-05-22',
--          image_path='products/toblerone_a3f9.jpg'
--

DROP TABLE IF EXISTS `product`;
CREATE TABLE `product` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `market_id` INT NOT NULL,
  `title` VARCHAR(150) COLLATE utf8mb4_turkish_ci NOT NULL,
  `stock` INT UNSIGNED NOT NULL,
  `normal_price` DECIMAL(10, 2) NOT NULL,
  `discounted_price` DECIMAL(10, 2) NOT NULL,
  `expiration_date` DATE NOT NULL,
  `image_path` VARCHAR(255) COLLATE utf8mb4_turkish_ci NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_product_market` (`market_id`),
  KEY `idx_product_expiration` (`expiration_date`),
  KEY `idx_product_title` (`title`),
  CONSTRAINT `fk_product_market`
    FOREIGN KEY (`market_id`)
    REFERENCES `market_user` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `chk_product_prices`
    CHECK (`normal_price` > 0 
           AND `discounted_price` > 0 
           AND `discounted_price` <= `normal_price`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;