import React from 'react'
import type { MenuProps } from 'antd';
import { Button, Dropdown } from 'antd';
import { FlagEnglish, FlagVietNam } from 'src/assets/icons';
import i18n from 'src/i18n';

const items: MenuProps['items'] = [
    {
        key: 'vi',
        icon: <FlagVietNam className='w-4 h-4' />,
        label: (
            <span>Tiếng Việt</span>
        ),
    },
    {
        key: 'en',
        icon: <FlagEnglish className='w-4 h-4' />,
        label: (
            <span>English</span>
        ),
    }
];

const setLanguageCookie = (lang: string) => {
    document.cookie = `language=${lang}; path=/; max-age=31536000`; // lưu 1 năm
};

const handleMenuClick: MenuProps['onClick'] = (e) => {
    i18n.changeLanguage(e.key);
    setLanguageCookie(e.key);
};

const SwitchLanguage = () => {
    const currentFlag =
        i18n.language === 'vi'
            ? <FlagVietNam className="w-5 h-5" />
            : <FlagEnglish className="w-5 h-5" />;
    return (
        <Dropdown menu={{ items, onClick: handleMenuClick }} placement="bottom" arrow>
            <Button type='text'>{currentFlag}</Button>
        </Dropdown>
    )
}

export default SwitchLanguage