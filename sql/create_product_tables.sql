USE wsa_shop;

CREATE TABLE IF NOT EXISTS product(
    id int(11) unsigned not null AUTO_INCREMENT,
    productName varchar(255) not null,
    typeId int(11) unsigned,
    description text(550),
<<<<<<< HEAD
    image text(5000),
    price float(2) not null default 0,
    cost float(2) not null default 0,
    tax int(20),
    invetoryTracking bool not null default 0,
    barcode varchar(255),
    SKU varchar(255),
    quantity int(5) not null default 0,
=======
    affiliatesDirect tinyInt(1),
    affiliatesFirstLevel tinyInt(1),
    affiliatesSecondLevel tinyInt(1),
    tax int(11) default 0,
    createByOrg int(11) unsigned,
    inventoryTracking tinyInt(1) default 0,
>>>>>>> 6372ef8abd50df4d670aa2df13a9821825921396
    deliveryType enum('shipping', 'pickup'),
    pickUpAddressAddress varchar(255),
    pickUpAddressSuburb varchar(255),
    pickUpAddressPostcode int,
    pickUpAddressState varchar(255),
    availableIfOutOfStock tinyInt(1) default 0,
    width  float(2),
    length float(2),
    height float(2),
    weight float(2),
<<<<<<< HEAD
    affiliates_direct tinyInt(1),
    affiliates_first_level tinyInt(1),
    affiliates_second_level tinyInt(1),
    createByOrg int(11) unsigned,
=======
    createdBy int(11) default 0,
    createdOn DATETIME,
    updatedBy int(11) default 0,
    updatedOn DATETIME,
    isDeleted tinyint(1) NOT NULL DEFAULT '0',
>>>>>>> 6372ef8abd50df4d670aa2df13a9821825921396
    PRIMARY KEY(id)
);
CREATE TABLE IF NOT EXISTS type(
    id int(11) unsigned not null AUTO_INCREMENT,
    typeName varchar(255),
    createdBy int NOT NULL  DEFAULT '0',
    createdOn timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedBy int DEFAULT NULL,
    updatedOn timestamp NULL DEFAULT NULL,
    isDeleted tinyint(1) NOT NULL DEFAULT '0',
    PRIMARY KEY(id)
);
CREATE TABLE IF NOT EXISTS images(
    id int(11) unsigned not null AUTO_INCREMENT,
    url text(5000),
    productId int(11) unsigned,
    createdBy int NOT NULL  DEFAULT '0',
    createdOn timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedBy int DEFAULT NULL,
    updatedOn timestamp NULL DEFAULT NULL,
    isDeleted tinyint(1) NOT NULL DEFAULT '0',
    PRIMARY KEY(id),
    CONSTRAINT FK_product_id_images  FOREIGN KEY (productId)
    REFERENCES wsa_shop.product (id)
);
CREATE TABLE IF NOT EXISTS productVariant(
    id int(11) unsigned not null AUTO_INCREMENT,
    name varchar(255),
    productId int(11) unsigned,
    createdBy int NOT NULL  DEFAULT '0',
    createdOn timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedBy int DEFAULT NULL,
    updatedOn timestamp NULL DEFAULT NULL,
    isDeleted tinyint(1) NOT NULL DEFAULT '0',
    PRIMARY KEY(id),
    CONSTRAINT FK_product_id_variant FOREIGN KEY (productId)
    REFERENCES wsa_shop.product (id)
);
CREATE TABLE productVariantOption(
    id int(11) unsigned not null AUTO_INCREMENT,
    optionName varchar(255),
    sortOrder int,
    variantId int(11) unsigned,
    createdBy int NOT NULL  DEFAULT '0',
    createdOn timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedBy int DEFAULT NULL,
    updatedOn timestamp NULL DEFAULT NULL,
    isDeleted tinyint(1) NOT NULL DEFAULT '0',
    PRIMARY KEY(id),
    CONSTRAINT FK_variant_id FOREIGN KEY (variantId)
    REFERENCES wsa_shop.productVariant (id)
);
CREATE TABLE IF NOT EXISTS SKU(
    id int(11) unsigned not null AUTO_INCREMENT,
    price float(2) not null default 0,
    cost int(11) default 0,
    barcode varchar(255),
    skuCode varchar(255),
    quantity int(5) not null default 0,
    productVariantOptionId int(11) unsigned,
    productId int(11) unsigned,
    createdBy int NOT NULL  DEFAULT '0',
    createdOn timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedBy int DEFAULT NULL,
    updatedOn timestamp NULL DEFAULT NULL,
    isDeleted tinyint(1) NOT NULL DEFAULT '0',
    PRIMARY KEY(id),
    CONSTRAINT FK_product_id_sku FOREIGN KEY (productId)
    REFERENCES wsa_shop.product (id),
    CONSTRAINT FK_product_variant_option_id FOREIGN KEY (productVariantOptionId)
    REFERENCES wsa_shop.productVariantOption (id)
);