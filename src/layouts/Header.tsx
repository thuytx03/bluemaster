import React from 'react'
import { Layout } from 'antd';
import { TypeAnimation } from 'react-type-animation';
import { EXTENSION_INFO } from 'src/constants';

const { Header } = Layout;

const AppHeader = () => {
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
            <div className="text-base font-medium ">
                <TypeAnimation
                    sequence={[
                        `Chào mừng bạn đến với ${EXTENSION_INFO.displayName}`,
                        1000,
                        `${EXTENSION_INFO.description}`,
                        1000,
                    ]}
                    wrapper="span"
                    cursor={true}
                    repeat={Infinity}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text "
                />
            </div>
        </Header>
    )
}

export default AppHeader