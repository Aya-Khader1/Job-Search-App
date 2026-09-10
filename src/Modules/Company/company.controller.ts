import { Router } from "express";
import companyService from "./company.service";
import * as validators from "./company.validation";
import { validation } from "../../Middlewares/validation.middleware";
import {
  authentication,
  authorization,
} from "../../Middlewares/authentication.middleware";
import { TokenTypeEnum } from "../../Utils/security/token";
import { ROLE } from "../../Utils/enums/user.enum";
import {
  fileUpload,
  fileValidation,
  fileTypeValidation,
} from "../../Utils/upload/cloudinary";
import { isCompanyOwner } from "../../Middlewares/isCompanyOwner.middleware";
import { jobController } from "../Job";
const router = Router();
router.use("/:companyId/jobs", jobController);

router.use(authentication({ tokenType: TokenTypeEnum.ACCESS }));
router.post(
  "/add-company",
  validation(validators.addCompanySchema),
  companyService.addCompany,
);
router.patch(
  "/update-company/:companyId",
  validation(validators.updateCompanySchema),
  companyService.updateCompany,
);

router.get("/search", companyService.searchCompany);
router.get(
  "/get-company/:companyId",
  validation(validators.IdParamsCompanySchema),
  companyService.getSpecificCompany,
);
router.patch(
  "/delete-company/:companyId",
  authorization({ accessRoles: [ROLE.ADMIN, ROLE.USER] }),
  validation(validators.IdParamsCompanySchema),
  companyService.deleteCompany,
);
router.patch(
  "/upload-logo/:companyId",
  fileUpload().single("image"),
  fileTypeValidation(fileValidation.images),
  isCompanyOwner,
  companyService.uploadLogo,
);

router.delete(
  "/delete-logo/:companyId",
  isCompanyOwner,
  companyService.deleteLogo,
);

router.post(
  "/upload-cover-pics/:companyId",
  fileUpload().array("images", 5),
  fileTypeValidation(fileValidation.images),
  isCompanyOwner,
  companyService.uploadCoverPic,
);

router.delete(
  "/delete-cover-pic/:companyId",
  isCompanyOwner,
  companyService.deleteCoverPic,
);

export default router;
