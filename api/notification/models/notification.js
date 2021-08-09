'use strict';
const { Expo } = require('expo-server-sdk');

const expo = new Expo({ accessToken: process.env.ACPA_EXPO_ACCESS_TOKEN });

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

module.exports = {
  lifecycles: {
    async afterCreate(result, data){
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
          title: result.title,
          body: result.description,
        }));
      let chunks = expo.chunkPushNotifications(messages);
      for (let chunk of chunks) {
        expo.sendPushNotificationsAsync(chunk)
          .then(ticketChunk => {
            strapi.log.debug(ticketChunk)
            strapi.log.debug(JSON.stringify(ticketChunk))
          })
          .catch(err => strapi.log.error(err));
      }
    },
  },
};
