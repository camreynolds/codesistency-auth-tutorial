import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email:{
    type:String,
    required:true,
    unique:true,
    trim:true,
    lowercase:true,
    maxlength:254,
  },
  password:{
    type:String,
    required:true,
  },
  name:{
    type:String,
    required:true,
    trim:true,
    maxlength:100,
  },
  lastLogin:{
    type:Date,
    default:Date.now,
  },
  isVerified:{
    type:Boolean,
    default:false
  },
  tokenVersion:{
    type:Number,
    default:0,
  },
  resetPasswordToken: String,
  resetPasswordExpiredAt: Date,
  verificationToken: String,
  verificationTokenExpiredAt: Date,
},{timestamps:true});

userSchema.index({verificationToken:1}, {sparse:true});
userSchema.index({resetPasswordToken:1}, {sparse:true});

// Strip sensitive/internal fields from JSON responses (password hash, tokens,
// __v) so they can never leak via res.json(). Previously the controllers
// spread `...user._doc`, which exposed verificationToken, resetPasswordToken,
// and other internals to the client.
userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.verificationToken;
    delete ret.verificationTokenExpiredAt;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpiredAt;
    delete ret.tokenVersion;
    delete ret.__v;
    return ret;
  },
});

// createdAt and updatedAt fields will be automatically added into the document.

export const User = mongoose.model("User", userSchema);