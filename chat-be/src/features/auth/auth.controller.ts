import { Request, Response } from "express";
import * as AuthService from "./auth.services";
import prisma from "../../lib/prisma";

export async function signupController(req: Request, res: Response) {
  try {
    const { name, email, password,publicKey  } = req.body;
    const user = await AuthService.signup(name, email, password,publicKey );
    res.status(201).json({ message:"user created successfully" ,data: user });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}
export async function usersController(req: Request, res: Response) {
  try {
    const users = await prisma.user.findMany();
    res.status(200).json({ data: users });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
}
export async function userController(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ data: user });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to fetch user" });
  }
}
