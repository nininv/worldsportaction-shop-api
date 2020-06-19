require("dotenv").config();
import {
    Connection,
    createConnections,
    DefaultNamingStrategy,
    useContainer
} from "typeorm";
import { Container } from "typedi";
import { snakeCase } from "typeorm/util/StringUtils";

async function connect(): Promise<Connection[]> {
    const products_db = Object.assign({
        type: "mysql",

        host: process.env.MYSQL_HOST,
        port: process.env.MYSQL_PORT,
        username: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,

        // synchronize: true,
        entities: [
            __dirname + "/models/*"
        ],
        namingStrategy: new NamingStrategy(),
        logging: "all",
        logger: "simple-console"
    });
    useContainer(Container);
    const connection: Connection[] = await createConnections([products_db]);
    return connection;
}

class NamingStrategy extends DefaultNamingStrategy {
    columnName(
        propertyName: string,
        customName: string,
        embeddedPrefixes: string[]
    ): string {
        if (embeddedPrefixes.length) {
            return (
                snakeCase(embeddedPrefixes.join("_")) +
                (customName ? snakeCase(customName) : snakeCase(propertyName))
            );
        }
        return customName ? customName : propertyName;
    }
}

export { connect };