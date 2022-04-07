module.exports = async (ctx, next) => {
    try{
        const { users_permissions_user } = ctx.request.body;
        if(!ctx.state.user || ctx.state.user.id!= users_permissions_user){
            ctx.unauthorized(`You are not the user as you stated`);
        } else {
            return await next();
        }
    } catch (e) {
        return ctx.badRequest('You must provide the lesson field in the request body.');
    }
};