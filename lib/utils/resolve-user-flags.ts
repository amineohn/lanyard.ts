export function resolveUserFlags(flags: number): string[] {
    const badgeList: string[] = [];
    const flagMap = {
        STAFF: 1 << 0,
        PARTNER: 1 << 1,
        HYPESQUAD: 1 << 2,
        BUGHUNTER: 1 << 3,
        HYPESQUAD_EVENTS: 1 << 6,
        PREFERRED_LANGUAGE: 1 << 7,
        NOTIFICATIONS: 1 << 8,
    };

    Object.entries(flagMap).forEach(([badge, flag]) => {
        if (flags & flag) badgeList.push(badge);
    });

    return badgeList;
}