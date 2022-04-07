module.exports = async (ctx, next) => {
  if (!("lessonId" in ctx.params) || !("userId" in ctx.params)) {
    console.log(
      "You must provide the lesson and users_permissions_user fields in the request body."
    );
    ctx.badRequest(
      "You must provide the lesson and users_permissions_user fields in the request body."
    );
  } else {
    ctx.request.body = {
      lesson: ctx.params.lessonId,
      users_permissions_user: ctx.params.userId,
    };
    return await next();
  }
};
