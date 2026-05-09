import React from 'react'
import { Layout } from 'antd';
import { TypeAnimation } from 'react-type-animation';
import { EXTENSION_INFO } from 'src/constants';
import { useTranslation } from 'react-i18next';
import SwitchLanguage from '../components/SwitchLanguage';
import ToggerTheme from '../components/ToggerTheme';

const { Header } = Layout;

const AppHeader = () => {
    const { t } = useTranslation();
    return (
        <Header
            style={{
                display: "flex",
                alignItems: "center",
                height: 64,
                position: "sticky",
                top: 0,
                zIndex: 1000,
            }}
            className="bg-zinc-50 dark:bg-zinc-900 shadow border-b"
        >
            <div className='flex justify-between items-center w-full'>
                <div className="text-sm font-medium ">
                    <TypeAnimation
                        sequence={[
                            `${t('homepage_hero_title1')} ${t('homepage_hero_title2')} ${t('with')} ${EXTENSION_INFO.displayName}`,
                            1000,
                            `${t('homepage_hero_title1')} ${t('homepage_hero_title2')} ${t('with')} ${EXTENSION_INFO.displayName}`,
                            1000,
                        ]}
                        wrapper="span"
                        cursor={true}
                        repeat={Infinity}
                        className="bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text "
                    />
                </div>
                <div className='flex items-center '>
                    <ToggerTheme />
                    <SwitchLanguage />
                </div>
            </div>
        </Header>
    )
}

export default AppHeader