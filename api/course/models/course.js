'use strict';
const Boom = require('boom');

const err = new Error("Some useful message about the missing relation");
const boomError = Boom.boomify(err, {
  statusCode: 422,
});
// throw(boomError);

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

module.exports = {
    lifecycles: {
        beforeCreate(data) {
          console.log(data);
        },
      },
};
