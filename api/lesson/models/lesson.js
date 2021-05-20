'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

const Boom = require('boom');
const err = new Error("The relation to course is missing. Please incidate which course does this lesson belong to.");
const boomError = Boom.boomify(err, {
  statusCode: 422,
});

module.exports = {
    lifecycles: {
        beforeCreate(data) {
            if(!data.course){
                throw(boomError);
            }
        },
        beforeUpdate(param, data){
            if(!data.course){
                throw(boomError);
            }
        },
      },
};
