import { GraphQLList, GraphQLObjectType, GraphQLSchema } from "graphql";
import { companyType, UserType } from "./admin.typedefs";
import { find } from "../../../DB/db.repository";
import { UserModel } from "../../../DB/Models/user.model";
import { CompanyModel } from "../../../DB/Models/company.model";
import { IGraphQLContext } from "./admin.context";
import { ROLE } from "../../../Utils/enums/user.enum";
import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from "../../../Utils/response/error.response";

const rootQuery = new GraphQLObjectType({
  name: "Query",
  fields: {
    users: {
      type: new GraphQLList(UserType),
      resolve: async (_parent, _args, context: IGraphQLContext) => {
        if (!context.user)
          throw new UnauthorizedException("Authentication required");
        if (context.user.role !== ROLE.ADMIN)
          throw new ForbiddenException("Admin access only");
        return await find({ model: UserModel });
      },
    },
    companies: {
      type: new GraphQLList(companyType),
      resolve: async (_parent, _args, context: IGraphQLContext) => {
        if (!context.user)
          throw new UnauthorizedException("Authentication required");
        if (context.user.role !== ROLE.ADMIN)
          throw new ForbiddenException("Admin access only");
        return await find({ model: CompanyModel });
      },
    },
  },
});

export const schema = new GraphQLSchema({
  query: rootQuery,
});
