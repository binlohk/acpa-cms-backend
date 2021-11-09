'use strict';
const { Expo } = require('expo-server-sdk');

const expo = new Expo({ accessToken: process.env.ACPA_EXPO_ACCESS_TOKEN });

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

module.exports = {
  lifecycles: {
    async afterCreate(result, data) {
    // console.log(result);
    },
    async beforeUpdate(params, data) {
      console.log(data);
      // console.log(params);
      //  { id: 11 }
      // console.log(data);
      // { published_at: 2021-11-08T10:24:04.424Z }
      if (data.published_at != null) {
        const { id } = params;
        const previousData = await strapi.query('notification').findOne({id: id});
        const previousPublishedAt = previousData.published_at;
        const currentPublished_at = data.published_at;
        if (currentPublished_at != previousPublishedAt) {
          // console.log('Triggered only when published.');
          const users = await strapi
          .query('user', 'users-permissions')
          .find({ _limit: -1 });
          const messages = users
          .filter(user => user.pushNotificationToken)
          .map(user => user.pushNotificationToken)
          .filter(user => Expo.isExpoPushToken)
          .map(token => ({
            to: token,
            sound: 'default',
            title: previousData.title,
            body: previousData.description,
          }));
          let chunks = expo.chunkPushNotifications(messages);
          (async () => {
            for (let chunk of chunks) {
              try {
                let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                console.log(ticketChunk);
                tickets.push(...ticketChunk);
              } catch (error) {
                console.error(error);
              }
            }
          })();
        }
      }
    },
  },
};
