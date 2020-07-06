USE wsa_shop;

ALTER TABLE products 
    RENAME invetoryTracking TO inventoryTracking,
    RENAME affiliates_direct TO affiliatesDirect,
    RENAME affiliates_first_level TO affiliatesFirstLevel,
    RENAME affiliates_second_level TO affiliatesSecondLevel;

RENAME TABLE product_types_type TO productTypes;

