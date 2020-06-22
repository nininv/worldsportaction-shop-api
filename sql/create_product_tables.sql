USE wsa_shop;

CREATE TABLE product(
    id int(11) unsigned not null AUTO_INCREMENT,
    productName varchar(255) not null,
    description text(550),
    affiliates varchar(255),
    image text(5000),
    price float(2) not null default 0,
    cost float(2) not null default 0,
    tax int(20),
    invetoryTracking bool not null default 0,
    barcode varchar(255),
    SKU varchar(255),
    quantity int(5) not null default 0,
    deliveryType enum('shipping', 'pickup'),
    width  float(2),
    length float(2),
    height float(2),
    weight float(2),
    PRIMARY KEY(id)
);

CREATE TABLE type(
    id int(11) unsigned not null AUTO_INCREMENT,
    typeName varchar(255),
    PRIMARY KEY(id)
);

CREATE TABLE product_types_type(
    productId int(11) unsigned not null,
    typeId int(11) unsigned not null,
    FOREIGN KEY (productId)
    REFERENCES wsa_shop.product (id),
    FOREIGN KEY (typeId)
    REFERENCES wsa_shop.type (id)
);

CREATE TABLE variant(
    id int(11) unsigned not null AUTO_INCREMENT,
    name varchar(255),
    productId int(11) unsigned,
    PRIMARY KEY(id),
    CONSTRAINT FK_product_id FOREIGN KEY (productId)
    REFERENCES wsa_shop.product (id)
);

CREATE TABLE variantOption(
    id int(11) unsigned not null AUTO_INCREMENT,
    optionName varchar(255),
    price float(2) not null default 0,
    barcode varchar(255),
    SKU varchar(255),
    quantity int(5) not null default 0,
    variantId int(11) unsigned,
    PRIMARY KEY(id),
    CONSTRAINT FK_variant_id FOREIGN KEY (variantId)
    REFERENCES wsa_shop.variant (id)
);
