import { Container } from "typedi";
// TypeORM required.
require("dotenv").config();
import "reflect-metadata";
import * as http from 'http';
import { Action, getMetadataArgsStorage, useContainer, useExpressServer } from 'routing-controllers';
import { logger, wrapConsole } from "./logger";
import { connect } from './typeorm';
import express, { Router } from 'express';
import { ErrorHandlerMiddleware } from "./middleware/ErrorHandlerMiddleware";
import { UserRoleEntity } from "./models/security/UserRoleEntity";
import { RoleFunction } from "./models/security/RoleFunction";
import { Function } from "./models/security/Function";
import { validationMetadatasToSchemas } from "class-validator-jsonschema";
import { getFromContainer, MetadataStorage } from "class-validator";
import { routingControllersToSpec } from "routing-controllers-openapi";
import { RequestLogger } from "./middleware/RequestLogger";
import cors from "cors";
import { AuthenticationMiddleware } from "./middleware/AuthenticationMiddleware";
import * as admin from "firebase-admin";


let envPromise = setEnvFromCredentialManager();

envPromise.then(function(){
    wrapConsole();
    start().then(() => {
        logger.info("Application started.");
    }).catch((err) => {
        logger.error("Failed to start application", err);
    });
});


const handleCors = (router: Router) => router.use(cors({ /*credentials: true,*/ origin: true }));

async function start() {
    await connect();
    const app = express();
    useContainer(Container);

    handleCors(app);
    const routingControllersOptions = {
        controllers: [__dirname + "/controller/*"],
    };

    const server = http.createServer(app);

    // Parse class-validator classes into JSON Schema:
    const metadatas = (getFromContainer(MetadataStorage) as any).validationMetadatas;
    const schemas = validationMetadatasToSchemas(metadatas, {
        refPointerPrefix: '#/components/schemas/'
    });

    useExpressServer(app, {
        controllers: [__dirname + "/controller/*"],
        authorizationChecker: async (action: Action, roles: string[]) => {
            try {
                const user = action.request.headers.authorization;
                if (user) {
                    const userId = user.id;
                    if (roles && roles.length > 0) {
                        if (roles.length == 1 && roles.indexOf("spectator") !== -1) {
                            logger.info(`Ignore check role permission for spectator`);
                        } else {
                            let exist = await UserRoleEntity.createQueryBuilder('ure')
                                .select('count(ure.id)', 'count')
                                .innerJoin(RoleFunction, 'rf', 'rf.roleId = ure.roleId')
                                .innerJoin(Function, 'f', 'f.id = rf.functionId')
                                .where('ure.userId = :userId and f.name in (:roles)', { userId, roles })
                                .getRawOne();

                            if (parseInt(exist['count']) <= 0) {
                                return false;
                            }
                        }
                    }
                    // await checkFirebaseUser.call(this, JSON.parse(user), JSON.parse(user)["password"]);

                    action.request.headers.authorization = user;
                }
                return !!user;
            } catch (e) {
                return false;
            }
        },
        defaultErrorHandler: false,
        middlewares: [AuthenticationMiddleware, RequestLogger, ErrorHandlerMiddleware]
    });

    let projId = JSON.parse(process.env.firebaseCertAdminConfig).projectId;
    let cred = admin.credential.cert(JSON.parse(process.env.firebaseCertAdminConfig));

    admin.initializeApp({
        credential: cred,
        databaseURL: `https://${projId}.firebaseio.com`
    });

    app.set('view engine', 'ejs');

    // Parse routing-controllers classes into OpenAPI spec:
    const storage = getMetadataArgsStorage();
    const spec = routingControllersToSpec(storage, routingControllersOptions, {
        components: {
            schemas,
            securitySchemes: {
                basicAuth: {
                    scheme: 'basic',
                    type: 'http'
                }
            }
        },
        info: {
            title: 'WSA API',
            version: '1.0.0'
        }
    });

    // Render spec on root:
    app.get('/api/docs.json', (_req, res) => {
        res.json(spec)
    });

    server.timeout = 300000;
    server.listen(process.env.PORT, () => {
        logger.info(`Server listening on port ${process.env.PORT}`);
    });
}

function setEnvFromCredentialManager(){
    let promise = new Promise(function(resolve, reject) {
        var AWS = require('aws-sdk'),
        region = process.env.REGION,
        secretName = process.env.SECRET_NAME,
        accessKeyId = process.env.ACCESS_KEY_ID,
        secretAccessKey = process.env.SECRET_ACCESS_KEY,
        secret,
        decodedBinarySecret;
    
        var client = new AWS.SecretsManager({
            region: region,
            accessKeyId,
            secretAccessKey
        });
    
        client.getSecretValue({SecretId: secretName}, function(err, data) {
            if (err) {
                console.log("If entry With error" + err);
                reject();
            }
            else {
                if ('SecretString' in data) {
                    secret = data.SecretString;
                    let secretData = JSON.parse(secret)
                    let keys = Object.keys(secretData);
                    for(let key of keys){
                        process.env[key] = secretData[key];
                    }
                   
                } else {
                    let buff = new Buffer(data.SecretBinary, 'base64');
                    decodedBinarySecret = buff.toString('ascii');
                    let secretData = JSON.parse(decodedBinarySecret)
                    let keys = Object.keys(secretData);
                    for(let key of keys){
                        process.env[key] = secretData[key];
                    }
                }
    
                resolve();
            }
        });
    })
    return promise;
}