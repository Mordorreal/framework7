/**
 * F7 Build Configuration
 * Don't modify this file!
 * If you want to build custom version of F7, just put build-config-custom.js with the required configuration in this folder. Or build it using command line:
 * $ npm run build-core:prod -- --config path/to/config.js --output path/to/output/folder
 */

const config = {
  target: 'universal',
  rtl: false,
  components: [
    // Modals
    'dialog',
    'popup',
    'login-screen',
    'popover',
    'actions',
    'sheet',
    'toast',

    // Loaders
    'preloader',
    // 'progressbar',

    // List Components
    // 'sortable',
    // 'swipeout',
    // 'accordion',
    // 'contacts-list',
    // 'virtual-list',
    // 'list-index',

    // Timeline
    // 'timeline',

    // Tabs
    'tabs',

    // Panel
    'panel',

    // Card
    'card',

    // Chip
    'chip',

    // Form Components
    'form',
    'input',
    'checkbox',
    'radio',
    'toggle',
    'range',
    'stepper',
    'smart-select',

    // Grid
    'grid',

    // Pickers
    'calendar',
    'picker',

    // Page Components
    // 'infinite-scroll',
    // 'pull-to-refresh',
    // 'lazy',

    // Data table
    // 'data-table',

    // FAB
    // 'fab',

    // Searchbar
    'searchbar',

    // Messages
    'messages',
    'messagebar',

    // Swiper
    'swiper',

    // Photo Browser
    'photo-browser',

    // Notifications
    // 'notification',

    // Autocomplete
    // 'autocomplete',

    // Tooltip
    // 'tooltip',

    // Gauge
    // 'gauge',

    // VI Video Ads
    // 'vi',

    // Elevation
    // 'elevation',

    // Typography
    'typography',
  ],
  darkTheme: true,
  themes: ['ios'],
  ios: {
    themeColor: '#777aff',
    colors: {
      black: '#000000',
      blue: '#00d1e0',
      gray: '#c5d2d7',
      green: '#1bbd8e',
      orange: '#f78000',
      pink: '#fa4b93',
      red: '#ef5350',
      white: '#ffffff',
      yellow: '#f9c70b',
    },
  },
};

module.exports = config;
