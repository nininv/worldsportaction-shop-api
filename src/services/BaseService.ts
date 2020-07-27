import { Service } from "typedi";
import { BaseEntity, getConnection, EntityManager } from "typeorm"
import { InjectManager } from "typeorm-typedi-extensions"

export interface RelationObj {
    model: string,
    property: string
}

export interface PaginationData {
    limit: number;
    offset: number;
}

@Service()
export default abstract class BaseService<T extends BaseEntity> {

    @InjectManager()
    protected entityManager: EntityManager;

    abstract modelName(): string;

    public async findById(id: number): Promise<T> {
        return this.entityManager.findOne(this.modelName(), id);
    }

    public async addToRelation<I>(relationObj: RelationObj, id: number, item: I) {
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

    public async deleteToRelation(relationObj: RelationObj, id: number) {
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
