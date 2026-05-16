/**
 * Promo Configuration
 * Toggle these to enable/disable promotional components
 */

export const promoConfig = {
    // Hello Bar (top banner)
    helloBar: {
        enabled: true,
        text: "New capstone — Module 3: Ship a Real Follow-Up with sigil",
        linkText: "Start lesson",
        linkUrl: "https://cc4.marketing/modules/3/ship-with-sigil/",
        storageKey: "hellobar-m3-sigil-capstone",
        cooldownDays: 3
    },

    // Floating Side Banner (appears on scroll) — global
    floatingBanner: {
        enabled: false,
        title: "Black Friday",
        subtitle: "50% off ClaudeKit.cc",
        linkText: "Grab Deal",
        linkUrl: "https://claudekit.cc/?ref=BIZE9CYY",
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
