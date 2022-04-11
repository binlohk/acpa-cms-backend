"use strict";
const { sanitizeEntity } = require("strapi-utils");
const axios = require("axios");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */
const grabVideoId = (videoUrl) => {
  try {
    let regex =
      /(?:http:|https:|)\/\/(?:player.|www.)?vimeo\.com\/(?:video\/|embed\/|watch\?\S*v=|v\/)?(\d*)/g;
    videoUrl = videoUrl.match(regex); // creates array from matches
    if (videoUrl === null) {
      // Invalid URL Passed
      return null;
    } else {
      // Valid URL Passed
      let PassedVimeoURL = videoUrl[0];
      let regexToGetToken = /\d+/g;
      let videoToken = PassedVimeoURL.match(regexToGetToken);
      return videoToken[0].replace(`https://player.vimeo.com/video/`, "");
    }
  } catch (error) {
    console.log("ERROR IN Function grabVideoId");
    console.log(error);
  }
};

const customizeEntityValue = async (entity) => {
  try {
    const entityWithoutPrivateField = sanitizeEntity(entity, {
      model: strapi.models.course,
    });
    // 2nd parameter, pass a function to Promise.all to resolve the data
    let lessonVideos;
    let lessonsDetail = [];
    await Promise.all(
      entity.lessons.map((lesson) =>
        axios
          .get(
            `http://vimeo.com/api/v2/video/${grabVideoId(lesson.videoUrl)}/json`
          )
          .catch(() => {
            return null;
          })
      )
    ).then(function (...values) {
      lessonVideos = values[0].map((value, index) => {
        /**format the time */
        if (value?.data[0]) {
          let duration = value?.data[0]?.duration;
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
          return {
            id: value?.data[0]?.id,
            duration: time,
          };
        }
      });

      const lookupDuration = (lesson) => {
        let videoDuration;
        let lookupId = grabVideoId(lesson.videoUrl);
        if (lessonVideos[0] && lookupId) {
          videoDuration = lessonVideos
            .filter((lessonVideo) => lessonVideo?.id == lookupId)
            .map((lessonVideo) => lessonVideo.duration);
          return videoDuration[0];
        } else {
          return null;
        }
      };
      for (const lesson of entity.lessons) {
        if (lookupDuration(lesson)) {
          lessonsDetail.push({
            id: lesson.id,
            title: lesson.title,
            text: lesson.lessonDescription,
            finished: false,
            videoDuration: lookupDuration(lesson),
            LessonDate: lesson.LessonDate,
          });
        }
      }
    });

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
