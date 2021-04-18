require('dotenv').config();
import { Connection, createConnections, DefaultNamingStrategy, useContainer } from 'typeorm';
import { Container } from 'typedi';
import { camelCase } from 'typeorm/util/StringUtils';
import { capitalizeFirstLetter } from './utils/Utils';

async function connect(): Promise<Connection[]> {
  const products_db = Object.assign({
    type: 'mysql',
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    username: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    entities: [__dirname + '/models/*'],
    namingStrategy: new NamingStrategy(),
    logging: 'all',
    logger: 'simple-console',
  });

  const registrationDatabase = Object.assign({
    name: process.env.MYSQL_DATABASE_REG,
    type: 'mysql',
    database: process.env.MYSQL_DATABASE_REG,
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    username: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    entities: [__dirname + '/models/registrations/*', __dirname + '/models/*'],
    namingStrategy: new NamingStrategy(),
    logging: 'all',
    logger: 'simple-console',
  });

  const usersDatabase = Object.assign({
    type: 'mysql',
    name: process.env.MYSQL_DATABASE_USERS,
    database: process.env.MYSQL_DATABASE_USERS,
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    username: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    entities: [__dirname + '/models/*'],
    namingStrategy: new NamingStrategy(),
    logging: 'all',
    logger: 'simple-console',
  });

  useContainer(Container);
  const connection: Connection[] = await createConnections([
    products_db,
    registrationDatabase,
    usersDatabase,
  ]);
  return connection;
}

class NamingStrategy extends DefaultNamingStrategy {
  columnName(propertyName: string, customName: string, embeddedPrefixes: string[]): string {
    if (embeddedPrefixes.length) {
      return (
        camelCase(embeddedPrefixes.join('')) +
        (customName
          ? camelCase(capitalizeFirstLetter(customName))
          : camelCase(capitalizeFirstLetter(propertyName)))
      );
    }
    return customName ? customName : propertyName;
  }
}

export { connect };
