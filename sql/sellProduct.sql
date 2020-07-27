USE wsa_shop;

create table `sellProduct`(
	`id` int(11) unsigned not null AUTO_INCREMENT,
    `productId` int(11) unsigned,
    `orderId` int(11) unsigned,
    `cartId` int(11) unsigned,
    `quantity` int(5) not null default 0,
    `skuId` int(11) unsigned,
    `createdBy` int(11) default 0,
    `createdOn` DATETIME,
    `updatedBy` int(11) default 0,
    `updatedOn` DATETIME,
    `isDeleted` tinyint(1) NOT NULL DEFAULT '0',
	PRIMARY KEY(id),
    CONSTRAINT FK_sellProduct_product_id  FOREIGN KEY (productId)
    REFERENCES wsa_shop.product (id),
	CONSTRAINT FK_sellProduct_order_id  FOREIGN KEY (orderId)
    REFERENCES wsa_shop.order (id),
    CONSTRAINT FK_sellProduct_sku_id  FOREIGN KEY (skuId)
    REFERENCES wsa_shop.SKU (id)
);
CREATE TABLE IF NOT EXISTS `cart`(
    `id` int(11) unsigned not null AUTO_INCREMENT,
    `createdBy` int(11) default 0,
    `createdOn` DATETIME,
    `updatedBy` int(11) default 0,
    `updatedOn` DATETIME,
    `isDeleted` tinyint(1) NOT NULL DEFAULT '0',
    PRIMARY KEY(id)
);
CREATE TABLE IF NOT EXISTS order(
    `id` int(11) unsigned not null AUTO_INCREMENT,
    `pickUpAddressId` int(11) unsigned,
    `productsCount` int(11),
    `paymentMethod` varchar(255),
    `paymentStatus` varchar(255),
    `fulfilmentStatus` varchar(255),
    `refundedAmount` int(11),
    `total` int(11),
    `organisationId` int(11),
    `userId` int(11) default null,
    `deliveryType` enum('shipping','pickup') DEFAULT NULL,
    `phone` varchar(255),
    `email` varchar(255),
    `address` varchar(255),
    `suburb` varchar(255),
    `state` varchar(255),
    `postcode` int(11),
    `createdBy` int(11) default 0,
    `createdOn` DATETIME,
    `updatedBy` int(11) default 0,
    `updatedOn` DATETIME,
    `isDeleted` tinyint(1) NOT NULL DEFAULT '0',
    PRIMARY KEY(id)
    CONSTRAINT FK_order_user_id  FOREIGN KEY (userId)
    REFERENCES wsa_users.user (id)
);