import { HydratedDocument, Model, Schema, Types, model } from "mongoose";
import { IUser } from "./user.model";
import { Query } from "mongoose";
import { deleteMany } from "../db.repository";
import { JobModel } from "./job.model";

export interface IAttachment {
  secure_url: string;
  public_id: string;
}

export const employeeRanges = [
  "1-10",
  "11-20",
  "21-50",
  "51-100",
  "101-500",
  "500+",
] as const;

export type EmployeeRange = (typeof employeeRanges)[number];

export interface ICompany {
  _id: Types.ObjectId;
  companyName: string;
  description: string;
  industry: string;
  address: string;
  numberOfEmployees: EmployeeRange;
  companyEmail: string;
  createdBy: Types.ObjectId;
  logo?: IAttachment;
  coverPic?: IAttachment[];
  HRs?: Types.ObjectId[];
  deletedAt?: Date;
  bannedAt?: Date;
  legalAttachment?: IAttachment;
  approvedByAdmin: boolean;
}

export const companySchema = new Schema<ICompany>(
  {
    companyName: {
      type: String,
      required: true,
      unique: true,
      minLength: 2,
      maxlength: 25,
    },

    description: {
      type: String,
      required: true,
      minLength: 2,
      maxlength: 100,
    },

    industry: {
      type: String,
      required: true,
      minLength: 2,
      maxlength: 40,
    },

    address: {
      type: String,
      required: true,
    },

    numberOfEmployees: {
      type: String,
      enum: employeeRanges,
      required: true,
    },

    companyEmail: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    HRs: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    logo: {
      type: {
        secure_url: { type: String, required: true },
        public_id: { type: String, required: true },
      },
    },

    coverPic: {
      type: [
        {
          secure_url: { type: String, required: true },
          public_id: { type: String, required: true },
        },
      ],
      default: [],
    },

    legalAttachment: {
      type: {
        secure_url: { type: String, required: true },
        public_id: { type: String, required: true },
      },
    },

    approvedByAdmin: {
      type: Boolean,
      default: false,
    },

    deletedAt: Date,
    bannedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);
companySchema.pre("findOneAndDelete", async function (next) {
  try {
    const company = await this.model.findOne(this.getFilter());
    if (!company) return next();
    const jobs = await JobModel.find({ companyId: company._id }).select("_id");

    for (const job of jobs) {
      await JobModel.findOneAndDelete({ _id: job._id });
    }
    next();
  } catch (error) {
    next(error as Error);
  }
});
companySchema.pre(["find", "findOne"], function (next) {
  this.where({ deletedAt: { $exists: false } });
  next();
});

companySchema.virtual("jobs", {
  ref: "Job",
  localField: "_id",
  foreignField: "companyId",
});
companySchema.index({ companyName: 1 });

export const CompanyModel: Model<ICompany> = model<ICompany>(
  "Company",
  companySchema,
);

export type HCompanyDocument = HydratedDocument<ICompany>;
