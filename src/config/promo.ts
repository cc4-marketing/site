/**
 * Promo Configuration
 * Toggle these to enable/disable promotional components
 */

export const promoConfig = {
    // Hello Bar (top banner)
    helloBar: {
        enabled: true,
        text: "New lesson — Module 2.7: Turn a finished engagement into a sellable service",
        linkText: "Start lesson",
        linkUrl: "https://cc4.marketing/modules/2/service-package-from-engagement/",
        storageKey: "hellobar-m27-service-package",
        cooldownDays: 3
    },

    // Floating Side Banner (appears on scroll), global
    floatingBanner: {
        enabled: true,
        badge: "NEW LESSON",
        title: "Sell it as a service",
        subtitle: "Module 2.7: turn a finished engagement into a sellable service package",
        linkText: "Start the lesson",
        linkUrl: "https://cc4.marketing/modules/2/service-package-from-engagement/",
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
