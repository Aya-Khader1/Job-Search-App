import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql";
const AttachmentType = new GraphQLObjectType({
  name: "Attachment",
  fields: {
    secure_url: { type: GraphQLString },
    public_id: { type: GraphQLString },
  },
});
export const UserType = new GraphQLObjectType({
  name: "User",
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLID),
      resolve: (parent) => parent._id.toString(),
    },
    firstName: { type: GraphQLString },
    lastName: { type: GraphQLString },
    email: { type: GraphQLString },
    role: { type: GraphQLString },
    gender: { type: GraphQLString },
    isConfirmed: { type: GraphQLBoolean },
    bannedAt: { type: GraphQLString },
    deletedAt: { type: GraphQLString },
    createdAt: { type: GraphQLString },
    profilePic: { type: AttachmentType },
  }),
});
export const companyType = new GraphQLObjectType({
  name: "Company",
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLID),
      resolve: (parent) => parent._id.toString(),
    },
    companyName: { type: GraphQLString },
    description: { type: GraphQLString },
    industry: { type: GraphQLString },
    address: { type: GraphQLString },
    numberOfEmployees: { type: GraphQLString },
    companyEmail: { type: GraphQLString },
    createdBy: { type: GraphQLID },
    HRs: { type: new GraphQLList(GraphQLID) },
    logo: { type: AttachmentType },
    approvedByAdmin: { type: GraphQLBoolean },
    bannedAt: { type: GraphQLString },
    deletedAt: { type: GraphQLString },
  }),
});
