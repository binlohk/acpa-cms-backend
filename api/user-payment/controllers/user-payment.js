'use strict';

const { sanitizeEntity } = require('strapi-utils');
const stripe = require('stripe')(process.env.ACPA_STRIPE_SK);
const unparsed = Symbol.for('unparsedBody');

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {

    async findOne(ctx) {
        const { sessionID } = ctx.params;
        const entity = await strapi.services['user-payment'].findOne({ sessionID });
        return sanitizeEntity(entity, { model: strapi.models['user-payment'] });
    },

    /**
   * Create a record.
   *
   * @return {Object}
   */

    async create(ctx) {
        try {
            const { courseId } = ctx.request.body;
            const course = await strapi.services['course'].findOne({ id: courseId });
            const priceKey = course.stripePriceKey;
            if (!priceKey) {
                try {
                    const { courseId } = ctx.request.body;
                    const course = await strapi.services['course'].findOne({ id: courseId });

                    const entity = await strapi.services['user-payment'].create({
                        user: ctx.state.user,
                        course,
                        sessionID: "free"
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
            const session = await stripe.checkout.sessions.create({
                success_url: `${process.env.BASE_URL}/payment-success/${courseId}?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${process.env.BASE_URL}/payment-fail/${courseId}?session_id={CHECKOUT_SESSION_ID}`,
                payment_method_types: ['card'],
                line_items: [
                    { price: priceKey, quantity: 1 },
                ],
                client_reference_id: ctx.state.user.stripeCustomerKey,
                mode: 'payment',
            });

            const entity = await strapi.services['user-payment'].create({
                user: ctx.state.user,
                course,
                sessionID: session.id,
            });
            return sanitizeEntity(entity, { model: strapi.models['user-payment'] });
        } catch (e) {
            console.log(e);
        }
    },

    /**
     * Update a record.
     *
     * @return {Object}
     */
    async handleAsyncEvents(ctx) {
        let data;
        let eventType;
        // Check if webhook signing is configured.
        if (process.env.ACPA_STRIPE_WEBHOOK_SECRET) {
            // Retrieve the event by verifying the signature using the raw body and secret.
            let event;
            const unparsedBody = ctx.request.body[unparsed];
            let signature = ctx.request.headers["stripe-signature"];
            try {
                event = stripe.webhooks.constructEvent(
                    unparsedBody,
                    signature,
                    process.env.ACPA_STRIPE_WEBHOOK_SECRET
                );

            } catch (err) {
                console.log(err);
                return ctx.badRequest(`⚠️  Webhook signature verification failed.`);
            }

            // Extract the object from the event.
            data = event.data;
            eventType = event.type;

        } else {
            // Webhook signing is recommended, but if the secret is not configured in `config.js`,
            // retrieve the event data directly from the request body.
            return ctx.badRequest(`⚠️  Webhook signature is not passed.`);
        }

        if (eventType === "checkout.session.completed") {
            console.log(`🔔  Payment received!`);
            const session = data.object;
            try {
                const entity = await strapi.services['user-payment'].update({
                    sessionID: session.id,
                },
                    {
                        paid: true,
                    });
                const user = await strapi.query('user', 'users-permissions').findOne({ id: entity.user.id });
                const userCourses = user.courses;
                userCourses.push({ id: entity.course.id });
                const userCoursesUpdate = await strapi.query('user', 'users-permissions').update({ id: entity.user.id }, { courses: userCourses });
                console.log(userCoursesUpdate, 'userCoursesUpdate')
                return sanitizeEntity(entity, { model: strapi.models['user-payment'] });

            } catch (e) {
                console.log(e)
                return ctx.badRequest(`⚠️  Update user payment record failed.`);
            }
        } else {
            return ctx.badRequest(`⚠️  The payment status is not succeeded.`);
        }
    },

};
