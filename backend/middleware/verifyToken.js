import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyToken = async (req,res,next)=>{
  const token = req.cookies.token;
  if(!token) 
    return res.status(401).json({success: false, message:"Unauthorized - no token provided."});

  let decoded;
  try {
    // jwt.verify throws on invalid/expired tokens, so there is no falsy result
    // to check here (the old `if(!decode)` guard was dead code).
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  }
  catch (error) {
    // An invalid/expired token is a client problem (401), not a server error
    // (500) — previously this returned 500, which misled clients and monitors.
    console.error("Error in verifyToken.",error);
    return res.status(401).json({success:false, message:"Unauthorized - invalid or expired token."});
  }

  try {
    const user = await User.findById(decoded.userId).select("isVerified tokenVersion");
    if (!user || !user.isVerified || decoded.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({success:false, message:"Unauthorized - session is no longer valid."});
    }

    req.userId = user._id.toString();
    return next();
  } catch (error) {
    console.error("Error checking authenticated user.",error);
    return res.status(500).json({success:false, message:"Unable to verify session."});
  }
};
