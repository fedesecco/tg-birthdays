import { admins } from './enums';

export function randomNumber(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

export function isAdmin(texter: number) {
    return admins.includes(texter);
}
