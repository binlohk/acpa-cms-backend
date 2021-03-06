"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

module.exports = {
  lifecycles: {
    async afterCreate(result, data) {
      if (result?.course?.price <= 0) {
        let courseDetails = await strapi.services["course"].findOne({
          id: result.course.id,
        });
        function formatDate(date) {
          var d = new Date(date),
            month = "" + (d.getMonth() + 1),
            day = "" + d.getDate(),
            year = d.getFullYear();

          if (month.length < 2) month = "0" + month;
          if (day.length < 2) day = "0" + day;

          return [day, month, year].join("-");
        }
        let LessaonDate = courseDetails?.enroll_form?.LessonDate;
        const user = await strapi.query("user", "users-permissions").findOne({
          id: result.user.id,
        });

        var referrerDetails = "";
        if (user?.user_referrees[0]?.referral_referrer) {
          var referrerDetails = await strapi
            .query("user", "users-permissions")
            .findOne({ id: user?.user_referrees[0]?.referral_referrer });
        }
        let userName = result.user.username;
        if (LessaonDate) {
          var LessonDateTime =
            formatDate(LessaonDate) +
            " " +
            new Date(LessaonDate).getHours() +
            ":" +
            new Date(LessaonDate).getMinutes();
        } else {
          var LessonDateTime = "";
        }
        let userPhoneNumber = result?.user?.phone ?? "";

        let userEmail = result?.user?.email ?? "";
        let referrerName = referrerDetails?.username ?? "";
        if (!courseDetails?.enroll_form?.InvitationMessage) {
          var InvitationMessage = courseDetails?.description.replace(
            '<img src="/',
            `<img src=\"${strapi.config.get("server.url")}/`
          );
        } else {
          var InvitationMessage =
            courseDetails?.enroll_form?.InvitationMessage.replace(
              '<img src="/',
              `<img src=\"${strapi.config.get("server.url")}/`
            );
        }
        let UserDetailsTable = `
        ${InvitationMessage}
        
        <table style="font-family: arial, sans-serif;
        border-collapse: collapse;">
        <tr >
          <th style=" border: 1px solid #dddddd;
          text-align: left;
          padding: 8px;"></th>
          <th style=" border: 1px solid #dddddd;
          text-align: left;
          padding: 8px;"></th>
        </tr>
        <tr style="background-color: #dddddd;">
          <td style=" border: 1px solid #dddddd;
          text-align: left;
          padding: 8px;">Name</td>
          <td style=" border: 1px solid #dddddd;
          text-align: left;
          padding: 8px;">${userName}</td>
        </tr>
        <tr>
          <td style=" border: 1px solid #dddddd;
          text-align: left;
          padding: 8px;">Email</td>
          <td style=" border: 1px solid #dddddd;
          text-align: left;
          padding: 8px;">${userEmail}</td>
        </tr>
       <tr style="background-color: #dddddd;">
          <td style=" border: 1px solid #dddddd;
          text-align: left;
          padding: 8px;">Referrer</td>
          <td style=" border: 1px solid #dddddd;
          text-align: left;
          padding: 8px;">${referrerName}</td>
        </tr>
      </table>`;
        let EnrolledUSerEmail = result.user.email;

        if (!courseDetails?.enroll_form?.lessonTitle) {
          var InvitationMessageSubject = "??????????????? " + courseDetails?.title;
        } else {
          var InvitationMessageSubject =
            "??????????????? " + courseDetails?.enroll_form?.lessonTitle;
        }
        await strapi.plugins["email"].services.email

          .send({
            to: EnrolledUSerEmail,
            from: "kelvin@acpa.training",
            replyTo: "kelvin@acpa.training",
            subject: InvitationMessageSubject,
            html: UserDetailsTable,
          })
          .catch((err) => {
            console.log(err);
          });
      }
    },

    async afterUpdate(result, data) {
      if (result) {
        let courseDetails = await strapi.services["course"].findOne({
          id: result.course.id,
        });
        function formatDate(date) {
          var d = new Date(date),
            month = "" + (d.getMonth() + 1),
            day = "" + d.getDate(),
            year = d.getFullYear();

          if (month.length < 2) month = "0" + month;
          if (day.length < 2) day = "0" + day;

          return [day, month, year].join("-");
        }
        let LessaonDate = courseDetails?.enroll_form?.LessonDate;
        const user = await strapi.query("user", "users-permissions").findOne({
          id: result.user.id,
        });

        var referrerDetails = "";
        if (user?.user_referrees[0]?.referral_referrer) {
          var referrerDetails = await strapi
            .query("user", "users-permissions")
            .findOne({ id: user?.user_referrees[0]?.referral_referrer });
        }
        let userName = result.user.username;
        if (LessaonDate) {
          var LessonDateTime =
            formatDate(LessaonDate) +
            " " +
            new Date(LessaonDate).getHours() +
            ":" +
            new Date(LessaonDate).getMinutes();
        } else {
          var LessonDateTime = "";
        }
        let userPhoneNumber = result?.user?.phone ?? "";

        let userEmail = result?.user?.email ?? "";
        let referrerName = referrerDetails?.username ?? "";
        if (!courseDetails?.enroll_form?.InvitationMessage) {
          var InvitationMessage = courseDetails?.description.replace(
            '<img src="/',
            `<img src=\"${strapi.config.get("server.url")}/`
          );
        } else {
          var InvitationMessage =
            courseDetails?.enroll_form?.InvitationMessage.replace(
              '<img src="/',
              `<img src=\"${strapi.config.get("server.url")}/`
            );
        }
        let UserDetailsTable = `
      ${InvitationMessage}
      
      <table style="font-family: arial, sans-serif;
      border-collapse: collapse;">
      <tr >
        <th style=" border: 1px solid #dddddd;
        text-align: left;
        padding: 8px;"></th>
        <th style=" border: 1px solid #dddddd;
        text-align: left;
        padding: 8px;"></th>
      </tr>
      <tr style="background-color: #dddddd;">
        <td style=" border: 1px solid #dddddd;
        text-align: left;
        padding: 8px;">Name</td>
        <td style=" border: 1px solid #dddddd;
        text-align: left;
        padding: 8px;">${userName}</td>
      </tr>
      <tr>
        <td style=" border: 1px solid #dddddd;
        text-align: left;
        padding: 8px;">Email</td>
        <td style=" border: 1px solid #dddddd;
        text-align: left;
        padding: 8px;">${userEmail}</td>
      </tr>
     <tr style="background-color: #dddddd;">
        <td style=" border: 1px solid #dddddd;
        text-align: left;
        padding: 8px;">Referrer</td>
        <td style=" border: 1px solid #dddddd;
        text-align: left;
        padding: 8px;">${referrerName}</td>
      </tr>
    </table>`;
        let EnrolledUSerEmail = result.user.email;

        if (!courseDetails?.enroll_form?.lessonTitle) {
          var InvitationMessageSubject = "??????????????? " + courseDetails?.title;
        } else {
          var InvitationMessageSubject =
            "??????????????? " + courseDetails?.enroll_form?.lessonTitle;
        }
        await strapi.plugins["email"].services.email

          .send({
            to: EnrolledUSerEmail,
            from: "kelvin@acpa.training",
            replyTo: "kelvin@acpa.training",
            subject: InvitationMessageSubject,
            html: UserDetailsTable,
          })
          .catch((err) => {
            console.log(err);
          });
      }
    },
  },
};
