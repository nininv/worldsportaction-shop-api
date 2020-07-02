USE wsa_shop;

CREATE TABLE IF NOT EXISTS orders(
    id int(11) unsigned not null AUTO_INCREMENT,
    name varchar(255),
    products int(11),
    paymentStatus varchar(255),
    fulfilmentStatus varchar(255),
    total int(11),
    createdBy int(11) default 0,
    createdOn DATETIME,
    updatedBy int(11) default 0,
    updatedOn DATETIME,
    isDeleted tinyint(1) NOT NULL DEFAULT '0',
    PRIMARY KEY(id)
);