// src/lib/utils/cookies.ts
import Cookies from 'js-cookie';

export interface CookieOptions {
    expires?: number; // days
    path?: string;
    domain?: string;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
}

export const setCookie = (name: string, value: string, options: CookieOptions = {}) => {
    const defaultOptions: CookieOptions = {
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    };

    Cookies.set(name, value, { ...defaultOptions, ...options });
};

export const getCookie = (name: string): string | undefined => {
    return Cookies.get(name);
};

export const removeCookie = (name: string, options: CookieOptions = {}) => {
    Cookies.remove(name, { path: '/', ...options });
};

export const clearAllCookies = () => {
    const cookies = Cookies.get();
    Object.keys(cookies).forEach((name) => {
        removeCookie(name);
    });
};