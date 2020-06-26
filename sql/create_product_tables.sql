USE wsa_shop;

CREATE TABLE product(
    id int(11) unsigned not null AUTO_INCREMENT,
    productName varchar(255) not null,
    description text(550),
    pickUpAddressAddress varchar(255),
    pickUpAddressSuburb varchar(255),
    pickUpAddressPostcode int,
    pickUpAddressState varchar(255),
    price float(2) not null default 0,
    cost float(2) not null default 0,
    tax int(20),
    inventoryTracking bool not null default 0,
    barcode varchar(255),
    SKU varchar(255),
    quantity int(5) not null default 0,
    deliveryType enum('shipping', 'pickup'),
    width  float(2),
    length float(2),
    height float(2),
    weight float(2),
    affiliatesDirect tinyInt(1),
    affiliatesFirstLevel tinyInt(1),
    affiliatesSecondLevel tinyInt(1),
    createByOrg int(11) unsigned,
    createdBy int(11),
    createdOn DATETIME,
    updatedBy int(11),
    updatedOn DATETIME,
    PRIMARY KEY(id)
);

CREATE TABLE type(
    id int(11) unsigned not null AUTO_INCREMENT,
    typeName varchar(255),
    createdBy int(11),
    createdOn DATETIME,
    updatedBy int(11),
    updatedOn DATETIME,
    PRIMARY KEY(id)
);

CREATE TABLE productTypes(
    productId int(11) unsigned not null,
    typeId int(11) unsigned not null,
    FOREIGN KEY (productId)
    REFERENCES wsa_shop.product (id),
    FOREIGN KEY (typeId)
    REFERENCES wsa_shop.type (id)
);

CREATE TABLE images(
    id int(11) unsigned not null AUTO_INCREMENT,
    url text(5000),
    productId int(11) unsigned not null,
    createdBy int(11),
    createdOn DATETIME,
    updatedBy int(11),
    updatedOn DATETIME,
    PRIMARY KEY(id)
);

CREATE TABLE variant(
    id int(11) unsigned not null AUTO_INCREMENT,
    name varchar(255),
    createdBy int(11),
    createdOn DATETIME,
    updatedBy int(11),
    updatedOn DATETIME,
    PRIMARY KEY(id)
);

CREATE TABLE variantOption(
    id int(11) unsigned not null AUTO_INCREMENT,
    optionName varchar(255),
    createAt varchar(25),
    variantId int(11) unsigned,
    createdBy int(11),
    createdOn DATETIME,
    updatedBy int(11),
    updatedOn DATETIME,
    PRIMARY KEY(id), 
    CONSTRAINT FK_variant_id FOREIGN KEY (variantId)
    REFERENCES wsa_shop.variant (id)
);

CREATE TABLE productVariantOption(
    id int(11) unsigned not null AUTO_INCREMENT,
    price float(2) not null default 0,
    barcode varchar(255),
    SKU varchar(255),
    quantity int(5) not null default 0,
    variantOptionId int(11) unsigned,
    productId int(11) unsigned,
    createdBy int(11),
    createdOn DATETIME,
    updatedBy int(11),
    updatedOn DATETIME,
    PRIMARY KEY(id), 
    CONSTRAINT FK_product_id FOREIGN KEY (productId)
    REFERENCES wsa_shop.product (id),
    CONSTRAINT FK_variant_option_id FOREIGN KEY (variantOptionId)
    REFERENCES wsa_shop.variantOption (id)
);
