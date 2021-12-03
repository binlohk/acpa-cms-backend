"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

module.exports = {
  lifecycles: {
    async afterCreate(result, data) {
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

      let LessaonDate = courseDetails.enroll_forms[0].LessonDate;
      const user = await strapi.query("user", "users-permissions").findOne({
        id: result.user.id,
      });
      const referrerDetails = await strapi
        .query("user", "users-permissions")
        .findOne({ id: user.user_referrees[0].referral_referrer });

      let userName = result.user.username;
      let LessonDateTime =
        formatDate(LessaonDate) +
        " " +
        new Date(LessaonDate).getHours() +
        ":" +
        new Date(LessaonDate).getMinutes();

      let userPhoneNumber = result.user.phone;
      let userEmail = result.user.email;
      let referrerName = referrerDetails.username;

      let InvitationMessage =
        courseDetails.enroll_forms[0].InvitationMessage.replace(/<[^>]+>/g, "");
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
        padding: 8px;">Lesson date</td>
        <td style=" border: 1px solid #dddddd;
        text-align: left;
        padding: 8px;">${LessonDateTime}</td>
      </tr>
      <tr style="background-color: #dddddd;">
        <td style=" border: 1px solid #dddddd;
        text-align: left;
        padding: 8px;">WhatsApp</td>
        <td style=" border: 1px solid #dddddd;
        text-align: left;
        padding: 8px;">${userPhoneNumber}</td>
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
      let InvitationMessageSubject =
        "已报名课程" + courseDetails.enroll_forms[0].lessonTitle;
      await strapi.plugins["email"].services.email
        .send({
          to: EnrolledUSerEmail,
          from: "meet@binlo.com.hk",
          replyTo: "meet@binlo.com.hk",
          subject: InvitationMessageSubject,
          html: UserDetailsTable,
        })
        .catch((err) => {
          console.log(err);
        });
    },
  },
};
