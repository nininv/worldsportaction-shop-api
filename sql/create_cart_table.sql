USE wsa_shop;

CREATE TABLE IF NOT EXISTS cart(
    id int(11) unsigned not null AUTO_INCREMENT,
    createdBy int(11) default 0,
    createdOn DATETIME,
    updatedBy int(11) default 0,
    updatedOn DATETIME,
    isDeleted tinyint(1) NOT NULL DEFAULT '0',
    PRIMARY KEY(id)
);

CREATE TABLE IF NOT EXISTS product_cart_cart(
    productId int(11) unsigned not null ,
    cartId int(11) unsigned not null,
    CONSTRAINT FK_product_id  FOREIGN KEY (productId)
    REFERENCES wsa_shop.product (id),
    CONSTRAINT FK_cart_id  FOREIGN KEY (cartId)
    REFERENCES wsa_shop.cart (id)
);

CREATE TABLE IF NOT EXISTS cart_products_product(
    cartId int(11) unsigned not null,
    productId int(11) unsigned not null ,
    CONSTRAINT FK_cart_cart_id  FOREIGN KEY (cartId)
    REFERENCES wsa_shop.cart (id),
    CONSTRAINT FK_cart_product_id  FOREIGN KEY (productId)
    REFERENCES wsa_shop.product (id)
);