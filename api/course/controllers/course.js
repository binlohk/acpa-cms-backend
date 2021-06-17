'use strict';
const { sanitizeEntity } = require('strapi-utils');

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const customizeEntityValue = (entity) => {
    const entityWithoutPrivateField = sanitizeEntity(entity, { model: strapi.models.course });
    return {
        lessonsDetail: entity.lessons.map(lesson => { return { id: lesson.id, title: lesson.title, text: lesson.lessonDescription, finished: false } }),
        courseMaterials: entity.course_materials,
        purchased: false,
        ...entityWithoutPrivateField
    };
}

const checkIfUserFinishedLesson = async (entity, userId) => {
    for (let i = 0; i < entity.lessonsDetail.length; i++) {
        let lessonId = entity.lessonsDetail[i].id;
        const lessonProgressRecord = await strapi.services['user-progress'].findOne({ lesson: lessonId, 'users_permissions_user': userId });
        if (lessonProgressRecord) {
            entity.lessonsDetail[i].finished = true;
        }
    }
}

const checkIfUserPurchasedCourse = async (entity, userId) => {
    const user = await strapi.query('user', 'users-permissions').findOne({ id: userId });
    const userCourses = user.courses;
    const ifUserOwnTargetCourse = userCourses.filter(course => { return (course.id == entity.id) });
    // console.log(ifUserOwnTargetCourse, 'ifUserOwnTargetCourse')
    if (ifUserOwnTargetCourse.length > 0) {
        entity.purchased = true;
    };
}

module.exports = {
    async find(ctx) {
        let entities = await strapi.services.course.find(ctx.query);
        const customizedEntities = entities.map(entity => customizeEntityValue(entity));
        if (ctx.state.user) {
            for (let customizedEntity of customizedEntities) {
                await checkIfUserFinishedLesson(customizedEntity, ctx.state.user.id);
                await checkIfUserPurchasedCourse(customizedEntity, ctx.state.user.id);
            }
        }
        return customizedEntities;
    },
    async findOne(ctx) {
        const { id } = ctx.params;
        const entity = await strapi.services.course.findOne({ id });
        const customizedEntity = customizeEntityValue(entity)
        if (ctx.state.user) {
            await checkIfUserFinishedLesson(customizedEntity, ctx.state.user.id);
            await checkIfUserPurchasedCourse(customizedEntity, ctx.state.user.id);
        }

        console.log(customizedEntity, 'customizedEntity')
        return customizedEntity;
    },
    async findUnpublished(ctx) {
        let result = await strapi.query('course').find();
        const customizedEntities = result.map(entity => customizeEntityValue(entity));
        return customizedEntities;
    },
    async findOneUnpublished(ctx) {
        const { id } = ctx.params;
        let result = await strapi.query('course').findOne({ id });
        return customizeEntityValue(result);
    },
};
