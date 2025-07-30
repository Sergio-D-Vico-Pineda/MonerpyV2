import { login } from "./accounts/login.ts";
import { create } from "./accounts/create.ts";
import { logout } from "./accounts/logout.ts";

export const server = {
    login: login,
    create: create,
    logout: logout
};