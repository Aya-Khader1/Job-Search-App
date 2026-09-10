"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.companyType = exports.UserType = void 0;
const graphql_1 = require("graphql");
const AttachmentType = new graphql_1.GraphQLObjectType({
    name: "Attachment",
    fields: {
        secure_url: { type: graphql_1.GraphQLString },
        public_id: { type: graphql_1.GraphQLString },
    },
});
exports.UserType = new graphql_1.GraphQLObjectType({
    name: "User",
    fields: () => ({
        id: {
            type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLID),
            resolve: (parent) => parent._id.toString(),
        },
        firstName: { type: graphql_1.GraphQLString },
        lastName: { type: graphql_1.GraphQLString },
        email: { type: graphql_1.GraphQLString },
        role: { type: graphql_1.GraphQLString },
        gender: { type: graphql_1.GraphQLString },
        isConfirmed: { type: graphql_1.GraphQLBoolean },
        bannedAt: { type: graphql_1.GraphQLString },
        deletedAt: { type: graphql_1.GraphQLString },
        createdAt: { type: graphql_1.GraphQLString },
        profilePic: { type: AttachmentType },
    }),
});
exports.companyType = new graphql_1.GraphQLObjectType({
    name: "Company",
    fields: () => ({
        id: {
            type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLID),
            resolve: (parent) => parent._id.toString(),
        },
        companyName: { type: graphql_1.GraphQLString },
        description: { type: graphql_1.GraphQLString },
        industry: { type: graphql_1.GraphQLString },
        address: { type: graphql_1.GraphQLString },
        numberOfEmployees: { type: graphql_1.GraphQLString },
        companyEmail: { type: graphql_1.GraphQLString },
        createdBy: { type: graphql_1.GraphQLID },
        HRs: { type: new graphql_1.GraphQLList(graphql_1.GraphQLID) },
        logo: { type: AttachmentType },
        approvedByAdmin: { type: graphql_1.GraphQLBoolean },
        bannedAt: { type: graphql_1.GraphQLString },
        deletedAt: { type: graphql_1.GraphQLString },
    }),
});
