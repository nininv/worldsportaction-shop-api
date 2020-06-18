USE wsa_shop;

CREATE TABLE `product` (
  `id` int NOT NULL AUTO_INCREMENT,
  `description` varchar(255) DEFAULT NULL,
  `productName` varchar(255) NOT NULL,
  `affiliates` varchar(255) DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `price` int DEFAULT 0,
  `cost` int DEFAULT 0,
  `tax` int DEFAULT NULL,
  `invetoryTracking` bit DEFAULT NULL,
  `barcode` varchar(512) DEFAULT NULL,
  `SKU` varchar(512) DEFAULT NULL,
  `quantity` int DEFAULT NULL,
  `deliveryId` int DEFAULT NULL,
  `typeId` int DEFAULT NULL,
  `width` int DEFAULT NULL,
  `length` int DEFAULT NULL,
  `height` int DEFAULT NULL,
  `weight` int DEFAULT NULL,
  `variantName` varchar(512) DEFAULT NULL,
  `variantOption` int DEFAULT NULL,
  PRIMARY KEY (`id`)
);


CREATE TABLE `type` (
  `id` int NOT NULL AUTO_INCREMENT,
  `typeName` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE `variantOption` (
  `id` int NOT NULL AUTO_INCREMENT,
  `optionName` varchar(255) NOT NULL,
  `price` int DEFAULT 0,
  `SKU` varchar(512) DEFAULT NULL,
  `barcode` varchar(512) DEFAULT NULL,
  `quantity` int DEFAULT NULL,
  PRIMARY KEY (`id`)
);