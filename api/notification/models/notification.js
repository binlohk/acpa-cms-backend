'use strict';
const { Expo } = require('expo-server-sdk');

const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });

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
      let tickets = [];
      for (let chunk of chunks) {
        try {
          let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          strapi.log.debug(ticketChunk);
          strapi.log.debug(JSON.stringify(ticketChunk));
          tickets.push(...ticketChunk);
          // NOTE: If a ticket contains an error code in ticket.details.error, you
          // must handle it appropriately. The error codes are listed in the Expo
          // documentation:
          // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
        } catch (error) {
          strapi.log.error(error);
        }
      }
    },
  },
};
