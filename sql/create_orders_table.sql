USE wsa_shop;

CREATE TABLE IF NOT EXISTS orders(
    id int(11) unsigned not null AUTO_INCREMENT,
    name varchar(255),
    productsCount int(11),
    paymentMethod varchar(255),
    paymentStatus varchar(255),
    fulfilmentStatus varchar(255),
    refundedAmount int(11),
    total int(11),
    organisationId int(11),
    postcode int(11),
    userId int(11) default null,
    createdBy int(11) default 0,
    createdOn DATETIME,
    updatedBy int(11) default 0,
    updatedOn DATETIME,
    isDeleted tinyint(1) NOT NULL DEFAULT '0',
    PRIMARY KEY(id),
    CONSTRAINT FK_user_id_orders FOREIGN KEY (userId)
    REFERENCES wsa_users.user (id)
);

CREATE TABLE IF NOT EXISTS orders_sku_sku(
    ordersId int(11) unsigned not null,
    skuId int(11) unsigned not null ,
    CONSTRAINT FK_orders_sku_id  FOREIGN KEY (ordersId)
    REFERENCES wsa_shop.orders (id),
    CONSTRAINT FK_sku_orders_id  FOREIGN KEY (skuId)
    REFERENCES wsa_shop.SKU (id)
);

CREATE TABLE IF NOT EXISTS orders_products_product(
    ordersId int(11) unsigned not null,
    productId int(11) unsigned not null ,
    CONSTRAINT FK_orders_orders_id  FOREIGN KEY (ordersId)
    REFERENCES wsa_shop.orders (id),
    CONSTRAINT FK_orders_product_id  FOREIGN KEY (productId)
    REFERENCES wsa_shop.product (id)
);