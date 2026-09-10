import { Router } from "express";
import jobService from "./job.service";
import * as validators from "./job.validation";
import { validation } from "../../Middlewares/validation.middleware";
import {
  authentication,
  authorization,
} from "../../Middlewares/authentication.middleware";
import { TokenTypeEnum } from "../../Utils/security/token";
import { isCompanyAuthorized } from "../../Middlewares/isCompanyAuthorized";
import { ROLE } from "../../Utils/enums/user.enum";
import {
  fileTypeValidation,
  fileUpload,
  fileValidation,
} from "../../Utils/upload/cloudinary";

const router = Router({ mergeParams: true });
router.use(authentication({ tokenType: TokenTypeEnum.ACCESS }));
router.post(
  "/add-job",
  validation(validators.addJobSchema),
  isCompanyAuthorized({ owner: true, hr: true }),
  jobService.addJob,
);
router.patch(
  "/update-job/:jobId",
  isCompanyAuthorized({ owner: true }),
  jobService.updateJob,
);
router.delete(
  "/delete-job/:jobId",
  isCompanyAuthorized({ owner: true, hr: true }),
  jobService.deleteJob,
);
router.get("/get{/:jobId}", jobService.getJobs);
router.get(
  "/get-match",
  validation(validators.getMatchedJobQuery),
  jobService.getMatchedJobs,
);
router.post(
  "/apply-job/:jobId",
  authorization({ accessRoles: [ROLE.USER] }),
  fileUpload().single("cv"),
  fileTypeValidation(fileValidation.documents),
  jobService.applyJob,
);
router.get(
  "/get-applications/:jobId",
  isCompanyAuthorized({ owner: true, hr: true }),
  jobService.getAllApplication,
);
router.patch(
  "/status-application/:applicationId",
  validation(validators.updateApplicationStatusSchema),
  isCompanyAuthorized({ owner: true, hr: true }),

  jobService.updateApplicationStatus,
);

export default router;
