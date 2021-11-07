'use strict';
const { sanitizeEntity } = require('strapi-utils');
const axios = require('axios');

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */
const grabVideoId = (videoUrl) => {
    if(videoUrl.match(/vimeo.com/g) == null){
        return videoUrl.replace(`https://player.vimeo.com/video/`, '')
    }
    else{
        videoUrl = videoUrl.substring(18);
        return videoUrl.replace(`https://player.vimeo.com/video/`, '')
    }
   
}

const grabDuration = async (videoUrl) => {
    const videoId = grabVideoId(videoUrl)
    try {
        if (videoId) {
            return await axios.get(`http://vimeo.com/api/v2/video/${videoId}/json`)
        }
    } catch (error) {
        console.log(error)
    }
}


const customizeEntityValue = async (entity) => {
    const entityWithoutPrivateField = sanitizeEntity(entity, { model: strapi.models.course });
    const unresolvedArray = entity.lessons.map(lesson => { return grabDuration(lesson.videoUrl) })
    // 2nd parameter, pass a function to Promise.all to resolve the data
    let lessonVideos;
    let lessonsDetail = [];
    await Promise.all(unresolvedArray).then((values) => {
        lessonVideos = values.map(value => {
            /**format the time */
            let duration = value.data[0].duration;
            let seconds;
            let mins;
            let time;
            mins = Math.floor(duration / 60).toLocaleString('en-US', {
                minimumIntegerDigits: 2,
                useGrouping: false
            });
            seconds = (duration - mins * 60).toLocaleString('en-US', {
                minimumIntegerDigits: 2,
                useGrouping: false
            });
            time = `${mins}:${seconds}`;
            return {
                id: value.data[0].id,
                duration: time
            }
        });

        const lookupDuration = (lesson) => {
            let videoDuration;
            let lookupId = grabVideoId(lesson.videoUrl);
            videoDuration = lessonVideos.filter((lessonVideo) => lessonVideo.id == lookupId).map(lessonVideo => lessonVideo.duration);
            return videoDuration[0]
        }
        for (const lesson of entity.lessons) {
            lessonsDetail.push({ id: lesson.id, title: lesson.title, text: lesson.lessonDescription, finished: false, videoDuration: lookupDuration(lesson) })
        }
    })

    return {
        lessonsDetail,
        courseMaterials: entity.course_materials,
        purchased: false,
        ...entityWithoutPrivateField
    };
}

const checkIfUserFinishedLesson = async (entity, userId) => {
    console.log(entity.lessonsDetail, 'entity.lessonsDetail')
    for (let i = 0; i < entity.lessonsDetail.length; i++) {
        let lessonId = entity.lessonsDetail[i].id;
        const lessonProgressRecord = await strapi.services['user-progress'].findOne({ lesson: lessonId, 'users_permissions_user': userId });
        if (lessonProgressRecord) {
            entity.lessonsDetail[i].finished = true;
        }
    }
}

const checkIfUserPurchasedCourse = async (entity, userId) => {
    const user = await strapi.query('user', 'users-permissions').findOne({ id: userId });
    const userCourses = user.courses;
    const ifUserOwnTargetCourse = userCourses.filter(course => { return (course.id == entity.id) });
    // console.log(ifUserOwnTargetCourse, 'ifUserOwnTargetCourse')
    if (ifUserOwnTargetCourse.length > 0) {
        entity.purchased = true;
    };
}

module.exports = {
    async find(ctx) {
        let entities = await strapi.services.course.find(ctx.query);
        const customizedEntities = entities.map(entity => customizeEntityValue(entity));
        const result = await Promise.all(customizedEntities)
            .then(async function (customizedEntities) {
                if (ctx.state.user) {
                    for (let customizedEntity of customizedEntities) {
                        await checkIfUserFinishedLesson(customizedEntity, ctx.state.user.id);
                        await checkIfUserPurchasedCourse(customizedEntity, ctx.state.user.id);
                    }
                }
                return customizedEntities;
            })
        return result
    },
    async findOne(ctx) {
        const { id } = ctx.params;
        const entity = await strapi.services.course.findOne({ id });
        const customizedEntity = await customizeEntityValue(entity)
        if (ctx.state.user) {
            await checkIfUserFinishedLesson(customizedEntity, ctx.state.user.id);
            await checkIfUserPurchasedCourse(customizedEntity, ctx.state.user.id);
        }

        // console.log(customizedEntity, 'customizedEntity')
        return customizedEntity;
    },
    async findUnpublished(ctx) {
        let result = await strapi.query('course').find();
        const customizedEntities = result.map(entity => customizeEntityValue(entity));
        console.log(customizedEntitie, 'customizedEntities')
        return customizedEntities;
    },
    async findOneUnpublished(ctx) {
        const { id } = ctx.params;
        let result = await strapi.query('course').findOne({ id });
        return customizeEntityValue(result);
    },
};
