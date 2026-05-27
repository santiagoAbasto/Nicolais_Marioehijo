import '../css/admin/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { addIcon } from '@iconify/react';
import altArrowDownOutline from '@iconify-icons/solar/alt-arrow-down-outline';
import boxOutline from '@iconify-icons/solar/box-outline';
import chart2Outline from '@iconify-icons/solar/chart-2-outline';
import chatRoundOutline from '@iconify-icons/solar/chat-round-outline';
import closeCircleOutline from '@iconify-icons/solar/close-circle-outline';
import documentTextOutline from '@iconify-icons/solar/document-text-outline';
import folderWithFilesOutline from '@iconify-icons/solar/folder-with-files-outline';
import galleryBoldDuotone from '@iconify-icons/solar/gallery-bold-duotone';
import hamburgerMenuOutline from '@iconify-icons/solar/hamburger-menu-outline';
import homeSmileOutline from '@iconify-icons/solar/home-smile-outline';
import letterUnreadOutline from '@iconify-icons/solar/letter-unread-outline';
import logout2Outline from '@iconify-icons/solar/logout-2-outline';
import moonStarsOutline from '@iconify-icons/solar/moon-stars-outline';
import phoneCallingRoundedOutline from '@iconify-icons/solar/phone-calling-rounded-outline';
import sun2Outline from '@iconify-icons/solar/sun-2-outline';
import usersGroupRoundedOutline from '@iconify-icons/solar/users-group-rounded-outline';
import widget2Outline from '@iconify-icons/solar/widget-2-outline';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

[
    ['solar:alt-arrow-down-outline', altArrowDownOutline],
    ['solar:box-outline', boxOutline],
    ['solar:chart-2-outline', chart2Outline],
    ['solar:chat-round-outline', chatRoundOutline],
    ['solar:close-circle-outline', closeCircleOutline],
    ['solar:document-text-outline', documentTextOutline],
    ['solar:folder-with-files-outline', folderWithFilesOutline],
    ['solar:gallery-bold-duotone', galleryBoldDuotone],
    ['solar:hamburger-menu-outline', hamburgerMenuOutline],
    ['solar:home-smile-outline', homeSmileOutline],
    ['solar:letter-unread-outline', letterUnreadOutline],
    ['solar:logout-2-outline', logout2Outline],
    ['solar:moon-stars-outline', moonStarsOutline],
    ['solar:phone-calling-rounded-outline', phoneCallingRoundedOutline],
    ['solar:sun-2-outline', sun2Outline],
    ['solar:users-group-rounded-outline', usersGroupRoundedOutline],
    ['solar:widget-2-outline', widget2Outline],
].forEach(([name, data]) => addIcon(name, data));

createInertiaApp({

    title: (title) => `${title} - ${appName}`,

    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),

    setup({ el, App, props }) {

        const root = createRoot(el);

        root.render(<App {...props} />);

    },

    progress: {
        color: '#4B5563',
    },

});
