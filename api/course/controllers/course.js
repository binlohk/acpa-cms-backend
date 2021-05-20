'use strict';
const { sanitizeEntity } = require('strapi-utils');

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async find(ctx) {
        let entities;
        if (ctx.query._q) {
          entities = await strapi.services.course.search(ctx.query);
        } else {
          entities = await strapi.services.course.find(ctx.query);
        }

        return entities.map(entity => { 
            return {
                lessonsDetail: entity.lessons.map(lesson=>{return { id: lesson.id, title: lesson.title, text: lesson.lessonDescription}}), 
                courseMaterials: entity.course_materials.map(material=>{ return { id: material.id, title: material.title}}),
                ...sanitizeEntity(entity, { model: strapi.models.course })};
        });
    },
    async findOne(ctx) {
        const { id } = ctx.params;
        const entity = await strapi.services.course.findOne({ id });
        const entityWithoutPrivateField = sanitizeEntity(entity, { model: strapi.models.course });
        return {
            lessonsDetail: entity.lessons.map(lesson=>{return { id: lesson.id, title: lesson.title, text: lesson.lessonDescription}}), 
            courseMaterials: entity.course_materials.map(material=>{ return { id: material.id, title: material.title }}),
            ...entityWithoutPrivateField
        };
    },
};
