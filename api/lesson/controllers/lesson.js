'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const customizeEntityValue = (entity) => {
    if(entity["user_progresses"].length>0){
        entity.finished = true;
    } else {
        entity.finished = false;
    }
    delete entity["user_progresses"];
    return entity;
}

module.exports = {
    async findOne(ctx) {
        const { id } = ctx.params;
        const entity = await strapi.services.lesson.findOne({ id });
        const customizedEntity = customizeEntityValue(entity);
        return customizedEntity;
    },
    async findOneUnpublished(ctx) {
        const { id } = ctx.params;
        let result = await strapi.query('lesson').findOne({id});
        return customizeEntityValue(result);
    },
};
