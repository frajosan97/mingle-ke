export interface County {
    id: number;
    name: string;
    slug: string;
}

export interface Town {
    id: number;
    county_id: number;   // ← add this (matches backend select + emit)
    name: string;
    slug: string;
    is_major: boolean;   // ← only true if backend casts (bool)
}

export interface CountyWithTowns extends County {
    towns: Town[];
}