import express from "express";
import { checkAuth,login, signup, updateprofile } from "../controllers/user.controller";
import { protectRoute } from "../middlewares/auth.middleware";

const userRouter = express.Router();

userRouter.post("/signup",signup);
userRouter.post("/login",login);
userRouter.post("/update-profile",protectRoute,updateprofile);
userRouter.post("/check",protectRoute,checkAuth);


export default userRouter;