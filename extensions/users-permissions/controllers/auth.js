'use strict';

/**
 * Auth.js controller
 *
 * @description: A set of functions called "actions" for managing `Auth`.
 */

/* eslint-disable no-useless-escape */
const crypto = require('crypto');
const _ = require('lodash');
const grant = require('grant-koa');
const { sanitizeEntity } = require('strapi-utils');
const { default: createStrapi } = require('strapi');

const emailRegExp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const formatError = error => [
  { messages: [{ id: error.id, message: error.message, field: error.field }] },
];

module.exports = {
  async refreshToken(ctx) {
    const token = ctx.request.header.authorization.split('Bearer ')[1]
    try {
      const payload = await strapi.plugins['users-permissions'].services.jwt.verify(token)
      return strapi.plugins['users-permissions'].services.jwt.issue({
        id: payload.id,
      })
    } catch (e) {
      console.log(e)
    }
  },
  async setPushToken(ctx) {
    if (!ctx.state.user) {
      return ctx.unauthorized(null, 'Login required.');
    }
    const user = ctx.state.user;
    const params = _.assign({}, ctx.request.body, ctx.params);
    if (!params.pushToken) {
      return ctx.badRequest(null, "No pushToken provided.");
    }
    await strapi
      .query('user', 'users-permissions')
      .update({ id: user.id }, { pushNotificationToken: params.pushToken });
    return ctx.send({ ok: true });
  },
  async callback(ctx) {
    const provider = ctx.params.provider || 'local';
    const params = ctx.request.body;
    const store = await strapi.store({
      environment: '',
      type: 'plugin',
      name: 'users-permissions',
    });

    if (provider === 'local') {
      if (!_.get(await store.get({ key: 'grant' }), 'email.enabled')) {
        return ctx.badRequest(null, 'This provider is disabled.');
      }

      // The identifier is required.
      if (!params.identifier) {
        return ctx.badRequest(
          null,
          formatError({
            id: 'Auth.form.error.email.provide',
            message: 'Please provide your username or your e-mail.',
          })
        );
      }

      // The password is required.
      if (!params.password) {
        return ctx.badRequest(
          null,
          formatError({
            id: 'Auth.form.error.password.provide',
            message: 'Please provide your password.',
          })
        );
      }

      const query = { provider };

      // Check if the provided identifier is an email or not.
      const isEmail = emailRegExp.test(params.identifier);

      // Set the identifier to the appropriate query field.
      if (isEmail) {
        query.email = params.identifier.toLowerCase();
      } else {
        query.username = params.identifier;
      }

      // Check if the user exists.
      const user = await strapi.query('user', 'users-permissions').findOne(query);

      if (!user) {
        return ctx.badRequest(
          null,
          formatError({
            id: 'Auth.form.error.invalid',
            message: 'Identifier or password invalid.',
          })
        );
      }

      if (
        _.get(await store.get({ key: 'advanced' }), 'email_confirmation') &&
        user.confirmed !== true
      ) {
        return ctx.badRequest(
          null,
          formatError({
            id: 'Auth.form.error.confirmed',
            message: 'Your account email is not confirmed',
          })
        );
      }

      if (user.blocked === true) {
        return ctx.badRequest(
          null,
          formatError({
            id: 'Auth.form.error.blocked',
            message: 'Your account has been blocked by an administrator',
          })
        );
      }

      // The user never authenticated with the `local` provider.
      if (!user.password) {
        return ctx.badRequest(
          null,
          formatError({
            id: 'Auth.form.error.password.local',
            message:
              'This user never set a local password, please login with the provider used during account creation.',
          })
        );
      }

      const validPassword = await strapi.plugins[
        'users-permissions'
      ].services.user.validatePassword(params.password, user.password);

      if (!validPassword) {
        return ctx.badRequest(
          null,
          formatError({
            id: 'Auth.form.error.invalid',
            message: 'Identifier or password invalid.',
          })
        );
      } else {
        ctx.send({
          jwt: strapi.plugins['users-permissions'].services.jwt.issue({
            id: user.id,
          }),
          user: sanitizeEntity(user.toJSON ? user.toJSON() : user, {
            model: strapi.query('user', 'users-permissions').model,
          }),
        });
      }
    } else {
      if (!_.get(await store.get({ key: 'grant' }), [provider, 'enabled'])) {
        return ctx.badRequest(
          null,
          formatError({
            id: 'provider.disabled',
            message: 'This provider is disabled.',
          })
        );
      }

      // Connect the user with the third-party provider.
      let user, error;
      try {
        [user, error] = await strapi.plugins['users-permissions'].services.providers.connect(
          provider,
          ctx.query
        );
      } catch ([user, error]) {
        return ctx.badRequest(null, error === 'array' ? error[0] : error);
      }

      if (!user) {
        return ctx.badRequest(null, error === 'array' ? error[0] : error);
      }

      ctx.send({
        jwt: strapi.plugins['users-permissions'].services.jwt.issue({
          id: user.id,
        }),
        user: sanitizeEntity(user.toJSON ? user.toJSON() : user, {
          model: strapi.query('user', 'users-permissions').model,
        }),
      });
    }
  },

  async resetPassword(ctx) {
    const params = _.assign({}, ctx.request.body, ctx.params);

    if (
      params.password &&
      params.code
    ) {
      const user = await strapi
        .query('user', 'users-permissions')
        .findOne({ resetPasswordToken: `${params.code}` });
      console.log(user, 'reset user')
      if (!user) {
        return ctx.badRequest(
          null,
          formatError({
            id: 'Auth.form.error.code.provide',
            message: '?????????????????????',
          })
        );
      }

      const password = await strapi.plugins['users-permissions'].services.user.hashPassword({
        password: params.password,
      });

      // Update the user.
      await strapi
        .query('user', 'users-permissions')
        .update({ id: user.id }, { resetPasswordToken: null, password });

      ctx.send({
        jwt: strapi.plugins['users-permissions'].services.jwt.issue({
          id: user.id,
        }),
        user: sanitizeEntity(user.toJSON ? user.toJSON() : user, {
          model: strapi.query('user', 'users-permissions').model,
        }),
      });
    }
  },

  async connect(ctx, next) {
    const grantConfig = await strapi
      .store({
        environment: '',
        type: 'plugin',
        name: 'users-permissions',
        key: 'grant',
      })
      .get();

    const [requestPath] = ctx.request.url.split('?');
    const provider = requestPath.split('/')[2];

    if (!_.get(grantConfig[provider], 'enabled')) {
      return ctx.badRequest(null, 'This provider is disabled.');
    }

    if (!strapi.config.server.url.startsWith('http')) {
      strapi.log.warn(
        'You are using a third party provider for login. Make sure to set an absolute url in config/server.js. More info here: https://strapi.io/documentation/developer-docs/latest/development/plugins/users-permissions.html#setting-up-the-server-url'
      );
    }

    // Ability to pass OAuth callback dynamically
    grantConfig[provider].callback = _.get(ctx, 'query.callback') || grantConfig[provider].callback;
    grantConfig[provider].redirect_uri = strapi.plugins[
      'users-permissions'
    ].services.providers.buildRedirectUri(provider);

    return grant(grantConfig)(ctx, next);
  },

  async forgotPassword(ctx) {
    let { email } = ctx.request.body;

    // Check if the provided email is valid or not.
    const isEmail = emailRegExp.test(email);

    if (isEmail) {
      email = email.toLowerCase();
    } else {
      return ctx.badRequest(
        null,
        formatError({
          id: 'Auth.form.error.email.format',
          message: 'Please provide valid email address.',
        })
      );
    }
    // Find the user by email.

    const user = await strapi
      .query('user', 'users-permissions')
      .findOne({ email: email.toLowerCase() });
    console.log(user, 'user')
    // User not found.
    if (!user) {
      return { status: '200', message: 'ok' };
    }

    const pluginStore = await strapi.store({
      environment: '',
      type: 'plugin',
      name: 'users-permissions',
    });
    // Generate random token.
    const resetPasswordToken = crypto.randomBytes(64).toString('hex');

    const settings = await pluginStore.get({ key: 'email' }).then(storeEmail => {
      try {
        return storeEmail['reset_password'].options;
      } catch (error) {
        return {};
      }
    });

    const advanced = await pluginStore.get({
      key: 'advanced',
    });

    const userInfo = sanitizeEntity(user, {
      model: strapi.query('user', 'users-permissions').model,
    });

    settings.message = await strapi.plugins['users-permissions'].services.userspermissions.template(
      settings.message,
      {
        URL: advanced.email_reset_password,
        USER: userInfo,
        TOKEN: resetPasswordToken,
      }
    );

    settings.object = await strapi.plugins['users-permissions'].services.userspermissions.template(
      settings.object,
      {
        USER: userInfo,
      }
    );

    try {
      // Send an email to the user.
      await strapi.plugins['email'].services.email.send({
        to: user.email,
        from:
          settings.from.email || settings.from.name
            ? `${settings.from.name} <${settings.from.email}>`
            : undefined,
        replyTo: settings.response_email,
        subject: settings.object,
        text: settings.message,
        html: settings.message,
      });
    } catch (err) {
      return ctx.badRequest(null, err);
    }

    // Update the user.
    await strapi.query('user', 'users-permissions').update({ id: user.id }, { resetPasswordToken });

    ctx.send({ ok: true });
  },

  async register(ctx, referrerToken = null) {
    const pluginStore = await strapi.store({
      environment: '',
      type: 'plugin',
      name: 'users-permissions',
    });

    const settings = await pluginStore.get({
      key: 'advanced',
    });
    console.log(settings, 'settings')
    if (!settings.allow_register) {
      return ctx.badRequest(
        null,
        fopostmarmatError({
          id: 'Auth.advanced.allow_register',
          message: 'Register action is currently disabled.',
        })
      );
    }

    const params = {
      ..._.omit(ctx.request.body, ['confirmed', 'confirmationToken', 'resetPasswordToken']),
      provider: 'local',
    };

    // Password is required.
    if (!params.password) {
      return ctx.badRequest(
        null,
        formatError({
          id: 'Auth.form.error.password.provide',
          message: 'Please provide your password.',
        })
      );
    }

    // Email is required.
    if (!params.email) {
      return ctx.badRequest(
        null,
        formatError({
          id: 'Auth.form.error.email.provide',
          message: 'Please provide your email.',
        })
      );
    }

    // Throw an error if the password selected by the user
    // contains more than three times the symbol '$'.
    if (strapi.plugins['users-permissions'].services.user.isHashed(params.password)) {
      return ctx.badRequest(
        null,
        formatError({
          id: 'Auth.form.error.password.format',
          message: 'Your password cannot contain more than three times the symbol `$`.',
        })
      );
    }

    const role = await strapi
      .query('role', 'users-permissions')
      .findOne({ type: settings.default_role }, []);

    if (!role) {
      return ctx.badRequest(
        null,
        formatError({
          id: 'Auth.form.error.role.notFound',
          message: 'Impossible to find the default role.',
        })
      );
    }

    // Check if the provided email is valid or not.
    const isEmail = emailRegExp.test(params.email);

    if (isEmail) {
      params.email = params.email.toLowerCase();
    } else {
      return ctx.badRequest(
        null,
        formatError({
          id: 'Auth.form.error.email.format',
          message: 'Please provide valid email address.',
        })
      );
    }

    params.role = role.id;
    params.password = await strapi.plugins['users-permissions'].services.user.hashPassword(params);

    const user = await strapi.query('user', 'users-permissions').findOne({
      email: params.email,
    });

    if (user && user.provider === params.provider) {
      return ctx.badRequest(
        null,
        formatError({
          id: 'Auth.form.error.email.taken',
          message: 'Email is already taken.',
        })
      );
    }

    if (user && user.provider !== params.provider && settings.unique_email) {
      return ctx.badRequest(
        null,
        formatError({
          id: 'Auth.form.error.email.taken',
          message: 'Email is already taken.',
        })
      );
    }

    try {
      if (!settings.email_confirmation) {
        params.confirmed = true;
      }

      const user = await strapi.query('user', 'users-permissions').create(params);
      const sanitizedUser = sanitizeEntity(user, {
        model: strapi.query('user', 'users-permissions').model,
      });

      if (settings.email_confirmation) {
        try {
          console.log('confirmation email sent')
          await strapi.plugins['users-permissions'].services.user.sendConfirmationEmail(user, referrerToken);
        } catch (err) {
          return ctx.badRequest(null, err);
        }

        return ctx.send({ user: sanitizedUser });
      }

      const jwt = strapi.plugins['users-permissions'].services.jwt.issue(_.pick(user, ['id']));

      return ctx.send({
        jwt,
        user: sanitizedUser,
      });
    } catch (err) {
      const adminError = _.includes(err.message, 'username')
        ? {
          id: 'Auth.form.error.username.taken',
          message: 'Username already taken',
        }
        : { id: 'Auth.form.error.email.taken', message: 'Email already taken' };

      ctx.badRequest(null, formatError(adminError));
    }
  },

  async registerWithReferral(ctx) {
    try {
      const { referralToken } = ctx.params;
      const referrer = await strapi.plugins['users-permissions'].services.jwt.verify(referralToken);
      let referrerData = await strapi.plugins['users-permissions'].services.user.fetch({
        email: referrer.email,
      });
      if (!referrerData) {
        ctx.badRequest("The referrer token is invalid.");
      }
      await this.register(ctx, referralToken);
    } catch (error) {
      const adminError = _.includes(error.message, 'username')
        ? {
          id: 'Auth.form.error.username.taken',
          message: 'Username already taken',
        }
        : _.includes(error.message, 'token')
          ? { id: 'Auth.form.error.invalid.token', message: error.message }
          : { id: 'Auth.form.error.email.taken', message: 'Email already taken' };

      ctx.badRequest(null, formatError(adminError));
    }
  },

  async registerAndEnroll(ctx) {
    const pluginStore = await strapi.store({
      environment: '',
      type: 'plugin',
      name: 'users-permissions',
    });

    const settings = await pluginStore.get({
      key: 'advanced',
    });
    if (!settings.allow_register) {
      return ctx.badRequest(
        null,
        fopostmarmatError({
          id: 'Auth.advanced.allow_register',
          message: 'Register action is currently disabled.',
        })
      );
    }

    const params = {
      ..._.omit(ctx.request.body, ['confirmed', 'confirmationToken', 'resetPasswordToken']),
      provider: 'local',
    };

    // Phone is required.
    if (!params.phone) {
      return ctx.badRequest(
        null,
        formatError({
          id: 'Auth.form.error.phone.provide',
          message: 'Please provide your phone.',
        })
      );
    }

    // Email is required.
    if (!params.email) {
      return ctx.badRequest(
        null,
        formatError({
          id: 'Auth.form.error.email.provide',
          message: 'Please provide your email.',
        })
      );
    }

    const role = await strapi
      .query('role', 'users-permissions')
      .findOne({ type: settings.default_role }, []);

    if (!role) {
      return ctx.badRequest(
        null,
        formatError({
          id: 'Auth.form.error.role.notFound',
          message: 'Impossible to find the default role.',
        })
      );
    }

    // Check if the provided email is valid or not.
    const isEmail = emailRegExp.test(params.email);

    if (isEmail) {
      params.email = params.email.toLowerCase();
    } else {
      return ctx.badRequest(
        null,
        formatError({
          id: 'Auth.form.error.email.format',
          message: 'Please provide valid email address.',
        })
      );
    }

    params.role = role.id;
    params.password = await strapi.plugins['users-permissions'].services.user.hashPassword(params);

    const user = await strapi.query('user', 'users-permissions').findOne({
      email: params.email,
    });

    if ((user && user.provider === params.provider) || (user && user.provider !== params.provider && settings.unique_email)) {
      return ctx.badRequest(
        null,
        formatError({
          id: 'Auth.form.error.email.taken',
          message: 'Email is already taken.',
        })
      );
    }

    try {
      params.confirmed = true;
      const user = await strapi.query('user', 'users-permissions').create(params);
      
      const sanitizedUser = sanitizeEntity(user, {
        model: strapi.query('user', 'users-permissions').model,
      });

      const jwt = strapi.plugins['users-permissions'].services.jwt.issue(_.pick(user, ['id']));

      const { referralToken } = ctx.params;
      try {
        if (referralToken) {
          
          const { user: userService, jwt: jwtService } = strapi.plugins['users-permissions'].services;
          const referrer = await jwtService.verify(referralToken);
          
          let referrerData = await strapi.plugins['users-permissions'].services.user.fetch({
            email: referrer.email,
          });
          const userReferralData = {
            "referral_referrer": referrerData,
            "referral_referree": user
          }

          await strapi.query('user-referral').create(userReferralData);
          let referrerNewPoint = parseInt(process.env.REFERRAL_POINT_EARNED);
          
          if (parseInt(referrerData.point) > 0) {
            referrerNewPoint = referrerNewPoint + parseInt(referrerData.point);
          }
          if (referrerNewPoint > process.env.GOLD_POINTS) {
            await userService.edit({ id: referrerData.id }, { Membership: 'Gold', point: referrerNewPoint });
          } else if (referrerNewPoint > process.env.SILVER_POINTS) {
            await userService.edit({ id: referrerData.id }, { Membership: 'Silver', point: referrerNewPoint });
          } else if (referrerNewPoint > process.env.BRONZE_POINTS) {
            await userService.edit({ id: referrerData.id }, { Membership: 'Bronze', point: referrerNewPoint });
          } else {
            await userService.edit({ id: referrerData.id }, { Membership: 'Basic', point: referrerNewPoint });
          }
        }
      } catch (error) {
        return ctx.badRequest('referrer token invalid');
      }

      return ctx.send({
        jwt,
        user: sanitizedUser,
      });
    } catch (err) {
      const adminError = _.includes(err.message, 'username')
        ? {
          id: 'Auth.form.error.username.taken',
          message: 'Username already taken',
        }
        : { id: 'Auth.form.error.email.taken', message: 'Email already taken' };

      ctx.badRequest(null, formatError(adminError));
    }
  },

  async emailConfirmation(ctx, next, returnUser) {
    const { confirmation: confirmationToken, referrerToken } = ctx.query;

    const { user: userService, jwt: jwtService } = strapi.plugins['users-permissions'].services;

    if (_.isEmpty(confirmationToken)) {
      return ctx.badRequest('token.invalid');
    }

    const user = await userService.fetch({ confirmationToken }, []);
    if (!user) {
      return ctx.badRequest('token.invalid');
    }

    await userService.edit({ id: user.id }, { confirmed: true, confirmationToken: null });

    //custom logic
    try {
      if (referrerToken) {
        const referrer = await jwtService.verify(referrerToken);
        let referrerData = await strapi.plugins['users-permissions'].services.user.fetch({
          email: referrer.email,
        });
        const userReferralData = {
          "referral_referrer": referrerData,
          "referral_referree": user
        }

        await strapi.query('user-referral').create(userReferralData);
        let referrerNewPoint = parseInt(process.env.REFERRAL_POINT_EARNED);
        if (parseInt(referrerData.point) > 0) {
          referrerNewPoint = referrerNewPoint + parseInt(referrerData.point);
        }
        if (referrerNewPoint > process.env.GOLD_POINTS) {
          await userService.edit({ id: referrerData.id }, { Membership: 'Gold', point: referrerNewPoint });
        } else if (referrerNewPoint > process.env.SILVER_POINTS) {
          await userService.edit({ id: referrerData.id }, { Membership: 'Silver', point: referrerNewPoint });
        } else if (referrerNewPoint > process.env.BRONZE_POINTS) {
          await userService.edit({ id: referrerData.id }, { Membership: 'Bronze', point: referrerNewPoint });
        } else {
          await userService.edit({ id: referrerData.id }, { Membership: 'Basic', point: referrerNewPoint });
        }
      }
    } catch (error) {
      ctx.badRequest('referrer token invalid');
    }

    if (returnUser) {
      ctx.send({
        jwt: jwtService.issue({ id: user.id }),
        user: sanitizeEntity(user, {
          model: strapi.query('user', 'users-permissions').model,
        }),
      });
    } else {
      const settings = await strapi
        .store({
          environment: '',
          type: 'plugin',
          name: 'users-permissions',
          key: 'advanced',
        })
        .get();

      ctx.redirect(`${settings.email_confirmation_redirection}/${referrerToken}` || '/');
    }
  },

  async sendEmailConfirmation(ctx) {
    const params = _.assign(ctx.request.body);
    if (!params.email) {
      return ctx.badRequest('missing.email');
    }

    const isEmail = emailRegExp.test(params.email);

    if (isEmail) {
      params.email = params.email.toLowerCase();
    } else {
      return ctx.badRequest('wrong.email');
    }

    const user = await strapi.query('user', 'users-permissions').findOne({
      email: params.email,
    });

    if (user.confirmed) {
      return ctx.badRequest('already.confirmed');
    }

    if (user.blocked) {
      return ctx.badRequest('blocked.user');
    }
    try {
      await strapi.plugins['users-permissions'].services.user.sendConfirmationEmail(user);
      ctx.send({
        email: user.email,
        sent: true,
      });
    } catch (err) {
      return ctx.badRequest(null, err);
    }
  },
  async checkReferrer(ctx) {
    const { referrerToken } = ctx.params;
    try {
      const referrer = await strapi.plugins['users-permissions'].services.jwt.verify(referrerToken);
      let referrerData = await strapi.plugins['users-permissions'].services.user.fetch({
        email: referrer.email,
      });
      if (!referrerData) {
        ctx.badRequest("The referrer token is invalid.");
      }
      ctx.send({
        referrerData
      })
    } catch (err) {
      return ctx.badRequest(null, err);
    }
  }
};
