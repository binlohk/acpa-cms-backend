module.exports = async (ctx, next) => {
    const { id } = ctx.params;
    const targetLesson = await strapi.services.lesson.findOne({ id });
    const targetCourseId = targetLesson.course.id;
    const user = await strapi.query('user', 'users-permissions').findOne({id: ctx.state.user.id});
    const userCourses = user.courses;
    const ifUserOwnTargetCourse = userCourses.filter(course=>{return (course.id == targetCourseId)});
    if (ifUserOwnTargetCourse.length==1){
        return await next();
    } else {
        ctx.unauthorized(`You haven't purchased the course yet.`);
    }
  };