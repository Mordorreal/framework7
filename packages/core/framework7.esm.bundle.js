/**
 * Framework7 3.4.2
 * Full featured mobile HTML framework for building iOS & Android apps
 * http://framework7.io/
 *
 * Copyright 2014-2018 Vladimir Kharlampidi
 *
 * Released under the MIT License
 *
 * Released on: October 4, 2018
 */

import Template7 from 'template7';
import $ from 'dom7';

// F7 Class
import Framework7 from './components/app/app-class';

// Import Helpers
import Request from './utils/request';
import Utils from './utils/utils';
import Support from './utils/support';
import Device from './utils/device';

// Core Modules
import DeviceModule from './modules/device/device';
import SupportModule from './modules/support/support';
import UtilsModule from './modules/utils/utils';
import ResizeModule from './modules/resize/resize';
import RequestModule from './modules/request/request';
import TouchModule from './modules/touch/touch';
import ClicksModule from './modules/clicks/clicks';
import RouterModule from './modules/router/router';
import HistoryModule from './modules/history/history';
import StorageModule from './modules/storage/storage';
import ComponentModule from './modules/component/component';

// Core Components
import Statusbar from './components/statusbar/statusbar';
import View from './components/view/view';
import Navbar from './components/navbar/navbar';
import Toolbar from './components/toolbar/toolbar';
import Subnavbar from './components/subnavbar/subnavbar';
import TouchRipple from './components/touch-ripple/touch-ripple';
import Modal from './components/modal/modal';

import Dialog from './components/dialog/dialog';
import Popup from './components/popup/popup';
import LoginScreen from './components/login-screen/login-screen';
import Popover from './components/popover/popover';
import Actions from './components/actions/actions';
import Sheet from './components/sheet/sheet';
import Toast from './components/toast/toast';
import Preloader from './components/preloader/preloader';
import Swipeout from './components/swipeout/swipeout';
import Tabs from './components/tabs/tabs';
import Panel from './components/panel/panel';
import Card from './components/card/card';
import Chip from './components/chip/chip';
import Form from './components/form/form';
import Input from './components/input/input';
import Checkbox from './components/checkbox/checkbox';
import Radio from './components/radio/radio';
import Toggle from './components/toggle/toggle';
import Range from './components/range/range';
import Stepper from './components/stepper/stepper';
import SmartSelect from './components/smart-select/smart-select';
import Grid from './components/grid/grid';
import Calendar from './components/calendar/calendar';
import Picker from './components/picker/picker';
import Searchbar from './components/searchbar/searchbar';
import Messages from './components/messages/messages';
import Messagebar from './components/messagebar/messagebar';
import Swiper from './components/swiper/swiper';
import PhotoBrowser from './components/photo-browser/photo-browser';
import Typography from './components/typography/typography';

if ("es" !== 'es') {
  if (typeof window !== 'undefined') {
    // Template7
    if (!window.Template7) window.Template7 = Template7;

    // Dom7
    if (!window.Dom7) window.Dom7 = $;
  }
}

// Install Core Modules & Components
Framework7.use([
  DeviceModule,
  SupportModule,
  UtilsModule,
  ResizeModule,
  RequestModule,
  TouchModule,
  ClicksModule,
  RouterModule,
  HistoryModule,
  StorageModule,
  ComponentModule,
  Statusbar,
  View,
  Navbar,
  Toolbar,
  Subnavbar,
  TouchRipple,
  Modal,
  Dialog,
  Popup,
  LoginScreen,
  Popover,
  Actions,
  Sheet,
  Toast,
  Preloader,
  Swipeout,
  Tabs,
  Panel,
  Card,
  Chip,
  Form,
  Input,
  Checkbox,
  Radio,
  Toggle,
  Range,
  Stepper,
  SmartSelect,
  Grid,
  Calendar,
  Picker,
  Searchbar,
  Messages,
  Messagebar,
  Swiper,
  PhotoBrowser,
  Typography
]);

export { Template7, $ as Dom7, Request, Utils, Device, Support };
export default Framework7;
