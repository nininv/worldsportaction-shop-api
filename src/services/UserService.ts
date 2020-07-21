import { Service } from "typedi";
import { User } from "../models/User";
import BaseService from "./BaseService";

@Service()
export default class UserService extends BaseService<User> {

    modelName(): string {
        return User.name;
    }

    public async findByCredentials(email: string, password: string): Promise<any> {
        const user = await this.entityManager.query(`SELECT *
        FROM wsa_users.user 
        WHERE email = ? AND password = ?`,
            [email, password]);
        return JSON.stringify(user[0])
    }

    public async findUserById(userId: number): Promise<User> {
        const user = await this.entityManager.query(`SELECT *
        FROM wsa_users.user 
        WHERE id = ?`,
            [userId]);
        return user[0];
    }

}
