import { HydratedDocument, Model, Schema, Types, model } from "mongoose";
import { GENDER, PROVIDER, ROLE } from "../../Utils/enums/user.enum";
import { string } from "zod";
import { decrypt, encrypt } from "../../Utils/security/encryption";
import { generateHash } from "../../Utils/security/hash";
export interface IAttachment {
  secure_url: string | null;
  public_id: string | null;
}
export enum OTP_TYPE {
  CONFIRM_EMAIL = "confirmEmail",
  FORGET_PASSWORD = "forgetPassword",
}
export interface IOtp {
  code: string;
  type: OTP_TYPE;
  expiresIn: Date;
}
export interface IUser {
  _id: Types.ObjectId;
  firstName: string;

  lastName: string;
  username?: string;
  email: string;

  password?: string;

  provider: PROVIDER;
  gender: GENDER;
  role: ROLE;

  DOB?: Date;
  mobileNumber?: string;
  isConfirmed: boolean;

  deletedAt: Date;
  bannedAt: Date;
  updatedBy: Types.ObjectId;

  changeCredentialTime?: Date;
  profilePic: IAttachment;
  coverPic: IAttachment[];
  OTP?: IOtp[];
}
export const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
      minLength: 2,
      maxlength: 25,
    },
    lastName: {
      type: String,
      required: true,
      minLength: 2,
      maxlength: 25,
    },
    email: {
      type: String,
      require: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: string,
      required: function (this: IUser) {
        return this.provider === PROVIDER.SYSTEM;
      },
    },
    provider: {
      type: String,
      enum: Object.values(PROVIDER),
      default: PROVIDER.SYSTEM,
    },
    gender: {
      type: String,
      enum: Object.values(GENDER),
      default: GENDER.FEMALE,
    },
    role: {
      type: String,
      enum: Object.values(ROLE),
      default: ROLE.USER,
    },
    DOB: Date,
    mobileNumber: String,
    isConfirmed: Boolean,

    deletedAt: Date,
    bannedAt: Date,
    updatedBy: {
      type: Types.ObjectId,
      ref: "User",
    },
    changeCredentialTime: Date,
    profilePic: {
      secure_url: { type: String },
      public_id: { type: String },
    },
    coverPic: {
      type: [
        {
          secure_url: {
            type: String,
            required: true,
          },
          public_id: {
            type: String,
            required: true,
          },
        },
      ],
    },
    OTP: [{}],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);
userSchema
  .virtual("username")
  .set(function (value: string) {
    const [firstName, ...rest] = value.trim().split(/\s+/);
    this.set({ firstName, lastName: rest.join(" ") });
  })
  .get(function (this: IUser) {
    return `${this.firstName} ${this.lastName}`;
  });

userSchema.pre("save", async function (this: HUserDocument) {
  if (!this.isModified("password") || !this.password) return;
  this.password = await generateHash(this.password);
});
userSchema.pre("save", async function (this: HUserDocument) {
  if (!this.mobileNumber || !this.isModified("mobileNumber")) return;

  this.mobileNumber = await encrypt(this.mobileNumber);
});
userSchema.post("init", function (doc) {
  if (doc.mobileNumber) {
    doc.mobileNumber = decrypt(doc.mobileNumber);
  }
});
export const UserModel: Model<IUser> = model<IUser>("User", userSchema);
export type HUserDocument = HydratedDocument<IUser>;
