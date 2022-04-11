"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

const Boom = require("boom");
const axios = require("axios");
const err = new Error(
  "The relation to course is missing. Please incidate which course does this lesson belong to."
);
const boomError = Boom.boomify(err, {
  statusCode: 422,
});
const vimeoErr = new Error("Please enter valid vimeo video link.");
const vimeoBoomErr = Boom.boomify(vimeoErr, { statusCode: 422 });

module.exports = {
  lifecycles: {
    async beforeCreate(data) {
      try {
        await axios.get(
          `https://vimeo.com/api/oembed.json?url=${data?.videoUrl}`
        );
      } catch (error) {
        throw vimeoBoomErr;
      }
      if (!data.course) {
        throw boomError;
      }
    },
    async beforeUpdate(param, data) {
      if ("course" in data) {
        if (!data.course) {
          throw boomError;
        }
      } else {
        let result = await strapi.query("lesson").findOne({ id: param.id });
        if (!result.course) {
          throw boomError;
        }
      }
      if ("videoUrl" in data) {
        try {
          await axios.get(
            `https://vimeo.com/api/oembed.json?url=${data?.videoUrl}`
          );
        } catch (error) {
          throw vimeoBoomErr;
        }
      }
    },
  },
};
