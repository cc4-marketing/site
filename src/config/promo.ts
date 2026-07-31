/**
 * Promo Configuration
 * Toggle these to enable/disable promotional components
 */

export const promoConfig = {
    // Hello Bar (top banner)
    helloBar: {
        enabled: true,
        text: "New lesson — Send Merge Campaigns at Scale, Safely (Module 3.1)",
        linkText: "Start lesson",
        linkUrl: "https://cc4.marketing/modules/3/merge-campaigns-safely/",
        storageKey: "hellobar-m31-merge-campaigns",
        cooldownDays: 3
    },

    // Floating Side Banner (appears on scroll), global
    floatingBanner: {
        enabled: true,
        badge: "NEW LESSON",
        title: "Merge campaigns, safely",
        subtitle: "Module 3.1: the safe-send protocol for bulk personalized email with an AI agent",
        linkText: "Start the lesson",
        linkUrl: "https://cc4.marketing/modules/3/merge-campaigns-safely/",
        triggerPercent: 70
    },

    // Lesson Promo Banner (floating inside course lessons)
    lessonBanner: {
        enabled: true,
        storageKey: "lesson-promo-m3-sigil-capstone",
        cooldownDays: 3,
        linkUrl: "https://cc4.marketing/modules/3/ship-with-sigil/",
        releaseNotesUrl: "https://github.com/blacklogos/sigil"
    }
};
