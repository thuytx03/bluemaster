"use client"
import { cn } from "@/lib/utils"
import { NotificationData } from "@/types"
import { AlertCircle, CheckCircle, Info, X } from "lucide-react"

interface AlertNotificationProps {
  notification: NotificationData
  className?: string
  onClose?: (id: number) => void
}

export function AlertNotification({ notification, className, onClose }: AlertNotificationProps) {
  const { type, message, id } = notification

  const getAlertStyles = () => {
    switch (type) {
      case "info":
        return {
          containerClass:
            "bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-950 dark:border-blue-400 dark:text-blue-200",
          icon: <Info className="h-5 w-5 text-blue-500 dark:text-blue-300" />,
        }
      case "success":
        return {
          containerClass:
            "bg-green-50 border-green-500 text-green-700 dark:bg-green-950 dark:border-green-400 dark:text-green-200",
          icon: <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-300" />,
        }
      case "warning":
        return {
          containerClass:
            "bg-yellow-50 border-yellow-500 text-yellow-700 dark:bg-yellow-950 dark:border-yellow-400 dark:text-yellow-200",
          icon: <AlertCircle className="h-5 w-5 text-yellow-700 dark:text-yellow-300" />,
        }
      case "error":
        return {
          containerClass:
            "bg-red-50 border-red-500 text-red-700 dark:bg-red-950 dark:border-red-400 dark:text-red-200",
          icon: <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-300" />,
        }
      default:
        return {
          containerClass:
            "bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-950 dark:border-blue-400 dark:text-blue-200",
          icon: <Info className="h-5 w-5 text-blue-500 dark:text-blue-300" />,
        }
    }
  }

  const { containerClass, icon } = getAlertStyles()

  return (
    <div
      className={cn(
        "relative flex items-center border-l-4 py-3 px-4 overflow-hidden group",
        containerClass,
        className
      )}
    >
      <div className="flex-shrink-0 mr-3">{icon}</div>
      <div className="marquee-container overflow-hidden flex-grow">
        <div className="marquee group-hover:pause">{message}</div>
      </div>
      {onClose && (
        <button
          onClick={() => onClose(id)}
          className="flex-shrink-0 ml-3 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors z-10"
          aria-label="Đóng thông báo"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
