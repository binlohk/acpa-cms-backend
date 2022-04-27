"use strict";
const { sanitizeEntity } = require("strapi-utils");
const axios = require("axios");
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */
const getVideoDuration = (videoLink) => {
  try {
    return axios.get(
      `https://vimeo.com/api/oembed.json?url=${videoLink}`
    );
  } catch (error) {
    console.log(`error in get video duration`, error);
    return null;
  }
};
const getTimeInMin = (duration) => {
  let seconds;
  let mins;
  let time;
  mins = Math.floor(duration / 60).toLocaleString("en-US", {
    minimumIntegerDigits: 2,
    useGrouping: false,
  });
  seconds = (duration - mins * 60).toLocaleString("en-US", {
    minimumIntegerDigits: 2,
    useGrouping: false,
  });
  time = `${mins}:${seconds}`;
  return time;
};
const customizeEntityValue = async (entity) => {
  try {
    const entityWithoutPrivateField = sanitizeEntity(entity, {
      model: strapi.models.course,
    });
    let durations = await Promise.all(entity.lessons.map((lesson) => getVideoDuration(lesson.videoUrl)));
    let lessonsDetail = entity.lessons.map((lesson, index) => {
      const videoDuration = getTimeInMin(durations[index]?.data?.duration ?? 0);
      return {
            id: lesson?.id,
            title: lesson?.title,
            text: lesson?.lessonDescription,
            finished: false,
            videoDuration: videoDuration,
            LessonDate: lesson?.LessonDate
      }
    });
    console.log("lessonsDetail: ", lessonsDetail);
    return {
      lessonsDetail,
      courseMaterials: entity.course_materials,
      purchased: false,
      ...entityWithoutPrivateField,
    };
  } catch (error) {
    console.log("Error In customizeEntityValue");
    console.log(error);
  }
};
const checkIfUserFinishedLesson = async (entity, userId) => {
  for (let i = 0; i < entity.lessonsDetail.length; i++) {
    let lessonId = entity.lessonsDetail[i].id;
    const lessonProgressRecord = await strapi.services["user-progress"].findOne(
      { lesson: lessonId, users_permissions_user: userId }
    );
    if (lessonProgressRecord) {
      entity.lessonsDetail[i].finished = true;
    }
  }
};
const checkIfUserPurchasedCourse = async (entity, userId) => {
  const userPaymentCourse = await strapi
    .query("user-payment")
    .findOne({ course: entity.id, user: userId, paid: true });
  if (userPaymentCourse) {
    entity.purchased = true;
  }
};
module.exports = {
  async find(ctx) {
    let entities = await strapi.services.course.find(ctx.query);
    const customizedEntities = entities.map((entity) =>
      customizeEntityValue(entity)
    );
    const result = await Promise.all(customizedEntities).then(async function (
      customizedEntities
    ) {
      if (ctx.state.user) {
        for (let customizedEntity of customizedEntities) {
          await checkIfUserFinishedLesson(customizedEntity, ctx.state.user.id);
          await checkIfUserPurchasedCourse(customizedEntity, ctx.state.user.id);
        }
      }
      return customizedEntities;
    });
    return result;
  },
  async findOne(ctx) {
    const { id } = ctx.params;
    const entity = await strapi.services.course.findOne({ id });
    const customizedEntity = await customizeEntityValue(entity);
    if (ctx.state.user) {
      await checkIfUserFinishedLesson(customizedEntity, ctx.state.user.id);
      await checkIfUserPurchasedCourse(customizedEntity, ctx.state.user.id);
    }
    // console.log(customizedEntity, 'customizedEntity')
    return customizedEntity;
  },
  async findUnpublished(ctx) {
    let result = await strapi.query("course").find();
    const customizedEntities = result.map((entity) =>
      customizeEntityValue(entity)
    );
    console.log(customizedEntitie, "customizedEntities");
    return customizedEntities;
  },
  async findOneUnpublished(ctx) {
    const { id } = ctx.params;
    let result = await strapi.query("course").findOne({ id });
    return customizeEntityValue(result);
  },
};
