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
    createdBy int(11) default 0,
    createdOn DATETIME,
    updatedBy int(11) default 0,
    updatedOn DATETIME,
    isDeleted tinyint(1) NOT NULL DEFAULT '0',
    PRIMARY KEY(id)
);

CREATE TABLE IF NOT EXISTS product_orders_orders(
    productId int(11) unsigned not null ,
    ordersId int(11) unsigned not null,
    CONSTRAINT FK_product_id  FOREIGN KEY (productId)
    REFERENCES wsa_shop.product (id),
    CONSTRAINT FK_orders_id  FOREIGN KEY (ordersId)
    REFERENCES wsa_shop.orders (id)
);

CREATE TABLE IF NOT EXISTS orders_products_product(
    ordersId int(11) unsigned not null,
    productId int(11) unsigned not null ,
    CONSTRAINT FK_orders_orders_id  FOREIGN KEY (ordersId)
    REFERENCES wsa_shop.orders (id),
    CONSTRAINT FK_orders_product_id  FOREIGN KEY (productId)
    REFERENCES wsa_shop.product (id)
);