'use strict';
const { sanitizeEntity } = require('strapi-utils');

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async create(ctx) {
        console.log(ctx.request.body)
        let entity = await strapi.services['user-referral'].create(ctx.request.body);
        return sanitizeEntity(entity, { model: strapi.models['user-referral'] });
      },
};
