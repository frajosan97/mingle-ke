// resources/js/types/window.d.ts
export { };

declare global {
    interface Window {
        __authUserId: number | null;
        __authUserName: string | null;
        csrfToken: string;
    }
}