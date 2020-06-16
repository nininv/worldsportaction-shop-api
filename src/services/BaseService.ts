import {Inject, Service} from "typedi";
import {BaseEntity, DeleteResult, EntityManager} from "typeorm"
import {InjectManager} from "typeorm-typedi-extensions"

@Service()
export default abstract class BaseService<T extends BaseEntity> {

    @InjectManager()
    protected entityManager: EntityManager;

    abstract modelName(): string;

    public async findById(id: number): Promise<T> {
        return this.entityManager.findOne(this.modelName(), id);
    }

}
