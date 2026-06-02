import { Card, Typography } from 'antd'
import { Filter, MessageSquare, Send, Settings, ShieldCheck, Users } from 'lucide-react'
import React from 'react'
import useInboxStore from './store/inbox.store'
import Step1Scan from './components/steps/Step1Scan'
import Step2Filter from './components/steps/Step2Filter'
import Step3Compose from './components/steps/Step3Compose'
import Step4Config from './components/steps/Step4Config'
import Step5Confirm from './components/steps/Step5Confirm'
import Step6Send from './components/steps/Step6Send'

const { Title, Text } = Typography

const STEP_META = [
  { title: 'Quét khách', description: 'Chọn Fanpage/Profile', icon: <Users size={14} /> },
  { title: 'Lọc đối tượng', description: 'Filter khách hàng', icon: <Filter size={14} /> },
  { title: 'Soạn tin', description: 'Nội dung & đính kèm', icon: <MessageSquare size={14} /> },
  { title: 'Cấu hình', description: 'Thời gian & độ trễ', icon: <Settings size={14} /> },
  { title: 'Xác nhận', description: 'Kiểm tra chiến dịch', icon: <ShieldCheck size={14} /> },
  { title: 'Gửi tin', description: 'Live progress & báo cáo', icon: <Send size={14} /> },
]

const InboxPage: React.FC = () => {
  const { currentStep, campaign } = useInboxStore()

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <Step1Scan />
      case 2: return <Step2Filter />
      case 3: return <Step3Compose />
      case 4: return <Step4Config />
      case 5: return <Step5Confirm />
      case 6: return <Step6Send />
      default: return <Step1Scan />
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Title level={4} className="!mb-0 dark:!text-gray-100">Auto Inbox</Title>
          <Text className="text-gray-500 dark:text-gray-400 text-sm">
            Gửi tin nhắn hàng loạt đến khách hàng trên Facebook
          </Text>
        </div>
        {campaign.fanpageName && (
          <div className="text-right">
            <Text className="text-xs text-gray-400 dark:text-gray-500">Đang làm việc với</Text>
            <br />
            <Text strong className="dark:text-gray-200">{campaign.fanpageName}</Text>
            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${campaign.category === 'profile' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
              {campaign.category === 'profile' ? 'Profile' : 'Fanpage'}
            </span>
          </div>
        )}
      </div>

      {/* Custom Current Step Indicator */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 sm:p-4 mb-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-inner">
            {React.cloneElement(STEP_META[currentStep - 1].icon as React.ReactElement, { size: 20 })}
          </div>
          <div className="flex flex-col">
            <Text className="text-[10px] sm:text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-0.5">
              Bước {currentStep} / {STEP_META.length}
            </Text>
            <Title level={5} className="!mb-0 !text-sm sm:!text-base text-gray-800 dark:!text-gray-100">
              {STEP_META[currentStep - 1].title}
            </Title>
            <Text className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
              {STEP_META[currentStep - 1].description}
            </Text>
          </div>
        </div>

        {/* Segmented Progress Bar */}
        <div className="flex gap-1 sm:gap-1.5 items-center shrink-0">
          {STEP_META.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${i + 1 === currentStep ? 'w-4 sm:w-8 bg-blue-600 dark:bg-blue-500' :
                  i + 1 < currentStep ? 'w-1.5 sm:w-2 bg-blue-300 dark:bg-blue-800' : 'w-1.5 sm:w-2 bg-gray-100 dark:bg-gray-700'
                }`}
            />
          ))}
        </div>
      </div>

      {/* Step content */}
      <Card className="shadow-sm min-h-80 dark:bg-gray-800 dark:border-gray-700">
        {renderStep()}
      </Card>
    </div>
  )
}

export default InboxPage
