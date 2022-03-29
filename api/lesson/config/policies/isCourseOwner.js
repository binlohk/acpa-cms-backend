module.exports = async (ctx, next) => {
    const { id } = ctx.params;
    const targetLesson = await strapi.services.lesson.findOne({ id });
    const targetCourseId = targetLesson.course.id;
    const userPaymentCourse = await strapi.query("user-payment").findOne({ course: targetCourseId, user: ctx.state.user.id, paid: true });
    if (userPaymentCourse){
        return await next();
    } else {
        ctx.unauthorized(`You haven't purchased the course yet.`);
    }
  };