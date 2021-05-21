'use strict';

module.exports = {
    async refreshToken(ctx) {
        const token = ctx.request.header.authorization.split('Bearer ')[1]
        try {
            const payload = await strapi.plugins['users-permissions'].services.jwt.verify(token)
            return strapi.plugins['users-permissions'].services.jwt.issue({
                id: payload.id,
            })
        } catch (e) {
            console.log(e)
        }
    }
}
