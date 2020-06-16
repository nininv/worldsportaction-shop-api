import {Service} from "typedi";
import {User} from "../models/User";
import BaseService from "./BaseService";

@Service()
export default class UserService extends BaseService<User> {

    modelName(): string {
        return User.name;
    }

    public async findByCredentials(email: string, password: string): Promise<User> {
        return this.entityManager.createQueryBuilder(User, 'user')
            .andWhere('LOWER(user.email) = :email and user.password = :password',
                {email: email.toLowerCase(), password: password})
            .getOne();
    }


}
