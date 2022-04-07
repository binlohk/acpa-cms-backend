module.exports = async (ctx, next) => {
  let targetLesson;
  try {
    const { lesson } = ctx.request.body;
    targetLesson = await strapi.services.lesson.findOne({ id: lesson });
    const targetCourseId = targetLesson.course.id;
    const user = await strapi
      .query("user", "users-permissions")
      .findOne({ id: ctx.state.user.id });
    const ifUserOwnTargetCourse = user?.user_payments.filter((course) => {
      return course.course == targetCourseId;
    });
    if (ifUserOwnTargetCourse.length == 1) {
      return await next();
    } else {
      ctx.unauthorized(`You haven't purchased the course yet.`);
    }
  } catch (e) {
    return ctx.badRequest("Lesson does not exist.");
  }
};
