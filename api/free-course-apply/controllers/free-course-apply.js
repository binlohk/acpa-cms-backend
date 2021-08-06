'use strict';
const { sanitizeEntity } = require('strapi-utils');

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {

    async create(ctx) {
        try {
            const { courseId } = ctx.request.body;
            const course = await strapi.services['course'].findOne({ id: courseId });

            const entity = await strapi.services['free-course-apply'].create({
                user: ctx.state.user,
                course,
            });

            const user = await strapi.query('user', 'users-permissions').findOne({ id: ctx.state.user.id });
            const userCourses = user.courses;
            userCourses.push({ id: courseId });
            const userCoursesUpdate = await strapi.query('user', 'users-permissions').update({ id: ctx.state.user.id }, { courses: course });
            return sanitizeEntity(entity, { model: strapi.models['user-payment'] });
        } catch (e) {
            console.log(e);
        }
    }
};
