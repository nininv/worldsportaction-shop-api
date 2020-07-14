import {Inject, Service} from "typedi";
import {BaseEntity, getConnection, EntityManager} from "typeorm"
import {InjectManager} from "typeorm-typedi-extensions"

@Service()
export default abstract class BaseService<T extends BaseEntity> {

    @InjectManager()
    protected entityManager: EntityManager;

    abstract modelName(): string;

    public async findById(id: number): Promise<T> {
        return this.entityManager.findOne(this.modelName(), id);
    }

    public async addToRelation(relationObj: any, id: number, item: any) {
        const { model, property } = relationObj;
        try {
            await getConnection()
                .createQueryBuilder()
                .relation(model, property)
                .of(id)
                .add(item);
        } catch (error) {
            throw error;
        }
    }

    public async deleteToRelation(relationObj: any, id: number, item: any) {
        const { model, property } = relationObj;
        try {
            await getConnection()
                .createQueryBuilder()
                .relation(model, property)
                .of(id)
                .delete();
        } catch (error) {
            throw error;
        }
    }
}
