create table `sellProduct`(
	`id` int(11) unsigned not null AUTO_INCREMENT,
    `productId` int(11) unsigned,
    `orderId` int(11) unsigned,
    `cartId` int(11) unsigned,
    `createdBy` int(11) default 0,
    `createdOn` DATETIME,
    `updatedBy` int(11) default 0,
    `updatedOn` DATETIME,
    `isDeleted` tinyint(1) NOT NULL DEFAULT '0',
	PRIMARY KEY(id),
    CONSTRAINT FK_sellProduct_product_id  FOREIGN KEY (productId)
    REFERENCES wsa_shop.product (id),
	CONSTRAINT FK_sellProduct_orders_id  FOREIGN KEY (orderId)
    REFERENCES wsa_shop.orders (id)
);
alter table wsa_shop.sellProduct add column quantity int(5) not null default 0;
alter table wsa_shop.sellProduct add column cost int(11) default 0;
alter table wsa_shop.sellProduct add column price float(2) not null default 0;