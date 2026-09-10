import { HydratedDocument, Model, Schema, Types, model } from "mongoose";

export interface IAttachment {
  secure_url: string;
  public_id: string;
}

export enum ApplicationStatus {
  pending = "pending",
  accepted = "accepted",
  rejected = "rejected",
}

export interface IApplication {
  _id: Types.ObjectId;
  jobId: Types.ObjectId;
  userId: Types.ObjectId;
  userCV: IAttachment;
  status: ApplicationStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

const applicationSchema = new Schema<IApplication>(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userCV: {
      secure_url: { type: String, required: true },
      public_id: { type: String, required: true },
    },
    status: {
      type: String,
      enum: Object.values(ApplicationStatus),
      default: ApplicationStatus.pending,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

export const ApplicationModel: Model<IApplication> = model<IApplication>(
  "Application",
  applicationSchema,
);

export type HApplicationDocument = HydratedDocument<IApplication>;
