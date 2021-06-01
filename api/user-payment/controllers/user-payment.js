'use strict';

const { sanitizeEntity } = require('strapi-utils');
const stripe = require('stripe')(process.env.STRIPE_SK);
const { unparsed } = require("koa-body");


/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {

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
        if(!priceKey){
            ctx.badRequest('The course has no valid Stripe price key. Please contact support.');
        }
        const session = await stripe.checkout.sessions.create({
            success_url: 'https://google.com',
            cancel_url: 'https://yahoo.com',
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
        return sanitizeEntity(entity, { model: strapi.models['user-payment']});
      } catch(e) {
        console.log(e);
      }
  },

//   async confirm(ctx) {
//       const { checkout_session } = ctx.request.body;

//       const session = await stripe.checkout.sessions.retrieve(checkout_session);
//       console.log(session)

//   }

  /**
   * Update a record.
   *
   * @return {Object}
   */
    async handleAsyncEvents (ctx) {
    let data;
    let eventType;
    // Check if webhook signing is configured.
    if (process.env.STRIPE_WEBHOOK_SECRET) {
        // Retrieve the event by verifying the signature using the raw body and secret.
        let event;
        const unparsedBody = ctx.request.body[unparsed];
        let signature = ctx.request.headers["stripe-signature"];
        console.log("signature: ", signature)
        try {
            console.log("ctx.request: ", unparsedBody)
            event = stripe.webhooks.constructEvent(
                unparsedBody,
                signature,
                process.env.STRIPE_WEBHOOK_SECRET
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
        data = req.body.data;
        eventType = req.body.type;
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
            return sanitizeEntity(entity, { model: strapi.models['user-payment']});

        } catch (e) {
            console.log(e)
            return ctx.badRequest(`⚠️  Update user payment record failed.`);
        }
    }
    return sanitizeEntity(entity, { model: strapi.models['user-payment']});
},

};
