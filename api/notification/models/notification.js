'use strict';
const { Expo } = require('expo-server-sdk');

//const expo = new Expo({ accessToken: process.env.ACPA_EXPO_ACCESS_TOKEN });
const expo = new Expo({ accessToken: `${process.env.ACPA_EXPO_ACCESS_TOKEN}` });

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
    },
  },
};
