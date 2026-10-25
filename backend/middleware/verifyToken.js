import jwt from "jsonwebtoken";

export const verifyToken = (req,res,next)=>{
  const token = req.cookies.token;
  if(!token) 
    return res.status(401).json({success: false, message:"Unauthorized - no token provided."});

  try {
    // jwt.verify throws on invalid/expired tokens, so there is no falsy result
    // to check here (the old `if(!decode)` guard was dead code).
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  }
  catch (error) {
    // An invalid/expired token is a client problem (401), not a server error
    // (500) — previously this returned 500, which misled clients and monitors.
    console.error("Error in verifyToken.",error);
    return res.status(401).json({success:false, message:"Unauthorized - invalid or expired token."});
  }
};
