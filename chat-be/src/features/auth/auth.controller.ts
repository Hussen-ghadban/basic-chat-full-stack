import { Request, Response } from "express";
import * as AuthService from "./auth.services";
import prisma from "../../lib/prisma";

export async function signupController(req: Request, res: Response) {
  try {
    const { name, email, password, } = req.body;
    const user = await AuthService.signup(name, email, password);
    res.status(201).json({ message:"user created successfully" });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}