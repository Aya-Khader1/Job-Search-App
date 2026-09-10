import { HCompanyDocument } from "../DB/Models/company.model";
import { HUserDocument } from "../DB/Models/user.model";
import { IPayloadToken } from "../Utils/security/token";

declare global {
  namespace Express {
    interface Request {
      user: HUserDocument;
      decoded: IPayloadToken;
      company?: HCompanyDocument;
    }
  }
}
