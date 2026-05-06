
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


DROP TABLE IF EXISTS `MarketUser`;
CREATE TABLE IF NOT EXISTS `MarketUser` ( --Email: “Tok-Market@gmail.com”, Name: “Tok Market”, Password: “1234”, City: “Ankara”, District: “Bilkent”
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(50) COLLATE utf8mb4_turkish_ci NOT NULL,
  `marketName` varchar(50) COLLATE utf8mb4_turkish_ci NOT NULL,
  `password` varchar(100) COLLATE utf8mb4_turkish_ci NOT NULL,
  `city` varchar(50) COLLATE utf8mb4_turkish_ci NOT NULL,
  `district` varchar(50) COLLATE utf8mb4_turkish_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

DROP TABLE IF EXISTS `ConsumerUser`;
CREATE TABLE IF NOT EXISTS `ConsumerUser` ( --Email: “Tok-Market@gmail.com”, Name: “Tok Market”, Password: “1234”, City: “Ankara”, District: “Bilkent”
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(50) COLLATE utf8mb4_turkish_ci NOT NULL,
  `fullName` varchar(100) COLLATE utf8mb4_turkish_ci NOT NULL,
  `password` varchar(100) COLLATE utf8mb4_turkish_ci NOT NULL,
  `city` varchar(50) COLLATE utf8mb4_turkish_ci NOT NULL,
  `district` varchar(50) COLLATE utf8mb4_turkish_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;
--
-- Tablo döküm verisi `Market`
--

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
