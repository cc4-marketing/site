/**
 * Promo Configuration
 * Toggle these to enable/disable promotional components
 */

export const promoConfig = {
    // Hello Bar (top banner)
    helloBar: {
        enabled: true,
        text: "Free: Book Publisher turns one Markdown file into a real PDF + EPUB book",
        linkText: "Get the skill",
        linkUrl: "https://bookpublisher.cc4.marketing/?utm_source=hellobar&utm_campaign=book-publisher-launch",
        storageKey: "hellobar-book-publisher-launch",
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
