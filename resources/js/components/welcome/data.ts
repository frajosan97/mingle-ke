// resources/js/components/landing/data.ts
import type { Profile } from "@/components/discover/profile-card";

export const PREMIUM: Profile[] = [
    { id: 1, name: "Wanjiku", age: 24, distanceKm: 0.8, locationName: "Westlands", ratingAvg: 4.9, avatarUrl: "https://i.pravatar.cc/400?img=20", verified: true, isVip: true, isEscort: true, online: true, gender: "female", bio: null, services: [], available: true, availabilityStatus: "online", rate1Hour: null },
    { id: 2, name: "Aisha", age: 26, distanceKm: 1.2, locationName: "Kilimani", ratingAvg: 5.0, avatarUrl: "https://i.pravatar.cc/400?img=45", verified: true, isVip: true, isEscort: true, online: true, gender: "female", bio: null, services: [], available: true, availabilityStatus: "online", rate1Hour: null },
    { id: 5, name: "Cynthia", age: 27, distanceKm: 3.4, locationName: "Karen", ratingAvg: 4.8, avatarUrl: "https://i.pravatar.cc/400?img=44", verified: true, isVip: true, isEscort: true, online: false, gender: "female", bio: null, services: [], available: true, availabilityStatus: "online", rate1Hour: null },
    { id: 9, name: "Zawadi", age: 25, distanceKm: 1.9, locationName: "Kileleshwa", ratingAvg: 4.9, avatarUrl: "https://i.pravatar.cc/400?img=49", verified: true, isVip: true, isEscort: true, online: true, gender: "female", bio: null, services: [], available: true, availabilityStatus: "online", rate1Hour: null },
    { id: 11, name: "Faith", age: 22, distanceKm: 0.5, locationName: "Westlands", ratingAvg: 5.0, avatarUrl: "https://i.pravatar.cc/400?img=23", verified: true, isVip: true, isEscort: true, online: true, gender: "female", bio: null, services: [], available: true, availabilityStatus: "online", rate1Hour: null },
    { id: 12, name: "Mercy", age: 29, distanceKm: 2.8, locationName: "Lavington", ratingAvg: 4.7, avatarUrl: "https://i.pravatar.cc/400?img=33", verified: true, isVip: true, isEscort: true, online: false, gender: "female", bio: null, services: [], available: true, availabilityStatus: "online", rate1Hour: null },
];

export const REGULAR: Profile[] = [
    { id: 3, name: "Brenda", age: 23, distanceKm: 2.1, locationName: "Parklands", ratingAvg: 4.7, avatarUrl: "https://i.pravatar.cc/400?img=47", verified: false, isVip: false, isEscort: true, online: true, gender: "female", bio: null, services: [], available: true, availabilityStatus: "online", rate1Hour: null },
    { id: 4, name: "Njeri", age: 25, distanceKm: 2.6, locationName: "Lavington", ratingAvg: 4.8, avatarUrl: "https://i.pravatar.cc/400?img=32", verified: true, isVip: false, isEscort: true, online: false, gender: "female", bio: null, services: [], available: true, availabilityStatus: "online", rate1Hour: null },
    { id: 7, name: "Sharon", age: 24, distanceKm: 5.2, locationName: "South B", ratingAvg: 4.6, avatarUrl: "https://i.pravatar.cc/400?img=31", verified: false, isVip: false, isEscort: true, online: true, gender: "female", bio: null, services: [], available: true, availabilityStatus: "online", rate1Hour: null },
    { id: 10, name: "Diana", age: 28, distanceKm: 4.5, locationName: "Riverside", ratingAvg: 4.9, avatarUrl: "https://i.pravatar.cc/400?img=26", verified: true, isVip: false, isEscort: true, online: false, gender: "female", bio: null, services: [], available: true, availabilityStatus: "online", rate1Hour: null },
    { id: 13, name: "Naomi", age: 21, distanceKm: 1.4, locationName: "Kilimani", ratingAvg: 4.9, avatarUrl: "https://i.pravatar.cc/400?img=5", verified: true, isVip: false, isEscort: true, online: true, gender: "female", bio: null, services: [], available: true, availabilityStatus: "online", rate1Hour: null },
    { id: 14, name: "Purity", age: 26, distanceKm: 3.1, locationName: "Kileleshwa", ratingAvg: 4.8, avatarUrl: "https://i.pravatar.cc/400?img=9", verified: false, isVip: false, isEscort: true, online: false, gender: "female", bio: null, services: [], available: true, availabilityStatus: "online", rate1Hour: null },
];

export const HERO_CHAT = [
    { from: "them", text: "Hey! I saw you're 0.8 km away 👀", time: "09:41" },
    { from: "me", text: "Haha yes! Westlands too?", time: "09:42" },
    { from: "them", text: "Yep 😊 coffee sometime?", time: "09:42" },
    { from: "me", text: "How about Java tomorrow at 4?", time: "09:43" },
] as const;

export const TICKER = [
    "Real-time GPS",
    "Verified profiles",
    "Instant chat",
    "Discreet matches",
    "Premium priority",
    "24/7 support",
    "18+ only",
    "ID-verified members",
    "Zero tolerance for scams",
];

export const STATS = [
    { value: "12K+", label: "Members" },
    { value: "4.9★", label: "Rating" },
    { value: "98%", label: "Verified" },
    { value: "24/7", label: "Support" },
];

export const TESTIMONIALS = [
    { img: 32, name: "Wanjiku M.", city: "Nairobi", text: "I met my partner here 6 months ago. The location feature made it so easy to find someone in my area." },
    { img: 12, name: "Brian O.", city: "Mombasa", text: "Premium is worth every shilling. The priority ranking means my profile actually gets seen." },
    { img: 47, name: "Aisha K.", city: "Kisumu", text: "Finally an app built for Kenya. The match suggestions are incredibly accurate." },
    { img: 5, name: "Mercy W.", city: "Nakuru", text: "Discreet, safe, and the chat feels natural. I never felt pressured." },
    { img: 23, name: "Kevin M.", city: "Nairobi", text: "The verified badges give me confidence. No fake profiles, no wasted time." },
    { img: 33, name: "Faith A.", city: "Eldoret", text: "Found my best friend here! The nearby filter is genius." },
];

export const FOOTER_LINKS = {
    discover: [
        { label: "Premium escorts", href: "/browse?tier=premium" },
        { label: "Regular escorts", href: "/browse?tier=regular" },
        { label: "Near me", href: "/browse?near=1" },
        { label: "New members", href: "/browse?sort=new" },
        { label: "Top rated", href: "/browse?sort=rating" },
    ],
    company: [
        { label: "About us", href: "/about" },
        { label: "How it works", href: "/how-it-works" },
        { label: "Careers", href: "/careers" },
        { label: "Blog", href: "/blog" },
        { label: "Contact", href: "/contact" },
    ],
    support: [
        { label: "Help center", href: "/help" },
        { label: "Safety tips", href: "/safety" },
        { label: "Report user", href: "/report" },
        { label: "FAQ", href: "/faq" },
        { label: "Community", href: "/community" },
    ],
    legal: [
        { label: "Terms of service", href: "/terms" },
        { label: "Privacy policy", href: "/privacy" },
        { label: "Cookie policy", href: "/cookies" },
        { label: "18+ notice", href: "/age-notice" },
        { label: "Refund policy", href: "/refunds" },
    ],
};

export const SOCIALS = [
    { name: "Instagram", href: "https://instagram.com", icon: "M12 2c2.7 0 3 0 4.1.1 1 .1 1.6.2 2.1.4.6.2 1 .5 1.5 1s.8.9 1 1.5c.2.5.3 1.1.4 2.1.1 1.1.1 1.4.1 4.1s0 3-.1 4.1c-.1 1-.2 1.6-.4 2.1-.2.6-.5 1-1 1.5s-.9.8-1.5 1c-.5.2-1.1.3-2.1.4-1.1.1-1.4.1-4.1.1s-3 0-4.1-.1c-1-.1-1.6-.2-2.1-.4-.6-.2-1-.5-1.5-1s-.8-.9-1-1.5c-.2-.5-.3-1.1-.4-2.1C2 15 2 14.7 2 12s0-3 .1-4.1c.1-1 .2-1.6.4-2.1.2-.6.5-1 1-1.5s.9-.8 1.5-1c.5-.2 1.1-.3 2.1-.4C9 2 9.3 2 12 2z" },
    { name: "X", href: "https://x.com", icon: "M18.9 3H22l-7.3 8.3L23.4 21h-6.7l-5.3-6.8L5.3 21H2l7.8-8.9L1 3h6.9l4.8 6.2L18.9 3z" },
    { name: "TikTok", href: "https://tiktok.com", icon: "M19.6 6.7c-1.4-.9-2.4-2.4-2.6-4.1V2h-3.9v13.9c0 2.1-1.7 3.8-3.8 3.8s-3.8-1.7-3.8-3.8 1.7-3.8 3.8-3.8c.4 0 .8.1 1.1.2V8.3c-.4-.1-.7-.1-1.1-.1C6 8.2 3.2 11 3.2 14.4s2.8 6.2 6.2 6.2 6.2-2.8 6.2-6.2V8.9c1.5 1.1 3.3 1.7 5.2 1.7V6.7c-.4 0-.8 0-1.2-.1z" },
    { name: "Facebook", href: "https://facebook.com", icon: "M22 12a10 10 0 10-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7A10 10 0 0022 12z" },
];