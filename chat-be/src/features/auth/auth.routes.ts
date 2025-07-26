import { Router } from "express";
import { signupController, userController, usersController } from "./auth.controller";

const router = Router();

router.post("/signup", signupController);
router.get("/users",usersController);
// GET /auth/users/:id
router.get("/users/:id", userController);

export default router;
