export const siteData = {
  changelog: {
    apiUrl: 'https://cc4-changelog.mtri-vo.workers.dev',
  },
  navItems: [
    { label: 'Home', href: '/' },
    { label: 'Modules', href: '/#modules' },
    { label: 'Library', href: '/library/' },
    { label: 'Blog', href: '/blog/' },
    { label: 'Changelog', href: '/changelog/' },
    { label: 'GitHub', href: 'https://github.com/cc4-marketing/cc4.marketing', external: true },
  ],
  footer: {
    brand: {
      name: 'Claude Code for Marketers',
      tagline: 'A free, hands-on course for marketers who ship with AI agents.',
      copyright: 'CC4.Marketing. MIT License.',
    },
    // Column link groups for the sitemap footer
    learn: [
      { label: 'Modules', href: '/#modules' },
      { label: 'Library', href: '/library/' },
      { label: 'Blog', href: '/blog/' },
      { label: 'Changelog', href: '/changelog/' },
      { label: 'Course on GitHub', href: 'https://github.com/cc4-marketing/cc4.marketing', external: true },
    ],
    // Sister products — every *.cc4.marketing tool
    tools: [
      { label: 'Book Publisher', href: 'https://bookpublisher.cc4.marketing', external: true },
      { label: 'castmd', href: 'https://castmd.cc4.marketing', external: true },
      { label: 'Threadmark', href: 'https://threadmark.cc4.marketing', external: true },
      { label: 'MacMerge', href: 'https://macmerge.cc4.marketing', external: true },
      { label: 'Sigil', href: 'https://sigil.cc4.marketing', external: true },
      { label: 'Clip', href: 'https://clip.cc4.marketing', external: true },
      { label: 'QR', href: 'https://qr.cc4.marketing', external: true },
    ],
    support: {
      donate: '/#donate',
      paypal: 'https://paypal.me/MinhTriVo?locale.x=en_US&country.x=VN',
      kofi: 'https://ko-fi.com/cc4marketing',
    }
  },
  home: {
    features: [
      { icon: '⚡', title: '10x Speed', description: 'Campaign briefs in minutes instead of hours. Generate content at scale without losing quality.' },
      { icon: '🎯', title: 'Consistent Brand', description: 'AI agents enforce brand voice across all materials. No more tone inconsistency.' },
      { icon: '📊', title: 'Data Insights', description: 'Analyze campaign performance instantly. Turn data into actionable strategy.' },
      { icon: '🚀', title: 'More Campaigns', description: 'Ship 5x more campaigns. Focus on strategy while AI handles execution.' },
      { icon: '🤖', title: 'Custom Agents', description: 'Build your own AI team. Brand guardian, SEO specialist, copywriter.' },
      { icon: '📈', title: 'Compound Growth', description: 'Every campaign gets faster. Every project builds on the last.' },
    ],
    modules: [
      {
        number: 0,
        title: 'Getting Started',
        description: 'Install Claude Code and get your first taste of AI-powered marketing.',
        lessonCount: '4 Lessons • 30 minutes',
        lessons: ['Introduction', 'Installation', 'First Task', 'GitHub & PRs'],
        href: '/modules/0/introduction/'
      },
      {
        number: 1,
        title: 'Core Concepts',
        description: 'Master AI agents, sub-agents, and real marketing workflows with Markit agency.',
        lessonCount: '7 Lessons • 3-4 hours',
        lessons: ['Welcome to Markit', 'Working with Files', 'First Tasks', '+ 4 more lessons'],
        href: '/modules/1/welcome/'
      },
      {
        number: 2,
        title: 'Advanced Apps',
        description: 'Execute real campaigns for Planerio. Strategy to analytics.',
        lessonCount: '7 Lessons • 5-6 hours',
        lessons: ['Campaign Briefs', 'Content Strategy', 'Marketing Copy', '+ 3 more lessons'],
        href: '/modules/2/campaign-brief/'
      },
      {
        number: 3,
        title: 'Capstone',
        description: 'Ship a real personalized follow-up campaign end-to-end with sigil, an open-source CLI inside Claude Code.',
        lessonCount: '1 Lesson • 75 minutes',
        lessons: ['Ship a Real Follow-Up with sigil'],
        href: '/modules/3/ship-with-sigil/'
      },
    ],
    stats: [
      { number: '10x', label: 'Campaign Speed' },
      { number: '5x', label: 'Monthly Output' },
      { number: '+65%', label: 'Quality Scores' },
      { number: '89%', label: 'Consistency' },
    ]
  }
};
