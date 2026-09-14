"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = exports.userSchema = exports.OTP_TYPE = void 0;
const mongoose_1 = require("mongoose");
const user_enum_1 = require("../../Utils/enums/user.enum");
const zod_1 = require("zod");
const encryption_1 = require("../../Utils/security/encryption");
const hash_1 = require("../../Utils/security/hash");
var OTP_TYPE;
(function (OTP_TYPE) {
    OTP_TYPE["CONFIRM_EMAIL"] = "confirmEmail";
    OTP_TYPE["FORGET_PASSWORD"] = "forgetPassword";
    OTP_TYPE["RESET_PASSWORD"] = "resetPassword";
})(OTP_TYPE || (exports.OTP_TYPE = OTP_TYPE = {}));
exports.userSchema = new mongoose_1.Schema({
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
        type: zod_1.string,
        required: function () {
            return this.provider === user_enum_1.PROVIDER.SYSTEM;
        },
    },
    provider: {
        type: String,
        enum: Object.values(user_enum_1.PROVIDER),
        default: user_enum_1.PROVIDER.SYSTEM,
    },
    gender: {
        type: String,
        enum: Object.values(user_enum_1.GENDER),
        default: user_enum_1.GENDER.FEMALE,
    },
    role: {
        type: String,
        enum: Object.values(user_enum_1.ROLE),
        default: user_enum_1.ROLE.USER,
    },
    DOB: Date,
    mobileNumber: String,
    isConfirmed: Boolean,
    deletedAt: Date,
    bannedAt: Date,
    updatedBy: {
        type: mongoose_1.Types.ObjectId,
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
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
exports.userSchema
    .virtual("username")
    .set(function (value) {
    const [firstName, ...rest] = value.trim().split(/\s+/);
    this.set({ firstName, lastName: rest.join(" ") });
})
    .get(function () {
    return `${this.firstName} ${this.lastName}`;
});
exports.userSchema.pre("save", async function () {
    if (!this.isModified("password") || !this.password)
        return;
    this.password = await (0, hash_1.generateHash)(this.password);
});
exports.userSchema.pre("save", async function () {
    if (!this.mobileNumber || !this.isModified("mobileNumber"))
        return;
    this.mobileNumber = await (0, encryption_1.encrypt)(this.mobileNumber);
});
exports.userSchema.post("init", function (doc) {
    if (doc.mobileNumber) {
        doc.mobileNumber = (0, encryption_1.decrypt)(doc.mobileNumber);
    }
});
exports.UserModel = (0, mongoose_1.model)("User", exports.userSchema);
