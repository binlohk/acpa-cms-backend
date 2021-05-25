'use strict';
const { sanitizeEntity } = require('strapi-utils');

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {

    /**
   * Count records.
   *
   * @return {Number}
   */

  count(ctx) {
    return strapi.services['user-progress'].count(ctx.request.body);
  },

 /**
   * Create a record.
   *
   * @return {Object}
   */

  async create(ctx) {
    const progress = await strapi.services['user-progress'].findOne(ctx.request.body);
    if(progress){
        ctx.badRequest('The user already has this progress record.');
    } else {
        const entity = await strapi.services['user-progress'].create(ctx.request.body);
        return sanitizeEntity(entity, { model: strapi.models['user-progress'] });
    }
  },

    /**
   * Delete a record.
   *
   * @return {Object}
   */
  async delete(ctx) {
    const progress = await strapi.services['user-progress'].findOne(ctx.request.body);
    if(progress){
        const entity = await strapi.services['user-progress'].delete({ id: progress.id });
        return sanitizeEntity(entity, { model: strapi.models['user-progress'] });
    } else {
        ctx.badRequest('The user has no relevant progress record.');
    }
  },
};
