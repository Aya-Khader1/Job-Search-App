"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schema = void 0;
const graphql_1 = require("graphql");
const admin_typedefs_1 = require("./admin.typedefs");
const db_repository_1 = require("../../../DB/db.repository");
const user_model_1 = require("../../../DB/Models/user.model");
const company_model_1 = require("../../../DB/Models/company.model");
const user_enum_1 = require("../../../Utils/enums/user.enum");
const error_response_1 = require("../../../Utils/response/error.response");
const rootQuery = new graphql_1.GraphQLObjectType({
    name: "Query",
    fields: {
        users: {
            type: new graphql_1.GraphQLList(admin_typedefs_1.UserType),
            resolve: async (_parent, _args, context) => {
                if (!context.user)
                    throw new error_response_1.UnauthorizedException("Authentication required");
                if (context.user.role !== user_enum_1.ROLE.ADMIN)
                    throw new error_response_1.ForbiddenException("Admin access only");
                return await (0, db_repository_1.find)({ model: user_model_1.UserModel });
            },
        },
        companies: {
            type: new graphql_1.GraphQLList(admin_typedefs_1.companyType),
            resolve: async (_parent, _args, context) => {
                if (!context.user)
                    throw new error_response_1.UnauthorizedException("Authentication required");
                if (context.user.role !== user_enum_1.ROLE.ADMIN)
                    throw new error_response_1.ForbiddenException("Admin access only");
                return await (0, db_repository_1.find)({ model: company_model_1.CompanyModel });
            },
        },
    },
});
exports.schema = new graphql_1.GraphQLSchema({
    query: rootQuery,
});
