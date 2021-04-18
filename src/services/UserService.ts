import { Service } from 'typedi';
import { User } from '../models/User';
import BaseService from './BaseService';

@Service()
export default class UserService extends BaseService<User> {
  modelName(): string {
    return User.name;
  }

  public async findByCredentials(email: string, password: string): Promise<User> {
    return this.entityManager
      .createQueryBuilder(User, 'user')
      .andWhere('LOWER(user.email) = :email and user.password = :password and isDeleted = 0', {
        email: email.toLowerCase(),
        password: password,
      })
      .getOne();
  }

  public async findUserById(userId: number): Promise<User> {
    try {
      const user = await this.entityManager.query(
        `SELECT *
            FROM wsa_users.user 
            WHERE id = ?`,
        [userId],
      );
      return user[0];
    } catch (error) {
      throw error;
    }
  }

  public getParentEmail(email: string): string {
    let parentEmail = email.split('.');
    let parentEmailString = parentEmail[0];
    for (let n = 1; n < parentEmail.length - 1; n++) {
      parentEmailString = parentEmailString + '.' + parentEmail[n];
    }
    return parentEmailString;
  }

  public async updateUser(user: User, createdBy) {
    try {
      user.updatedBy = createdBy;
      user.updatedOn = new Date();
      await this.createOrUpdate(user);
    } catch (error) {
      throw error;
    }
  }
}
