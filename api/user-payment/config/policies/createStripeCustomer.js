const stripe = require("stripe")(process.env.ACPA_STRIPE_SK);

module.exports = async (ctx, next) => {
  try {
    const user = await strapi
      .query("user", "users-permissions")
      .findOne({ id: ctx.state.user.id });
    let userStripeCustomerId = user.stripeCustomerKey;
    if (!userStripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
      });
      await strapi
        .query("user", "users-permissions")
        .update({ id: ctx.state.user.id }, { stripeCustomerKey: customer.id });
    }
    return await next();
  } catch (e) {
    console.log("in createStripe customer", e.message);
    ctx.badRequest(e.message);
  }
};
