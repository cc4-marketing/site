/**
 * Promo Configuration
 * Toggle these to enable/disable promotional components
 */

export const promoConfig = {
    // Hello Bar (top banner)
    helloBar: {
        enabled: true,
        text: "ClaudeKit Marketing v1.3.0 just dropped",
        linkText: "See what's new",
        linkUrl: "https://claudekit.cc/updates/claudekit-marketing/v1-3-0-the-biggest-update-yet?ref=BIZE9CYY",
        storageKey: "hellobar-claudekit-v130",
        cooldownDays: 3  // Re-show after 3 days
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
        storageKey: "lesson-promo-claudekit-v130",
        cooldownDays: 3,
        linkUrl: "https://claudekit.cc/?ref=BIZE9CYY",
        releaseNotesUrl: "https://claudekit.cc/updates/claudekit-marketing/v1-3-0-the-biggest-update-yet?ref=BIZE9CYY"
    }
};
