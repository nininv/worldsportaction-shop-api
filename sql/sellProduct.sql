USE wsa_shop;

CREATE TABLE IF NOT EXISTS `cart`(
    `id` int(11) unsigned not null AUTO_INCREMENT,
    `createdBy` int(11) default 0,
    `createdOn` DATETIME,
    `updatedBy` int(11) default 0,
    `updatedOn` DATETIME,
    `isDeleted` tinyint(1) NOT NULL DEFAULT '0',
    PRIMARY KEY(id)
);
CREATE TABLE IF NOT EXISTS `order`(
    `id` int(11) unsigned not null AUTO_INCREMENT,
    `pickUpAddressId` int(11) unsigned,
    `orderGroupId` int(11) unsigned,
    `paymentMethod` varchar(255),
    `paymentStatus` varchar(255),
    `fulfilmentStatus` varchar(255),
    `refundedAmount` float(2),
    `total` float(2),
    `organisationId` int(11),
    `userId` int(11) default null,
    `deliveryType` enum('shipping','pickup') DEFAULT NULL,
    `address` varchar(255),
    `suburb` varchar(255),
    `state` varchar(255),
    `postcode` int(11),
    `courierName` varchar(255),
    `courierPriceInsuranceEx` int(11),
    `courierTotal` float(2),
    `courierFee` float(2),
    `courierAppliedGst` float(2),
    `courierInsuredAmount` float(2),
    `courierService` varchar(255),
    `courierTransitTime` varchar(255),
    `courierPickupDate` DATETIME,
    `courierPickupTimeFrom` varchar(255),
    `courierPickupTimeTo` varchar(255),
    `createdBy` int(11) default 0,
    `createdOn` DATETIME,
    `updatedBy` int(11) default 0,
    `updatedOn` DATETIME,
    `isDeleted` tinyint(1) NOT NULL DEFAULT '0',
    PRIMARY KEY(id),
    CONSTRAINT FK_order_user_id  FOREIGN KEY (userId)
    REFERENCES wsa_users.user (id),
    CONSTRAINT FK_order_orderGroup_id  FOREIGN KEY (orderGroupId)
    REFERENCES wsa_shop.orderGroup (id)
);
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
    CONSTRAINT FK_sellProduct_product12_id  FOREIGN KEY (productId)
    REFERENCES wsa_shop.product (id),
	CONSTRAINT FK_sellProduct_order12_id  FOREIGN KEY (orderId)
    REFERENCES wsa_shop.order (id),
    CONSTRAINT FK_sellProduct_sku12_id  FOREIGN KEY (skuId)
    REFERENCES wsa_shop.SKU (id),
    CONSTRAINT FK_sellProduct_cart_id  FOREIGN KEY (cartId)
    REFERENCES wsa_shop.cart (id)

);

CREATE TABLE IF NOT EXISTS `orderGroup`(
    `id` int(11) unsigned not null AUTO_INCREMENT,
    `total` float(2);
    `createdBy` int(11) default 0,
    `createdOn` DATETIME,
    `updatedBy` int(11) default 0,
    `updatedOn` DATETIME,
    `isDeleted` tinyint(1) NOT NULL DEFAULT '0',
    PRIMARY KEY(id)
);

ALTER TABLE `wsa_shop`.`order` ADD COLUMN orderGroupId int(11) unsigned;
ALTER TABLE `wsa_shop`.`order` ADD CONSTRAINT FK_order_orderGroup_id  FOREIGN KEY (orderGroupId)
REFERENCES wsa_shop.orderGroup (id);

ALTER TABLE `wsa_shop`.`order` ADD COLUMN `courierName` varchar(255);
ALTER TABLE `wsa_shop`.`order` ADD COLUMN `courierPriceInsuranceEx` int(11);
ALTER TABLE `wsa_shop`.`order` ADD COLUMN `courierTotal` float(2);
ALTER TABLE `wsa_shop`.`order` ADD COLUMN `courierFee` float(2);
ALTER TABLE `wsa_shop`.`order` ADD COLUMN `courierAppliedGst` float(2);
ALTER TABLE `wsa_shop`.`order` ADD COLUMN `courierInsuredAmount` float(2);
ALTER TABLE `wsa_shop`.`order` ADD COLUMN `courierService` varchar(255);
ALTER TABLE `wsa_shop`.`order` ADD COLUMN `courierPickupDate` DATETIME;
ALTER TABLE `wsa_shop`.`order` ADD COLUMN `courierPickupTimeFrom` varchar(255);
ALTER TABLE `wsa_shop`.`order` ADD COLUMN `courierPickupTimeTo` varchar(255);
ALTER TABLE `wsa_shop`.`order` ADD COLUMN `courierBookingId` int(11);
ALTER TABLE `wsa_shop`.`order` ADD COLUMN `courierTransitTime` varchar(255);