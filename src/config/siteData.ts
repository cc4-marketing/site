export const siteData = {
  changelog: {
    apiUrl: 'https://cc4-changelog.mtri-vo.workers.dev',
  },
  navItems: [
    { label: 'Home', href: '/' },
    { label: 'Modules', href: '/#modules' },
    { label: 'Blog', href: '/blog' },
    { label: 'Changelog', href: '/changelog' },
    { label: 'GitHub', href: 'https://github.com/cc4-marketing/cc4.marketing', external: true },
  ],
  footer: {
    brand: {
      name: 'Claude Code for Marketers',
      copyright: 'CC4.Marketing. MIT License.',
    },
    support: {
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
        lessons: ['Introduction', 'Installation', 'First Task'],
        href: '/modules/0/introduction'
      },
      {
        number: 1,
        title: 'Core Concepts',
        description: 'Master AI agents, sub-agents, and real marketing workflows with Markit agency.',
        lessonCount: '7 Lessons • 3-4 hours',
        lessons: ['Welcome to Markit', 'Working with Files', 'First Tasks', '+ 4 more lessons'],
        href: '/modules/1/welcome'
      },
      {
        number: 2,
        title: 'Advanced Apps',
        description: 'Execute real campaigns for Planerio. Strategy to analytics.',
        lessonCount: '6 Lessons • 4-5 hours',
        lessons: ['Campaign Briefs', 'Content Strategy', 'Marketing Copy', '+ 3 more lessons'],
        href: '/modules/2/campaign-brief'
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
