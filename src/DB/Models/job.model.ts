import { HydratedDocument, Model, Schema, Types, model } from "mongoose";
import { deleteMany, findOne } from "../db.repository";
import { ApplicationModel } from "./application.model";

export enum JobLocation {
  onsite = "onsite",
  remotely = "remotely",
  hybrid = "hybrid",
}

export enum WorkingTime {
  partTime = "part-time",
  fullTime = "full-time",
}

export enum SeniorityLevel {
  fresh = "fresh",
  junior = "junior",
  midLevel = "mid-level",
  senior = "senior",
  teamLead = "team-lead",
  cto = "cto",
}

export interface IJob {
  _id: Types.ObjectId;
  jobTitle: string;
  jobLocation: JobLocation;
  workingTime: WorkingTime;
  jobDescription: string;
  seniorityLevel: SeniorityLevel;
  technicalSkills: string[];
  softSkills: string[];
  addedBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  companyId: Types.ObjectId;
  closed?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const jobSchema = new Schema<IJob>(
  {
    jobTitle: {
      type: String,
      required: true,
      min: 3,
      max: 64,
      trim: true,
    },
    jobLocation: {
      type: String,
      enum: Object.values(JobLocation),
      required: true,
    },
    workingTime: {
      type: String,
      enum: Object.values(WorkingTime),
      required: true,
    },
    jobDescription: {
      type: String,
      required: true,
      trim: true,
    },
    seniorityLevel: {
      type: String,
      enum: Object.values(SeniorityLevel),
      required: true,
    },
    technicalSkills: {
      type: [String],
      default: [],
    },
    softSkills: {
      type: [String],
      default: [],
    },
    addedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    closed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);
jobSchema.virtual("applications", {
  ref: "Application",
  localField: "_id",
  foreignField: "applicationId",
});
jobSchema.pre("findOneAndDelete", async function (next) {
  try {
    const job = await this.model.findOne(this.getFilter());
    if (!job) return next();

    await deleteMany({
      model: ApplicationModel,
      filter: { jobId: job._id },
    });
    next();
  } catch (error) {
    next(error as Error);
  }
});
export const JobModel: Model<IJob> = model<IJob>("Job", jobSchema);

export type HJobDocument = HydratedDocument<IJob>;
