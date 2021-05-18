'use strict';
const { sanitizeEntity } = require('strapi-utils');

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    // async find(ctx) {
    //     // console.log(ctx.state);
    //     let entities;
    //     if (ctx.query._q) {
    //       entities = await strapi.services.course.search(ctx.query);
    //     } else {
    //       entities = await strapi.services.course.find(ctx.query);
    //     }
    //     console.log(entities);
    //     return entities.map(entity => { 
    //         return {...sanitizeEntity(entity, { model: strapi.models.course })}
    //     });
    // },
};
