// resources/js/components/welcome/data.ts
import type { Profile } from "@/components/discover/profile-card";

/**
 * Landing-page escorts come from the server (HomeController).
 * This file only holds static marketing copy.
 */

export const HERO_CHAT = [
    { from: "them", text: "Hey! I saw you're 0.8 km away 👀", time: "09:41" },
    { from: "me", text: "Haha yes! Westlands too?", time: "09:42" },
    { from: "them", text: "Yep 😊 coffee sometime?", time: "09:42" },
    { from: "me", text: "How about Java tomorrow at 4?", time: "09:43" },
] as const;

export const TICKER = [
    "Real-time GPS",
    "ID-verified profiles",
    "Instant chat",
    "Discreet matches",
    "Premium priority",
    "24/7 support",
    "18+ only",
    "Zero tolerance for scams",
    "Consent-first platform",
    "Community guidelines enforced",
];

export const TESTIMONIALS = [
    {
        img: 32,
        name: "Wanjiku M.",
        city: "Nairobi",
        text: "Verified profiles gave me the confidence to try. The location filter meant my first meet was 10 minutes from home.",
    },
    {
        img: 12,
        name: "Brian O.",
        city: "Mombasa",
        text: "Premium is worth it — priority ranking means my profile actually gets seen. And the chat is discreet.",
    },
    {
        img: 47,
        name: "Aisha K.",
        city: "Kisumu",
        text: "Finally a Kenyan platform that takes verification seriously. I've never felt pushed into anything.",
    },
    {
        img: 5,
        name: "Mercy W.",
        city: "Nakuru",
        text: "The 18+ verification step made me feel safe. Real people, real profiles, no time-wasters.",
    },
    {
        img: 23,
        name: "Kevin M.",
        city: "Nairobi",
        text: "Reported a scam profile and it was gone within the hour. That's the kind of moderation this industry needs.",
    },
    {
        img: 33,
        name: "Faith A.",
        city: "Eldoret",
        text: "Found genuine connections through the nearby filter. Clear community rules mean everyone knows the boundaries.",
    },
];

/**
 * Footer link buckets. The landing footer renders:
 *   - discover  (browse / filter shortcuts)
 *   - trust     (safety, verification, moderation — compliance-critical)
 *   - legal     (policies that defend the company with regulators & M-PESA)
 */
export const FOOTER_LINKS = {
    discover: [
        { label: "Premium escorts", href: "/browse?tier=premium" },
        { label: "Regular escorts", href: "/browse?tier=regular" },
        { label: "Near me", href: "/browse?near=1" },
        { label: "Top rated", href: "/browse?sort=rating" },
        { label: "New members", href: "/browse?sort=new" },
    ],
    trust: [
        { label: "Verification process", href: "/safety/verification" },
        { label: "Community guidelines", href: "/guidelines" },
        { label: "Report a concern", href: "/report" },
        { label: "Safety center", href: "/safety/center" },
        { label: "Anti-trafficking policy", href: "/safety/anti-trafficking" },
        { label: "Law enforcement requests", href: "/legal/law-enforcement" },
    ],
    legal: [
        { label: "Terms of service", href: "/legal/terms" },
        { label: "Privacy policy (DPA)", href: "/legal/privacy" },
        { label: "18+ adult content policy", href: "/legal/adult-content" },
        { label: "Refund & coin policy", href: "/legal/refunds" },
        { label: "Cookie policy", href: "/legal/cookies" },
        { label: "Report illegal content", href: "/legal/report-illegal" },
    ],
};

export const SOCIALS = [
    {
        name: "Instagram",
        href: "https://instagram.com",
        icon: "M12 2c2.7 0 3 0 4.1.1 1 .1 1.6.2 2.1.4.6.2 1 .5 1.5 1s.8.9 1 1.5c.2.5.3 1.1.4 2.1.1 1.1.1 1.4.1 4.1s0 3-.1 4.1c-.1 1-.2 1.6-.4 2.1-.2.6-.5 1-1 1.5s-.9.8-1.5 1c-.5.2-1.1.3-2.1.4-1.1.1-1.4.1-4.1.1s-3 0-4.1-.1c-1-.1-1.6-.2-2.1-.4-.6-.2-1-.5-1.5-1s-.8-.9-1-1.5c-.2-.5-.3-1.1-.4-2.1C2 15 2 14.7 2 12s0-3 .1-4.1c.1-1 .2-1.6.4-2.1.2-.6.5-1 1-1.5s.9-.8 1.5-1c.5-.2 1.1-.3 2.1-.4C9 2 9.3 2 12 2z",
    },
    {
        name: "X",
        href: "https://x.com",
        icon: "M18.9 3H22l-7.3 8.3L23.4 21h-6.7l-5.3-6.8L5.3 21H2l7.8-8.9L1 3h6.9l4.8 6.2L18.9 3z",
    },
    {
        name: "TikTok",
        href: "https://tiktok.com",
        icon: "M19.6 6.7c-1.4-.9-2.4-2.4-2.6-4.1V2h-3.9v13.9c0 2.1-1.7 3.8-3.8 3.8s-3.8-1.7-3.8-3.8 1.7-3.8 3.8-3.8c.4 0 .8.1 1.1.2V8.3c-.4-.1-.7-.1-1.1-.1C6 8.2 3.2 11 3.2 14.4s2.8 6.2 6.2 6.2 6.2-2.8 6.2-6.2V8.9c1.5 1.1 3.3 1.7 5.2 1.7V6.7c-.4 0-.8 0-1.2-.1z",
    },
    {
        name: "Facebook",
        href: "https://facebook.com",
        icon: "M22 12a10 10 0 10-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7A10 10 0 0022 12z",
    },
];

export interface StatItem {
    value: string;
    label: string;
}