"use strict";

let { sanitizeEntity } = require("strapi-utils");
let stripe = require("stripe")(process.env.ACPA_STRIPE_SK);
let unparsed = Symbol.for("unparsedBody");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async findOne(ctx) {
    let { sessionID } = ctx.params;
    let entity = await strapi.services["user-payment"].findOne({ sessionID });
    return sanitizeEntity(entity, { model: strapi.models["user-payment"] });
  },

  /**
   * Create a record.
   *
   * @return {Object}
   */

  async create(ctx) {
    try {
      let { courseId } = ctx.request.body;
      let course = await strapi.services["course"].findOne({ id: courseId });

      let priceKey = course.stripePriceKey;
      let price = course.price;

      const userDetails = await strapi
        .query("user", "users-permissions")
        .findOne({
          id: ctx.state.user.id,
        });

      if (!priceKey && (!price || price <= 0)) {
        try {
          let session =
            ctx.state.user.username + " applied free course " + course.title;

          let entity = await strapi.services["user-payment"].create({
            user: ctx.state.user,
            course,
            sessionID: session,
            paid: true,
          });
          return sanitizeEntity(entity, {
            model: strapi.models["user-payment"],
          });
        } catch (e) {
          console.log(e);
        }
      } else if (!priceKey && price > 0) {
        return ctx.badRequest(`⚠️  No price key available.`);
      } else {
        let session = await stripe.checkout.sessions.create({
          success_url: `${process.env.BASE_URL}/payment-success/${courseId}?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.BASE_URL}/payment-fail/${courseId}?session_id={CHECKOUT_SESSION_ID}`,
          payment_method_types: ["card"],
          line_items: [{ price: priceKey, quantity: 1 }],
          client_reference_id: userDetails.stripeCustomerKey,
          mode: "payment",
          metadata: {
            courseSession: ctx.request.body.courseSession ?? "",
            userId: ctx.state.user.id ?? "",
          },
        });

        let checkUserPaymentExist = await strapi.services[
          "user-payment"
        ].findOne({
          course: course.id,
          user: ctx.state.user.id,
          paid: false,
        });

        if (!checkUserPaymentExist) {
          // there is no user-payment record
          var entity = await strapi.services["user-payment"].create({
            user: ctx.state.user,
            course,
            sessionID: session.id,
          });
        } else {
          await strapi.services["user-payment"].update(
            { sessionID: checkUserPaymentExist?.sessionID },
            { sessionID: session?.id }
          );
          checkUserPaymentExist.sessionID = session?.id;
        }
        return sanitizeEntity(entity ?? checkUserPaymentExist, {
          model: strapi.models["user-payment"],
        });
      }
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
    console.log("in handleAsyncEvents");
    if (process.env.ACPA_STRIPE_WEBHOOK_SECRET) {
      // Retrieve the event by verifying the signature using the raw body and secret.
      let event;
      let unparsedBody = ctx.request.body[unparsed];
      console.log("unparsedBody: ", unparsedBody)
      let signature = ctx.request.headers["stripe-signature"];
      console.log("signature: ", signature)
      try {
        event = stripe.webhooks.constructEvent(
          unparsedBody,
          signature,
          process.env.ACPA_STRIPE_WEBHOOK_SECRET
        );
      } catch (err) {
        console.log(err)
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

      let session = data.object;
      try {
        let userSessionData = {
          enrolledDate: new Date(),
          session: data?.object?.metadata?.courseSession,
          user: data?.object?.metadata?.userId,
        };
        await strapi.services["user-sessions"].create({ ...userSessionData });
        let entity = await strapi.services["user-payment"].update(
          {
            sessionID: session.id,
          },
          {
            paid: true,
          }
        );
        return sanitizeEntity(entity, { model: strapi.models["user-payment"] });
      } catch (e) {
        console.log(e);
        return ctx.badRequest(`⚠️  Update user payment record failed.`);
      }
    } else {
      return ctx.badRequest(`⚠️  The payment status is not succeeded.`);
    }
  },
};
